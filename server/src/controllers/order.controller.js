import { Order } from "../models/Order.js";
import { Tailor } from "../models/Tailor.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { sendSMS, sendWhatsApp } from "../services/messaging.service.js";

function makeOrderNo() {
  return `ST-${Date.now().toString(36).toUpperCase()}`;
}

export async function createOrder(req, res, next) {
  try {
    const order = await Order.create({
      ...req.body,
      orderNo: makeOrderNo(),
      customerId: req.user._id,
      statusHistory: [{ status: "placed", note: "Order placed", changedBy: req.user._id }]
    });

    const tailor = await Tailor.findById(order.tailorId);
    if (tailor) {
      const notification = await Notification.create({
        userId: tailor.userId,
        type: "order",
        title: "New order received",
        message: `Order ${order.orderNo} has been placed.`,
        orderId: order._id
      });
      req.app.get("io").to(tailor.userId.toString()).emit("notification:new", notification);

      // WhatsApp/SMS to Tailor User
      const tailorUser = await User.findById(tailor.userId);
      if (tailorUser && tailorUser.phone) {
        const tailorMsg = `Hello ${tailorUser.name}, you have received a new order ${order.orderNo} for stitching a ${order.garmentType} at your boutique "${tailor.shopName}". Please log in to review the order.`;
        sendWhatsApp(tailorUser.phone, tailorMsg);
        sendSMS(tailorUser.phone, tailorMsg);
      }
    }

    // WhatsApp/SMS to Customer User
    if (req.user && req.user.phone) {
      const customerMsg = `Hello ${req.user.name}, your stitching order ${order.orderNo} for ${order.garmentType} has been successfully placed at ${tailor?.shopName || "the boutique"}. You can track status updates in your dashboard.`;
      sendWhatsApp(req.user.phone, customerMsg);
      sendSMS(req.user.phone, customerMsg);
    }

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
}

export async function myOrders(req, res, next) {
  try {
    const orders = await Order.find({ customerId: req.user._id }).populate("tailorId").sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate("tailorId customerId measurementId");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function tailorOrders(req, res, next) {
  try {
    const tailor = await Tailor.findOne({ userId: req.user._id });
    if (!tailor) return res.status(404).json({ message: "Create tailor profile first" });
    const orders = await Order.find({ tailorId: tailor._id }).populate("customerId", "name phone").sort({ dueDate: 1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { status, note } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: { statusHistory: { status, note, changedBy: req.user._id } }
      },
      { new: true, runValidators: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    const notification = await Notification.create({
      userId: order.customerId,
      type: "order",
      title: "Order status updated",
      message: `${order.orderNo} is now ${status}.`,
      orderId: order._id
    });

    req.app.get("io").to(order.customerId.toString()).emit("order:updated", order);
    req.app.get("io").to(order.customerId.toString()).emit("notification:new", notification);

    // WhatsApp/SMS notification to Customer User when Tailor updates status
    const customerUser = await User.findById(order.customerId);
    if (customerUser && customerUser.phone) {
      const customerMsg = `Hello ${customerUser.name}, your stitching order ${order.orderNo} status is now updated to "${status.toUpperCase()}". ${note ? `Remark: "${note}"` : ""}`;
      sendWhatsApp(customerUser.phone, customerMsg);
      sendSMS(customerUser.phone, customerMsg);
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}
