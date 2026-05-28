const { z } = require("zod");
const Seat = require("../models/Seat");
const User = require("../models/User");

const createSeatSchema = z.object({
  body: z.object({
    seatNumber: z.string().min(1),
    type: z.enum(["fixed", "flexible"]).optional().default("fixed"),
    allowedShift: z.enum(["morning", "evening", "full"]).optional().default("full")
  })
});

const bulkCreateSchema = z.object({
  body: z.object({
    prefix: z.string().optional().default("S"),
    from: z.number().int().min(1),
    to: z.number().int().min(1),
    type: z.enum(["fixed", "flexible"]).optional().default("fixed"),
    allowedShift: z.enum(["morning", "evening", "full"]).optional().default("full")
  })
});

const assignSchema = z.object({
  body: z.object({
    userId: z.string().min(1).nullable().optional()
  })
});

async function listSeats(req, res, next) {
  try {
    const seats = await Seat.find({}).sort({ seatNumber: 1 }).populate("assignedTo", "name email");
    res.json({ seats });
  } catch (err) {
    next(err);
  }
}

async function createSeat(req, res, next) {
  try {
    const seat = await Seat.create(req.validated.body);
    res.status(201).json({ seat });
  } catch (err) {
    next(err);
  }
}

async function bulkCreate(req, res, next) {
  try {
    const { prefix, from, to, type, allowedShift } = req.validated.body;
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    const docs = [];
    for (let i = start; i <= end; i += 1) {
      docs.push({ seatNumber: `${prefix}${String(i).padStart(2, "0")}`, type, allowedShift });
    }
    const created = await Seat.insertMany(docs, { ordered: false });
    res.status(201).json({ createdCount: created.length });
  } catch (err) {
    // insertMany ordered:false may throw dup errors; still return a friendly message
    if (String(err.message || "").includes("E11000")) {
      res.status(201).json({ createdCount: 0, note: "Some seats already existed" });
      return;
    }
    next(err);
  }
}

async function assignSeatToUser(req, res, next) {
  try {
    const seatId = req.params.seatId;
    const { userId } = req.validated.body;

    const seat = await Seat.findById(seatId);
    if (!seat) {
      res.status(404);
      throw new Error("Seat not found");
    }

    // Unassign seat
    if (!userId) {
      if (seat.assignedTo) {
        await User.updateOne({ _id: seat.assignedTo }, { $set: { seatId: null, seatNumber: "" } });
      }
      seat.assignedTo = null;
      await seat.save();
      return res.json({ seat });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "student") {
      res.status(404);
      throw new Error("Student not found");
    }

    if (seat.assignedTo && String(seat.assignedTo) !== String(user._id)) {
      res.status(409);
      throw new Error("Seat already occupied");
    }

    // Free user's previous seat
    if (user.seatId && String(user.seatId) !== String(seat._id)) {
      await Seat.updateOne({ _id: user.seatId }, { $set: { assignedTo: null } });
    }

    seat.assignedTo = user._id;
    await seat.save();

    user.seatId = seat._id;
    user.seatNumber = seat.seatNumber;
    await user.save();

    res.json({ seat });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSeatSchema,
  bulkCreateSchema,
  assignSchema,
  listSeats,
  createSeat,
  bulkCreate,
  assignSeatToUser
};

