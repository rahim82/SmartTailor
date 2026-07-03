import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";
import { Tailor } from "../models/Tailor.js";
import { Measurement } from "../models/Measurement.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Review } from "../models/Review.js";
import { Notification } from "../models/Notification.js";

await connectDatabase();

await Promise.all([
  User.deleteMany({}),
  Tailor.deleteMany({}),
  Measurement.deleteMany({}),
  Order.deleteMany({}),
  Payment.deleteMany({}),
  Review.deleteMany({}),
  Notification.deleteMany({})
]);

const passwordHash = await bcrypt.hash("password123", 12);

const [admin, customer, tailorUser] = await User.create([
  { name: "Admin", phone: "9999999999", email: "admin@smarttailor.test", passwordHash, role: "admin" },
  { name: "Priya Sharma", phone: "8888888888", email: "customer@smarttailor.test", passwordHash, role: "customer" },
  { name: "Meena Tailor", phone: "7777777777", email: "tailor@smarttailor.test", passwordHash, role: "tailor" }
]);

const tailor = await Tailor.create({
  userId: tailorUser._id,
  shopName: "Meena Boutique",
  description: "Specialist in blouses, kurtas, lehenga fitting, and alterations.",
  services: ["Blouse", "Kurta", "Alteration", "Lehenga"],
  location: { address: "MI Road", city: "Jaipur", state: "Rajasthan", pincode: "302001" },
  workingHours: "10 AM - 8 PM",
  ratingAvg: 4.7,
  totalReviews: 18,
  verificationStatus: "verified",
  subscriptionPlan: "starter"
});

const measurement = await Measurement.create({
  customerId: customer._id,
  tailorId: tailor._id,
  profileName: "Priya",
  gender: "female",
  garmentType: "Blouse",
  values: { chest: 36, waist: 30, shoulder: 14, sleeve: 10, length: 15, armhole: 16 },
  notes: "Keep margin for future alteration.",
  createdBy: customer._id
});

const order = await Order.create({
  orderNo: "ST-DEMO-001",
  customerId: customer._id,
  tailorId: tailor._id,
  measurementId: measurement._id,
  garmentType: "Silk blouse",
  instructions: "Boat neck, elbow sleeve, back hook.",
  status: "stitching",
  statusHistory: [
    { status: "placed", note: "Order placed", changedBy: customer._id },
    { status: "measurement", note: "Measurement confirmed", changedBy: tailorUser._id },
    { status: "cutting", note: "Fabric cutting complete", changedBy: tailorUser._id },
    { status: "stitching", note: "Stitching started", changedBy: tailorUser._id }
  ],
  pricing: { stitchingCharge: 1200, fabricCharge: 0, discount: 0, total: 1200 },
  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  paymentStatus: "partial"
});

await Payment.create({
  orderId: order._id,
  customerId: customer._id,
  tailorId: tailor._id,
  amount: 500,
  method: "cash",
  status: "captured",
  platformCommission: 50
});

await Notification.create({
  userId: customer._id,
  type: "order",
  title: "Order in stitching",
  message: "Your silk blouse is now being stitched.",
  orderId: order._id
});

console.log("Seed complete");
console.log("Admin: admin@smarttailor.test / password123");
console.log("Customer: customer@smarttailor.test / password123");
console.log("Tailor: tailor@smarttailor.test / password123");
process.exit(0);
