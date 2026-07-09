import bcrypt from "bcryptjs";
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

    const io = req.app.get("io");
    if (io) io.emit("admin:refresh");

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
      req.app.get("io").to(tailor.userId.toString()).emit("order:updated", order);

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

export async function trackOrder(req, res, next) {
  try {
    const { orderNo, phone } = req.query;
    if (!orderNo || !phone) {
      return res.status(400).json({ message: "Order Number and Phone Number are required" });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    
    // Find order by orderNo (case insensitive)
    const order = await Order.findOne({ orderNo: new RegExp(`^${orderNo.trim()}$`, "i") })
      .populate("customerId")
      .populate("tailorId", "shopName location workingHours portfolioImages");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Compare customer's phone suffix (last 10 digits)
    const dbCustomerPhone = order.customerId?.phone || "";
    const cleanDbPhone = dbCustomerPhone.replace(/\D/g, "");
    
    if (cleanDbPhone.slice(-10) !== cleanPhone.slice(-10)) {
      return res.status(403).json({ message: "Incorrect phone number for this order" });
    }

    // Return tracking status details (excluding security-sensitive info)
    res.json({
      orderNo: order.orderNo,
      garmentType: order.garmentType,
      status: order.status,
      statusHistory: order.statusHistory,
      dueDate: order.dueDate,
      trialDate: order.trialDate,
      deliveryDate: order.deliveryDate,
      paymentStatus: order.paymentStatus,
      pricing: {
        stitchingCharge: order.pricing.stitchingCharge,
        fabricCharge: order.pricing.fabricCharge,
        discount: order.pricing.discount,
        total: order.pricing.total
      },
      instructions: order.instructions,
      fabricProvidedBy: order.fabricProvidedBy,
      tailor: {
        shopName: order.tailorId?.shopName,
        location: order.tailorId?.location,
        workingHours: order.tailorId?.workingHours
      },
      createdAt: order.createdAt
    });
  } catch (error) {
    next(error);
  }
}

export async function createWalkInOrder(req, res, next) {
  try {
    const {
      customerPhone,
      customerName,
      garmentType,
      fabricProvidedBy,
      instructions,
      dueDate,
      pricing,
      measurementId
    } = req.body;

    if (!customerPhone || !customerName || !garmentType) {
      return res.status(400).json({ message: "Customer phone, name, and garment type are required" });
    }

    // Find tailor profile associated with current logged-in tailor user
    const tailor = await Tailor.findOne({ userId: req.user._id });
    if (!tailor) {
      return res.status(404).json({ message: "Tailor profile not found. Please complete profile details first." });
    }

    // Check if customer exists (match last 10 digits to handle formatting/+91 prefixes)
    const cleanPhoneDigits = customerPhone.replace(/\D/g, "");
    let customer;
    if (cleanPhoneDigits.length >= 10) {
      const phoneRegex = new RegExp(`${cleanPhoneDigits.slice(-10)}$`);
      customer = await User.findOne({ phone: { $regex: phoneRegex }, role: "customer" });
    } else {
      customer = await User.findOne({ phone: customerPhone, role: "customer" });
    }
    let isNewCustomer = false;
    let tempPassword = "";

    if (!customer) {
      isNewCustomer = true;
      // Auto-register customer with a temporary password (last 6 digits of their phone)
      tempPassword = customerPhone.replace(/\D/g, "").slice(-6) || "123456";
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      customer = await User.create({
        name: customerName,
        phone: customerPhone,
        passwordHash,
        role: "customer"
      });
    }

    // Calculate total charge
    const stitching = Number(pricing?.stitchingCharge) || 0;
    const fabric = Number(pricing?.fabricCharge) || 0;
    const discount = Number(pricing?.discount) || 0;
    const total = stitching + fabric - discount;

    // Create walk-in order
    const order = await Order.create({
      orderNo: makeOrderNo(),
      customerId: customer._id,
      tailorId: tailor._id,
      garmentType,
      fabricProvidedBy: fabricProvidedBy || "customer",
      instructions,
      dueDate: dueDate || undefined,
      pricing: {
        stitchingCharge: stitching,
        fabricCharge: fabric,
        discount: discount,
        total: total > 0 ? total : 0
      },
      measurementId: measurementId || undefined,
      status: "placed",
      statusHistory: [{ status: "placed", note: "Walk-in order created by tailor", changedBy: req.user._id }]
    });

    // Notify clients via socket
    const io = req.app.get("io");
    if (io) {
      io.emit("admin:refresh");
      io.to(customer._id.toString()).emit("order:updated", order);
      io.to(req.user._id.toString()).emit("order:updated", order);
    }

    // Send in-app notification to customer
    await Notification.create({
      userId: customer._id,
      type: "order",
      title: "New order placed",
      message: `Your stitching order ${order.orderNo} for ${order.garmentType} has been successfully registered.`,
      orderId: order._id
    });

    res.status(201).json({
      order,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        isNew: isNewCustomer,
        tempPassword
      }
    });
  } catch (error) {
    next(error);
  }
}

