import { Router } from "express";
import { listNotifications, markRead } from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/", listNotifications);
router.patch("/:id/read", markRead);

export default router;
