import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";

function razorpayClient() {
  return new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
}

export async function createPaymentOrder(req, res, next) {
  try {
    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const razorpayOrder = await razorpayClient().orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: order.orderNo
    });

    const payment = await Payment.create({
      orderId: order._id,
      customerId: order.customerId,
      tailorId: order.tailorId,
      amount,
      razorpayOrderId: razorpayOrder.id
    });

    res.status(201).json({ payment, razorpayOrder, keyId: env.razorpayKeyId });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isSimulated } = req.body;

    if (!env.razorpayKeySecret || isSimulated) {
      const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { razorpayPaymentId: razorpay_payment_id || `pay_sim_${Date.now()}`, razorpaySignature: razorpay_signature || "simulated", status: "captured" },
        { new: true }
      );

      if (payment) {
        await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: "paid" });
      }

      return res.json({ payment, simulated: true });
    }

    const generated = crypto
      .createHmac("sha256", env.razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: "captured" },
      { new: true }
    );

    if (payment) {
      await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: "paid" });
    }

    res.json({ payment });
  } catch (error) {
    next(error);
  }
}
