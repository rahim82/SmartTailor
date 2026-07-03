export const orderStages = ["Placed", "Measurement", "Cutting", "Stitching", "Trial", "Ready", "Delivered"];

export const customerOrders = [
  { id: "ST-2401", item: "Silk blouse", tailor: "Meena Boutique", status: "Stitching", due: "12 Jul", amount: "INR 1,250" },
  { id: "ST-2402", item: "Kurta alteration", tailor: "Royal Fits", status: "Ready", due: "Today", amount: "INR 450" },
  { id: "ST-2403", item: "Wedding lehenga fitting", tailor: "Aarvi Studio", status: "Trial", due: "15 Jul", amount: "INR 3,800" }
];

export const tailorOrders = [
  { id: "ST-2408", customer: "Priya S.", item: "Blouse", status: "Cutting", due: "Tomorrow", value: "INR 1,100" },
  { id: "ST-2409", customer: "Aman K.", item: "Suit alteration", status: "Measurement", due: "10 Jul", value: "INR 950" },
  { id: "ST-2410", customer: "Neha R.", item: "Anarkali", status: "Stitching", due: "14 Jul", value: "INR 2,400" }
];

export const adminTailors = [
  { name: "Meena Boutique", city: "Jaipur", status: "Verified", orders: 38 },
  { name: "Royal Fits", city: "Indore", status: "Pending", orders: 14 },
  { name: "Aarvi Studio", city: "Delhi", status: "Verified", orders: 63 }
];
