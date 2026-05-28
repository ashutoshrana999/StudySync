const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    monthKey: { type: String, required: true, index: true }, // YYYY-MM
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "unpaid"], default: "paid", index: true },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date, default: null },
    invoiceNumber: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: true }
);

PaymentSchema.index({ user: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model("Payment", PaymentSchema);

