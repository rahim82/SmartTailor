import { uploadBuffer, deleteImage } from "../services/cloudinary.service.js";
import { Tailor } from "../models/Tailor.js";
import { Order } from "../models/Order.js";

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Image file is required" });
    const result = await uploadBuffer(req.file.buffer, "smarttailor");
    res.status(201).json({ image: { url: result.secure_url, publicId: result.public_id } });
  } catch (error) {
    next(error);
  }
}

export async function deleteUploadedImage(req, res, next) {
  try {
    const { publicId, url, context } = req.body || {};
    const targetType = context?.targetType || req.body?.targetType;

    // 1. Delete from Cloudinary Storage
    if (publicId) {
      await deleteImage(publicId);
    }

    // 2. Database Cleanup if associated with persistent models
    if (targetType === "tailorShopImage" && req.user) {
      await Tailor.findOneAndUpdate(
        { userId: req.user.id || req.user._id },
        { 
          $unset: { shopImageUrl: "", shopImagePublicId: "" },
          $pull: { portfolioImages: { publicId } }
        }
      );
    } else if (targetType === "orderDesignImage" && req.user) {
      if (context?.orderId || req.body?.orderId) {
        await Order.findByIdAndUpdate(context?.orderId || req.body?.orderId, {
          $pull: { designImages: { publicId } }
        });
      }
    }

    res.json({ success: true, message: "Image removed from Cloudinary and database." });
  } catch (error) {
    next(error);
  }
}
