const mongoose = require("mongoose");

const SeatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ["fixed", "flexible"], default: "fixed", index: true },
    allowedShift: { type: String, enum: ["morning", "evening", "full"], default: "full" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true }
  },
  { timestamps: true }
);

SeatSchema.virtual("isOccupied").get(function isOccupied() {
  return Boolean(this.assignedTo);
});

module.exports = mongoose.model("Seat", SeatSchema);

