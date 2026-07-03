import { Router } from "express";
import { createOrder, getOrder, myOrders } from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.post("/", authorize("customer"), createOrder);
router.get("/my", authorize("customer"), myOrders);
router.get("/:id", getOrder);

export default router;
