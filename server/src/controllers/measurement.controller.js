import { Measurement } from "../models/Measurement.js";

export async function createMeasurement(req, res, next) {
  try {
    const customerId = req.user.role === "customer" ? req.user._id : (req.params.customerId || req.body.customerId);
    const measurement = await Measurement.create({ ...req.body, customerId, createdBy: req.user._id });
    res.status(201).json({ measurement });
  } catch (error) {
    next(error);
  }
}

export async function listMeasurements(req, res, next) {
  try {
    const filter = req.user.role === "customer" ? { customerId: req.user._id } : {};
    const measurements = await Measurement.find(filter).populate("customerId", "name phone").sort({ updatedAt: -1 });
    res.json({ measurements });
  } catch (error) {
    next(error);
  }
}

export async function updateMeasurement(req, res, next) {
  try {
    const measurement = await Measurement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!measurement) return res.status(404).json({ message: "Measurement not found" });
    res.json({ measurement });
  } catch (error) {
    next(error);
  }
}

export async function deleteMeasurement(req, res, next) {
  try {
    const measurement = await Measurement.findByIdAndDelete(req.params.id);
    if (!measurement) return res.status(404).json({ message: "Measurement not found" });
    res.json({ message: "Measurement profile deleted successfully" });
  } catch (error) {
    next(error);
  }
}
