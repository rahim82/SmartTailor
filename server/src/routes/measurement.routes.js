import { Router } from "express";
import { createMeasurement, listMeasurements, updateMeasurement, deleteMeasurement } from "../controllers/measurement.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.post("/", createMeasurement);
router.get("/", listMeasurements);
router.put("/:id", updateMeasurement);
router.delete("/:id", deleteMeasurement);

export default router;
