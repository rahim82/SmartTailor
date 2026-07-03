import mongoose from "mongoose";

const statusValues = ["placed", "measurement", "cutting", "stitching", "trial", "ready", "delivered", "cancelled"];

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tailorId: { type: mongoose.Schema.Types.ObjectId, ref: "Tailor", required: true, index: true },
    measurementId: { type: mongoose.Schema.Types.ObjectId, ref: "Measurement" },
    garmentType: { type: String, required: true },
    fabricProvidedBy: { type: String, enum: ["customer", "tailor"], default: "customer" },
    designImages: [{ url: String, publicId: String }],
    instructions: String,
    status: { type: String, enum: statusValues, default: "placed", index: true },
    statusHistory: [
      {
        status: { type: String, enum: statusValues },
        note: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    pricing: {
      stitchingCharge: { type: Number, default: 0 },
      fabricCharge: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    dueDate: { type: Date, index: true },
    trialDate: Date,
    deliveryDate: Date,
    paymentStatus: { type: String, enum: ["pending", "partial", "paid", "refunded"], default: "pending" }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
