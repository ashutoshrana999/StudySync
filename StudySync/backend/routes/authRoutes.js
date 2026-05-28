const express = require("express");
const { validate } = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");
const { registerSchema, loginSchema, register, login, me } = require("../controllers/authController");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);

module.exports = router;

