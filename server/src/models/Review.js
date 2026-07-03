import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tailorId: { type: mongoose.Schema.Types.ObjectId, ref: "Tailor", required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    images: [{ url: String, publicId: String }],
    reply: String
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
