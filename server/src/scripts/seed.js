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

// Check if we should do a full reset
const shouldReset = process.argv.includes("--reset") || process.env.RESET === "true";

if (shouldReset) {
  console.log("Full Reset Mode: Wiping all collections...");
  await Promise.all([
    User.deleteMany({}),
    Tailor.deleteMany({}),
    Measurement.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({})
  ]);
} else {
  console.log("Incremental Mode: Keeping existing database records safe.");
}

const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@smarttailor.test";
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "password123";

const customerEmail = process.env.SEED_CUSTOMER_EMAIL || "customer@smarttailor.test";
const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || "password123";

const tailorEmail = process.env.SEED_TAILOR_EMAIL || "tailor@smarttailor.test";
const tailorPassword = process.env.SEED_TAILOR_PASSWORD || "password123";

// 1. Setup Admin
let admin = await User.findOne({ email: adminEmail });
if (!admin) {
  const hash = await bcrypt.hash(adminPassword, 12);
  admin = await User.create({ name: "Admin", phone: "6204466305", email: adminEmail, passwordHash: hash, role: "admin" });
  console.log(`+ Created Admin user: ${adminEmail}`);
} else {
  console.log(`* Admin user already exists: ${adminEmail}`);
}

// 2. Setup Customer
let customer = await User.findOne({ email: customerEmail });
if (!customer) {
  const hash = await bcrypt.hash(customerPassword, 12);
  customer = await User.create({ name: "Priya Sharma", phone: "8888888888", email: customerEmail, passwordHash: hash, role: "customer" });
  console.log(`+ Created Customer user: ${customerEmail}`);
} else {
  console.log(`* Customer user already exists: ${customerEmail}`);
}

// 3. Setup Tailor User
let tailorUser = await User.findOne({ email: tailorEmail });
if (!tailorUser) {
  const hash = await bcrypt.hash(tailorPassword, 12);
  tailorUser = await User.create({ name: "Meena Tailor", phone: "7777777777", email: tailorEmail, passwordHash: hash, role: "tailor" });
  console.log(`+ Created Tailor user: ${tailorEmail}`);
} else {
  console.log(`* Tailor user already exists: ${tailorEmail}`);
}

// 4. Setup Tailor Boutique Profile
let tailor = await Tailor.findOne({ userId: tailorUser._id });
if (!tailor) {
  tailor = await Tailor.create({
    userId: tailorUser._id,
    shopName: "Meena Boutique",
    description: "Specialist in blouses, kurtas, lehenga fitting, and alterations.",
    services: [
      { name: "Blouse", price: 500 },
      { name: "Kurta", price: 600 },
      { name: "Alteration", price: 150 },
      { name: "Lehenga", price: 1800 }
    ],
    location: { address: "MI Road", city: "Jaipur", state: "Rajasthan", pincode: "302001" },
    workingHours: "10 AM - 8 PM",
    ratingAvg: 4.7,
    totalReviews: 18,
    verificationStatus: "verified",
    subscriptionPlan: "starter"
  });
  console.log("+ Created Meena Boutique profile.");
} else {
  console.log("* Meena Boutique profile already exists.");
}

// 5. Seed Demo Orders & Data only if resetting
if (shouldReset) {
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
  console.log("+ Created demo measurement, order, and payment history.");
}

console.log("Seed complete");
console.log(`Admin: ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD ? "******** (configured in env)" : "password123 (default)"}`);
console.log(`Customer: ${customer.email} / ${process.env.SEED_CUSTOMER_PASSWORD ? "********" : "password123"}`);
console.log(`Tailor: ${tailorUser.email} / ${process.env.SEED_TAILOR_PASSWORD ? "********" : "password123"}`);
process.exit(0);
