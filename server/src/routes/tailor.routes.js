import { Router } from "express";
import { getTailor, listTailors, tailorDashboard, upsertProfile, listCustomers } from "../controllers/tailor.controller.js";
import { tailorOrders, updateOrderStatus, deleteOrder } from "../controllers/order.controller.js";
import { createMeasurement } from "../controllers/measurement.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listTailors);
router.get("/:id", getTailor);
router.post("/profile", authenticate, authorize("tailor"), upsertProfile);
router.get("/me/dashboard", authenticate, authorize("tailor"), tailorDashboard);
router.get("/me/orders", authenticate, authorize("tailor"), tailorOrders);
router.get("/me/customers", authenticate, authorize("tailor"), listCustomers);
router.patch("/orders/:id/status", authenticate, authorize("tailor"), updateOrderStatus);
router.delete("/orders/:id", authenticate, authorize("tailor"), deleteOrder);
router.post("/customers/:customerId/measurements", authenticate, authorize("tailor"), createMeasurement);

export default router;
