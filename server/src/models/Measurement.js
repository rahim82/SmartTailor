import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tailorId: { type: mongoose.Schema.Types.ObjectId, ref: "Tailor" },
    profileName: { type: String, default: "Self" },
    gender: { type: String, enum: ["female", "male", "kids", "other"], default: "other" },
    garmentType: { type: String, required: true, index: true },
    values: {
      chest: Number,
      waist: Number,
      hip: Number,
      shoulder: Number,
      sleeve: Number,
      neck: Number,
      inseam: Number,
      length: Number,
      armhole: Number,
      blouseLength: Number,
      salwarLength: Number
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Measurement = mongoose.model("Measurement", measurementSchema);
