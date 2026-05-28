const express = require("express");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const {
  createGoalSchema,
  listGoalSchema,
  updateGoalSchema,
  createGoal,
  listGoals,
  updateGoal,
  deleteGoal
} = require("../controllers/goalController");

const router = express.Router();

router.use(protect, requireRole("student", "admin"));

router.post("/", validate(createGoalSchema), createGoal);
router.get("/", validate(listGoalSchema), listGoals);
router.patch("/:id", validate(updateGoalSchema), updateGoal);
router.delete("/:id", deleteGoal);

module.exports = router;

