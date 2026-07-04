import mongoose from "mongoose";

const tailorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    shopName: { type: String, required: true, trim: true },
    description: String,
    services: [{
      name: { type: String, required: true },
      price: { type: Number, required: true }
    }],
    location: {
      address: String,
      city: { type: String, index: true },
      state: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    workingHours: String,
    portfolioImages: [{ url: String, publicId: String }],
    ratingAvg: { type: Number, default: 0, index: true },
    totalReviews: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "pro", "enterprise"],
      default: "free"
    }
  },
  { timestamps: true }
);

export const Tailor = mongoose.model("Tailor", tailorSchema);
