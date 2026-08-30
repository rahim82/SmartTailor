import { Router } from "express";
import multer from "multer";
import { uploadImage, deleteUploadedImage } from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/images", authenticate, upload.single("image"), uploadImage);
router.delete("/images", authenticate, deleteUploadedImage);
router.post("/images/delete", authenticate, deleteUploadedImage);

export default router;
