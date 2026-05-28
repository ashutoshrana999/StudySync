const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    totalMinutes: { type: Number, default: 0 },
    method: { type: String, enum: ["static", "dynamic"], required: true }
  },
  { timestamps: true }
);

AttendanceSchema.index({ user: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);

