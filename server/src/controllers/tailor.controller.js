import { Tailor } from "../models/Tailor.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";

export async function listTailors(req, res, next) {
  try {
    const { city, service } = req.query;
    const filter = { verificationStatus: "verified" };
    if (city) filter["location.city"] = new RegExp(city, "i");
    if (service) filter["services.name"] = service;

    const tailors = await Tailor.find(filter)
      .select("shopName description services location ratingAvg totalReviews portfolioImages userId")
      .populate("userId", "name phone avatarUrl")
      .sort({ ratingAvg: -1 });
    res.json({ tailors });
  } catch (error) {
    next(error);
  }
}

export async function getTailor(req, res, next) {
  try {
    const tailor = await Tailor.findById(req.params.id).populate("userId", "name phone avatarUrl");
    if (!tailor) return res.status(404).json({ message: "Tailor not found" });
    res.json({ tailor });
  } catch (error) {
    next(error);
  }
}

export async function upsertProfile(req, res, next) {
  try {
    const profile = await Tailor.findOneAndUpdate(
      { userId: req.user._id },
      { ...req.body, userId: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    const io = req.app.get("io");
    if (io) {
      io.emit("admin:refresh");
      io.emit("tailor:updated", profile);
    }

    res.json({ tailor: profile });
  } catch (error) {
    next(error);
  }
}

export async function tailorDashboard(req, res, next) {
  try {
    const tailor = await Tailor.findOne({ userId: req.user._id });
    if (!tailor) return res.status(404).json({ message: "Create tailor profile first" });

    const [orders, dueSoon] = await Promise.all([
      Order.find({ tailorId: tailor._id }).populate("customerId", "name phone").sort({ createdAt: -1 }).limit(20),
      Order.countDocuments({ tailorId: tailor._id, status: { $nin: ["delivered", "cancelled"] } })
    ]);

    res.json({ tailor, stats: { activeOrders: dueSoon }, orders });
  } catch (error) {
    next(error);
  }
}

export async function listCustomers(req, res, next) {
  try {
    const customers = await User.find({ role: "customer" }).select("name phone email").sort({ name: 1 });
    res.json({ customers });
  } catch (error) {
    next(error);
  }
}
