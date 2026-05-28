const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["admin", "student"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true },

    active: { type: Boolean, default: true, index: true },
    profileImageUrl: { type: String, default: "" },

    seatId: { type: mongoose.Schema.Types.ObjectId, ref: "Seat", default: null },
    seatNumber: { type: String, default: "" },
    shift: { type: String, enum: ["morning", "evening", "full"], default: "full" },

    planName: { type: String, default: "Standard" },
    monthlyFee: { type: Number, default: 0 },
    nextRenewalDate: { type: Date, default: null },

    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

