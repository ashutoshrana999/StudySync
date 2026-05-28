const express = require("express");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const {
  markSchema,
  monthlyReportSchema,
  markAttendance,
  myHistory,
  myMonthlyReport,
  adminUserHistory
} = require("../controllers/attendanceController");

const router = express.Router();

router.use(protect);

router.post("/mark", validate(markSchema), requireRole("student", "admin"), markAttendance);
router.get("/me/history", requireRole("student", "admin"), myHistory);
router.get("/me/monthly", validate(monthlyReportSchema), requireRole("student", "admin"), myMonthlyReport);

router.get("/admin/user/:userId/history", requireRole("admin"), adminUserHistory);

module.exports = router;

