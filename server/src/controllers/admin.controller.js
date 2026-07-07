import { User } from "../models/User.js";
import { Tailor } from "../models/Tailor.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";

export async function dashboard(_req, res, next) {
  try {
    const [users, tailors, orders, payments] = await Promise.all([
      User.countDocuments(),
      Tailor.countDocuments(),
      Order.countDocuments(),
      Payment.find({ status: "captured" })
    ]);

    const gmv = payments.reduce((sum, payment) => sum + payment.amount, 0);
    res.json({ stats: { users, tailors, orders, gmv } });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(_req, res, next) {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true }).select("-passwordHash");
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function listTailorsAdmin(_req, res, next) {
  try {
    const tailors = await Tailor.find().populate("userId", "name phone email").sort({ createdAt: -1 });
    res.json({ tailors });
  } catch (error) {
    next(error);
  }
}

export async function verifyTailor(req, res, next) {
  try {
    const tailor = await Tailor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: req.body.verificationStatus },
      { new: true }
    );

    const io = req.app.get("io");
    if (io) io.emit("tailor:updated", tailor);

    res.json({ tailor });
  } catch (error) {
    next(error);
  }
}

export async function listOrdersAdmin(_req, res, next) {
  try {
    const orders = await Order.find().populate("customerId tailorId").sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function listPaymentsAdmin(_req, res, next) {
  try {
    const payments = await Payment.find().populate("orderId customerId tailorId").sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    next(error);
  }
}

export async function deleteTailor(req, res, next) {
  try {
    const tailor = await Tailor.findById(req.params.id);
    if (!tailor) {
      return res.status(404).json({ message: "Tailor not found" });
    }

    await Promise.all([
      Tailor.findByIdAndDelete(req.params.id),
      User.findByIdAndDelete(tailor.userId)
    ]);

    res.json({ success: true, message: "Tailor profile and user account permanently deleted" });
  } catch (error) {
    next(error);
  }
}
