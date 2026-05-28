const dayjs = require("dayjs");
const Attendance = require("../models/Attendance");
const Payment = require("../models/Payment");
const Goal = require("../models/Goal");
const { dateKeyFromDate, monthKeyFromDate } = require("../utils/date");

function calcStreak(dateKeysSet) {
  let streak = 0;
  let cursor = dayjs();
  while (true) {
    const key = cursor.format("YYYY-MM-DD");
    if (!dateKeysSet.has(key)) break;
    streak += 1;
    cursor = cursor.subtract(1, "day");
  }
  return streak;
}

async function mySummary(req, res, next) {
  try {
    const todayKey = dateKeyFromDate();
    const monthKey = monthKeyFromDate();
    const start = `${monthKey}-01`;
    const end = `${monthKey}-31`;

    const [monthRows, todayRow, paidThisMonth, goals] = await Promise.all([
      Attendance.find({ user: req.user._id, dateKey: { $gte: start, $lte: end } }).sort({ dateKey: 1 }),
      Attendance.findOne({ user: req.user._id, dateKey: todayKey }),
      Payment.findOne({ user: req.user._id, monthKey, status: "paid" }),
      Goal.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(500)
    ]);

    const presentDays = monthRows.filter((r) => r.checkInAt).length;
    const totalMinutes = monthRows.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);

    const daysSoFar = dayjs().date();
    const attendancePct = daysSoFar > 0 ? Math.round((presentDays / daysSoFar) * 100) : 0;

    const dateKeysSet = new Set(monthRows.filter((r) => r.checkInAt).map((r) => r.dateKey));
    const streak = calcStreak(dateKeysSet);

    let todayMinutes = 0;
    if (todayRow?.checkInAt && !todayRow.checkOutAt) {
      todayMinutes = Math.max(0, Math.round((Date.now() - todayRow.checkInAt.getTime()) / 60000));
    } else if (todayRow?.totalMinutes) {
      todayMinutes = todayRow.totalMinutes;
    }

    const due =
      paidThisMonth ? 0 : req.user.monthlyFee > 0 && req.user.nextRenewalDate && req.user.nextRenewalDate < new Date()
        ? req.user.monthlyFee
        : 0;

    const last7 = [];
    for (let i = 6; i >= 0; i -= 1) {
      const key = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const row = monthRows.find((r) => r.dateKey === key);
      last7.push({ dateKey: key, minutes: row?.totalMinutes || 0 });
    }

    const goalStats = {
      daily: { total: 0, done: 0 },
      weekly: { total: 0, done: 0 },
      monthly: { total: 0, done: 0 }
    };
    for (const g of goals) {
      goalStats[g.scope].total += 1;
      if (g.completed) goalStats[g.scope].done += 1;
    }

    res.json({
      user: {
        id: req.user._id,
        role: req.user.role,
        name: req.user.name,
        email: req.user.email,
        seatNumber: req.user.seatNumber,
        shift: req.user.shift,
        planName: req.user.planName,
        monthlyFee: req.user.monthlyFee,
        nextRenewalDate: req.user.nextRenewalDate,
        profileImageUrl: req.user.profileImageUrl
      },
      metrics: {
        monthKey,
        attendancePct,
        presentDays,
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        todayMinutes,
        todayHours: Math.round((todayMinutes / 60) * 10) / 10,
        streak,
        due
      },
      charts: { last7 },
      goals: goalStats
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { mySummary };

