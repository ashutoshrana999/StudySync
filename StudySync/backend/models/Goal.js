const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scope: { type: String, enum: ["daily", "weekly", "monthly"], required: true, index: true },
    title: { type: String, required: true, trim: true },
    targetDateKey: { type: String, default: "" }, // YYYY-MM-DD (optional)
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", GoalSchema);

