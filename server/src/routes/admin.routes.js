import { Router } from "express";
import {
  dashboard,
  listOrdersAdmin,
  listPaymentsAdmin,
  listTailorsAdmin,
  listUsers,
  updateUserStatus,
  verifyTailor
} from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, authorize("admin"));
router.get("/dashboard", dashboard);
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.get("/tailors", listTailorsAdmin);
router.patch("/tailors/:id/verify", verifyTailor);
router.get("/orders", listOrdersAdmin);
router.get("/payments", listPaymentsAdmin);

export default router;
