const { z } = require("zod");
const Goal = require("../models/Goal");

const createGoalSchema = z.object({
  body: z.object({
    scope: z.enum(["daily", "weekly", "monthly"]),
    title: z.string().min(2),
    targetDateKey: z.string().optional().default("")
  })
});

const listGoalSchema = z.object({
  query: z.object({
    scope: z.enum(["daily", "weekly", "monthly"]).optional()
  })
});

const updateGoalSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(2).optional(),
    completed: z.boolean().optional()
  })
});

async function createGoal(req, res, next) {
  try {
    const goal = await Goal.create({ ...req.validated.body, user: req.user._id });
    res.status(201).json({ goal });
  } catch (err) {
    next(err);
  }
}

async function listGoals(req, res, next) {
  try {
    const filter = { user: req.user._id };
    if (req.validated.query.scope) filter.scope = req.validated.query.scope;
    const goals = await Goal.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ goals });
  } catch (err) {
    next(err);
  }
}

async function updateGoal(req, res, next) {
  try {
    const { id } = req.validated.params;
    const patch = { ...req.validated.body };
    if (patch.completed === true) patch.completedAt = new Date();
    if (patch.completed === false) patch.completedAt = null;
    const goal = await Goal.findOneAndUpdate({ _id: id, user: req.user._id }, patch, { new: true });
    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }
    res.json({ goal });
  } catch (err) {
    next(err);
  }
}

async function deleteGoal(req, res, next) {
  try {
    const id = req.params.id;
    const result = await Goal.deleteOne({ _id: id, user: req.user._id });
    res.json({ ok: result.deletedCount === 1 });
  } catch (err) {
    next(err);
  }
}

module.exports = { createGoalSchema, listGoalSchema, updateGoalSchema, createGoal, listGoals, updateGoal, deleteGoal };

