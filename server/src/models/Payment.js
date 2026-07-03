import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tailorId: { type: mongoose.Schema.Types.ObjectId, ref: "Tailor", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: ["razorpay", "cash"], default: "razorpay" },
    status: { type: String, enum: ["created", "captured", "failed", "refunded"], default: "created" },
    razorpayOrderId: String,
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: String,
    platformCommission: { type: Number, default: 0 },
    tailorPayoutStatus: { type: String, enum: ["pending", "paid"], default: "pending" }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
