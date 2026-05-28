const bcrypt = require("bcryptjs");
const { z } = require("zod");
const QRCode = require("qrcode");
const dayjs = require("dayjs");

const User = require("../models/User");
const Seat = require("../models/Seat");
const Attendance = require("../models/Attendance");
const Payment = require("../models/Payment");
const { dateKeyFromDate, monthKeyFromDate, startOfMonth, endOfMonth } = require("../utils/date");
const { makeDynamicQrCodePayload, makeStaticQrPayload } = require("../utils/qr");

const createStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional().default(""),
    password: z.string().min(6).optional().default("Welcome@123"),
    shift: z.enum(["morning", "evening", "full"]).optional().default("full"),
    planName: z.string().optional().default("Standard"),
    monthlyFee: z.number().nonnegative().optional().default(0),
    nextRenewalDate: z.string().optional().default("")
  })
});

const updateStudentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    active: z.boolean().optional(),
    shift: z.enum(["morning", "evening", "full"]).optional(),
    planName: z.string().optional(),
    monthlyFee: z.number().nonnegative().optional(),
    nextRenewalDate: z.string().optional(),
    seatId: z.string().optional().nullable()
  })
});

const seatAssignSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    seatId: z.string().min(1),
    shift: z.enum(["morning", "evening", "full"]).optional()
  })
});

async function dashboard(req, res, next) {
  try {
    const todayKey = dateKeyFromDate();
    const monthKey = monthKeyFromDate();
    const now = new Date();

    const [totalStudents, activeStudents, todayAttendance, seatsTotal, seatsOccupied] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", active: true }),
      Attendance.countDocuments({ dateKey: todayKey }),
      Seat.countDocuments({}),
      Seat.countDocuments({ assignedTo: { $ne: null } })
    ]);

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const revenueAgg = await Payment.aggregate([
      { $match: { status: "paid", paidAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const monthlyRevenue = revenueAgg[0]?.total || 0;

    const dueStudents = await User.countDocuments({
      role: "student",
      active: true,
      monthlyFee: { $gt: 0 },
      nextRenewalDate: { $ne: null, $lt: now }
    });

    // Chart: daily attendance this month
    const attendanceThisMonth = await Attendance.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: "$dateKey", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Chart: revenue by monthKey (last 6 months, based on monthKey field)
    const revenueByMonth = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$monthKey", total: { $sum: "$amount" } } },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    res.json({
      kpis: {
        totalStudents,
        activeStudents,
        todayAttendance,
        monthlyRevenue,
        duePayments: dueStudents,
        availableSeats: seatsTotal - seatsOccupied,
        occupiedSeats: seatsOccupied
      },
      charts: {
        attendanceThisMonth,
        revenueByMonth: revenueByMonth.reverse(),
        currentMonthKey: monthKey
      }
    });
  } catch (err) {
    next(err);
  }
}

async function listStudents(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const filter = { role: "student" };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ];
    }

    const students = await User.find(filter)
      .sort({ createdAt: -1 })
      .select("-passwordHash");
    res.json({ students });
  } catch (err) {
    next(err);
  }
}

async function createStudent(req, res, next) {
  try {
    const { name, email, phone, password, shift, planName, monthlyFee, nextRenewalDate } = req.validated.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(409);
      throw new Error("Email already in use");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      role: "student",
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      passwordHash,
      shift,
      planName,
      monthlyFee,
      nextRenewalDate: nextRenewalDate ? dayjs(nextRenewalDate).toDate() : null,
      active: true
    });
    res.status(201).json({ student: await User.findById(user._id).select("-passwordHash") });
  } catch (err) {
    next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const { id } = req.validated.params;
    const patch = { ...req.validated.body };

    if (patch.nextRenewalDate !== undefined) {
      patch.nextRenewalDate = patch.nextRenewalDate ? dayjs(patch.nextRenewalDate).toDate() : null;
    }

    // Seat assignment is handled by a dedicated endpoint to keep Seat/User in sync.
    delete patch.seatId;

    const student = await User.findOneAndUpdate({ _id: id, role: "student" }, patch, { new: true }).select(
      "-passwordHash"
    );
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    res.json({ student });
  } catch (err) {
    next(err);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const id = req.params.id;
    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    // If assigned to a seat, free it.
    if (student.seatId) {
      await Seat.updateOne({ _id: student.seatId }, { $set: { assignedTo: null } });
    }

    await User.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function uploadProfileImage(req, res, next) {
  try {
    const id = req.params.id;
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }
    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    student.profileImageUrl = `/uploads/${req.file.filename}`;
    await student.save();
    res.json({ student: await User.findById(student._id).select("-passwordHash") });
  } catch (err) {
    next(err);
  }
}

async function assignSeat(req, res, next) {
  try {
    const { id } = req.validated.params;
    const { seatId, shift } = req.validated.body;

    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      res.status(404);
      throw new Error("Seat not found");
    }
    if (seat.assignedTo && String(seat.assignedTo) !== String(student._id)) {
      res.status(409);
      throw new Error("Seat already occupied");
    }

    // Free previous seat (if any and not same)
    if (student.seatId && String(student.seatId) !== String(seat._id)) {
      await Seat.updateOne({ _id: student.seatId }, { $set: { assignedTo: null } });
    }

    seat.assignedTo = student._id;
    await seat.save();

    student.seatId = seat._id;
    student.seatNumber = seat.seatNumber;
    if (shift) student.shift = shift;
    await student.save();

    res.json({ student: await User.findById(student._id).select("-passwordHash"), seat });
  } catch (err) {
    next(err);
  }
}

async function unassignSeat(req, res, next) {
  try {
    const id = req.params.id;
    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    if (student.seatId) {
      await Seat.updateOne({ _id: student.seatId }, { $set: { assignedTo: null } });
    }
    student.seatId = null;
    student.seatNumber = "";
    await student.save();
    res.json({ student: await User.findById(student._id).select("-passwordHash") });
  } catch (err) {
    next(err);
  }
}

async function getStaticQr(req, res, next) {
  try {
    const payload = makeStaticQrPayload();
    const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 280 });
    res.json({ type: "static", payload, dataUrl });
  } catch (err) {
    next(err);
  }
}

async function getDynamicQr(req, res, next) {
  try {
    const payload = makeDynamicQrCodePayload();
    const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 280 });
    res.json({ type: "dynamic", payload, dataUrl, refreshSeconds: 30 });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  seatAssignSchema,
  dashboard,
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadProfileImage,
  assignSeat,
  unassignSeat,
  getStaticQr,
  getDynamicQr
};

