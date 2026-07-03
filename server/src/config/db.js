import mongoose from "mongoose";
import dns from "dns";
import { env } from "./env.js";

dns.setDefaultResultOrder("ipv4first");

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
}
