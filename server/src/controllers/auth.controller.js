import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { signAccessToken } from "../utils/tokens.js";
import { sendLoginSuccessEmail, sendPasswordResetEmail, sendRegistrationEmail } from "../services/email.service.js";

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

    try {
      await sendRegistrationEmail({ to: user.email, name: user.name, role: user.role });
    } catch (error) {
      console.error("Registration email could not be sent:", error.message);
    }

    const io = req.app.get("io");
    if (io) io.emit("admin:refresh");

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
    const cleanIdentifier = typeof identifier === "string" ? identifier.trim() : identifier;
    const emailIdentifier = typeof cleanIdentifier === "string" ? cleanIdentifier.toLowerCase() : cleanIdentifier;

    const user = await User.findOne({ 
      $or: [{ phone: cleanIdentifier }, { email: emailIdentifier }] 
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAccessToken(user);
    try {
      await sendLoginSuccessEmail({ to: user.email, name: user.name });
    } catch (error) {
      console.error("Login success email could not be sent:", error.message);
    }

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


export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !email.trim()) return res.status(400).json({ message: "Email is required" });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) return res.json({ message:"No account found for this email." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/forgot-password?token=${resetToken}`;
    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (error) {
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordTokenExpiresAt = undefined;
      await user.save();
      throw error;
    }

    res.json({ message: "Password reset email sent. Please check your inbox." });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (typeof token !== "string" || typeof password !== "string") return res.status(400).json({ message: "Reset link and new password are required" });
    if (password.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ resetPasswordTokenHash: tokenHash, resetPasswordTokenExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired" });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpiresAt = undefined;
    await user.save();
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    next(error);
  }
}
