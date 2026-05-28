const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { mySummary } = require("../controllers/userController");

const router = express.Router();

router.use(protect);
router.get("/me/summary", mySummary);

module.exports = router;

