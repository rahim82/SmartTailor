import { Router } from "express";
import { createPaymentOrder, verifyPayment } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/create-order", authenticate, createPaymentOrder);
router.post("/verify", authenticate, verifyPayment);

export default router;
