import { uploadBuffer } from "../services/cloudinary.service.js";

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Image file is required" });
    const result = await uploadBuffer(req.file.buffer, "smarttailor");
    res.status(201).json({ image: { url: result.secure_url, publicId: result.public_id } });
  } catch (error) {
    next(error);
  }
}
