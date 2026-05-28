const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    audience: { type: String, enum: ["all", "student", "admin", "user"], default: "all", index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    channel: { type: String, enum: ["inapp", "email", "whatsapp", "sms"], default: "inapp" },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);

