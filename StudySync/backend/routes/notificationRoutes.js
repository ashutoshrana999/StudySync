const express = require("express");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { createNotificationSchema, adminCreate, myNotifications } = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);
router.get("/me", requireRole("student", "admin"), myNotifications);
router.post("/", requireRole("admin"), validate(createNotificationSchema), adminCreate);

module.exports = router;

