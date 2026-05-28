const { z } = require("zod");
const dayjs = require("dayjs");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { invoiceNumber } = require("../utils/invoiceNumber");
const { buildInvoicePdf } = require("../utils/invoice");
const { monthKeyFromDate } = require("../utils/date");

const createPaymentSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    monthKey: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    amount: z.number().positive(),
    dueDate: z.string().min(4),
    status: z.enum(["paid", "unpaid"]).optional().default("paid")
  })
});

async function adminCreatePayment(req, res, next) {
  try {
    const { userId, monthKey, amount, dueDate, status } = req.validated.body;
    const student = await User.findById(userId);
    if (!student || student.role !== "student") {
      res.status(404);
      throw new Error("Student not found");
    }

    const mKey = monthKey || monthKeyFromDate();
    const inv = invoiceNumber();
    const payment = await Payment.create({
      user: student._id,
      monthKey: mKey,
      amount,
      status,
      dueDate: dayjs(dueDate).toDate(),
      paidAt: status === "paid" ? new Date() : null,
      invoiceNumber: inv
    });

    // Optional: bump renewal date
    if (status === "paid") {
      student.nextRenewalDate = dayjs(dueDate).add(1, "month").toDate();
      await student.save();
    }

    res.status(201).json({ payment });
  } catch (err) {
    if (String(err.message || "").includes("E11000")) {
      res.status(409);
      next(new Error("Payment for this month already exists for this student"));
      return;
    }
    next(err);
  }
}

async function adminListPayments(req, res, next) {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .populate("user", "name email seatNumber");
    res.json({ payments });
  } catch (err) {
    next(err);
  }
}

async function myPayments(req, res, next) {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ monthKey: -1 });
    res.json({ payments });
  } catch (err) {
    next(err);
  }
}

async function dueSummary(req, res, next) {
  try {
    const now = new Date();
    const monthKey = monthKeyFromDate(now);
    const paidThisMonth = await Payment.findOne({ user: req.user._id, monthKey, status: "paid" });
    if (paidThisMonth) return res.json({ monthKey, due: 0, reason: "Paid this month" });

    if (req.user.monthlyFee > 0 && req.user.nextRenewalDate && req.user.nextRenewalDate < now) {
      return res.json({ monthKey, due: req.user.monthlyFee, reason: "Renewal due" });
    }
    return res.json({ monthKey, due: 0, reason: "No due" });
  } catch (err) {
    next(err);
  }
}

async function downloadInvoice(req, res, next) {
  try {
    const id = req.params.paymentId;
    const payment = await Payment.findById(id).populate("user", "name email phone planName seatNumber shift");
    if (!payment) {
      res.status(404);
      throw new Error("Payment not found");
    }

    // Admin can download any, student can only download own.
    if (req.user.role !== "admin" && String(payment.user._id) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Forbidden");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${payment.invoiceNumber}.pdf"`);

    const doc = buildInvoicePdf({
      logoText: "StudySync",
      invoiceNumber: payment.invoiceNumber,
      student: payment.user,
      payment
    });
    doc.pipe(res);
    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPaymentSchema,
  adminCreatePayment,
  adminListPayments,
  myPayments,
  dueSummary,
  downloadInvoice
};

