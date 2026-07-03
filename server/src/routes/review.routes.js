import { Router } from "express";
import { createReview } from "../controllers/review.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, authorize("customer"), createReview);

export default router;
