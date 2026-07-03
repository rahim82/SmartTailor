import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signAccessToken } from "../utils/tokens.js";

export async function register(req, res, next) {
  try {
    const { name, phone, email, password } = req.body;
    const role = req.body.role === "tailor" ? "tailor" : "customer";
    const exists = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] });

    if (exists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, phone, email, passwordHash, role });
    const token = signAccessToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ phone: identifier }, { email: identifier }] });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAccessToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
