const { z } = require("zod");
const Attendance = require("../models/Attendance");
const { dateKeyFromDate } = require("../utils/date");
const { validateDynamicQrPayload, validateStaticQrPayload } = require("../utils/qr");

const markSchema = z.object({
  body: z.object({
    type: z.enum(["static", "dynamic"]),
    payload: z.string().min(3)
  })
});

const monthlyReportSchema = z.object({
  query: z.object({
    monthKey: z.string().regex(/^\d{4}-\d{2}$/).optional()
  })
});

function minutesBetween(a, b) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

async function markAttendance(req, res, next) {
  try {
    const { type, payload } = req.validated.body;

    const validation = type === "static" ? validateStaticQrPayload(payload) : validateDynamicQrPayload(payload);
    if (!validation.ok) {
      res.status(400);
      throw new Error(`QR validation failed: ${validation.reason}`);
    }

    const dateKey = dateKeyFromDate();
    const now = new Date();

    let attendance = await Attendance.findOne({ user: req.user._id, dateKey });
    if (!attendance) {
      attendance = await Attendance.create({
        user: req.user._id,
        dateKey,
        checkInAt: now,
        method: type
      });
      return res.status(201).json({ status: "checked_in", attendance });
    }

    if (attendance.checkInAt && !attendance.checkOutAt) {
      attendance.checkOutAt = now;
      attendance.totalMinutes = minutesBetween(attendance.checkInAt, now);
      attendance.method = type;
      await attendance.save();
      return res.json({ status: "checked_out", attendance });
    }

    res.json({ status: "already_done", attendance });
  } catch (err) {
    next(err);
  }
}

async function myHistory(req, res, next) {
  try {
    const history = await Attendance.find({ user: req.user._id }).sort({ dateKey: -1 }).limit(120);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

async function myMonthlyReport(req, res, next) {
  try {
    const monthKey = req.validated.query.monthKey || new Date().toISOString().slice(0, 7);
    const start = `${monthKey}-01`;
    const end = `${monthKey}-31`;

    const rows = await Attendance.find({
      user: req.user._id,
      dateKey: { $gte: start, $lte: end }
    }).sort({ dateKey: 1 });

    const totalMinutes = rows.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);
    const presentDays = rows.filter((r) => r.checkInAt).length;
    const completedDays = rows.filter((r) => r.checkInAt && r.checkOutAt).length;

    res.json({
      monthKey,
      presentDays,
      completedDays,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      days: rows
    });
  } catch (err) {
    next(err);
  }
}

async function adminUserHistory(req, res, next) {
  try {
    const userId = req.params.userId;
    const history = await Attendance.find({ user: userId }).sort({ dateKey: -1 }).limit(180);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

module.exports = { markSchema, monthlyReportSchema, markAttendance, myHistory, myMonthlyReport, adminUserHistory };

