import { Router } from "express";
import { createOrder, getOrder, myOrders, trackOrder, createWalkInOrder } from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes (bypass authentication)
router.get("/track", trackOrder);

// Authenticated routes
router.use(authenticate);
router.post("/", authorize("customer"), createOrder);
router.post("/walk-in", authorize("tailor"), createWalkInOrder);
router.get("/my", authorize("customer"), myOrders);
router.get("/:id", getOrder);

export default router;

