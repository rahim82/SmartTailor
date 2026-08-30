import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { Tailor } from "../models/Tailor.js";
import { signAccessToken } from "../utils/tokens.js";
import { sendLoginSuccessEmail, sendPasswordResetEmail, sendRegistrationEmail } from "../services/email.service.js";
import { env } from "../config/env.js";

const googleClient = new OAuth2Client();

export async function register(req, res, next) {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Name, phone, and password are required" });
    }

    const cleanPhone = typeof phone === "string" ? phone.trim().replace(/\D/g, "") : String(phone);
    const cleanEmail = typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined;
    const role = req.body.role === "tailor" ? "tailor" : "customer";

    const exists = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: String(phone).trim() },
        ...(cleanEmail ? [{ email: cleanEmail }] : [])
      ]
    });

    if (exists) {
      return res.status(409).json({ message: "User with this phone or email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim(),
      phone: cleanPhone || String(phone).trim(),
      email: cleanEmail,
      passwordHash,
      role
    });

    // If registered as tailor, ensure a Tailor profile document exists
    if (role === "tailor") {
      const existingTailor = await Tailor.findOne({ userId: user._id });
      if (!existingTailor) {
        await Tailor.create({
          userId: user._id,
          shopName: `${user.name}'s Boutique`,
          description: "Specialist in custom stitching, alterations, and design.",
          services: [
            { name: "Blouse", price: 500 },
            { name: "Kurta", price: 600 },
            { name: "Alteration", price: 150 },
            { name: "Lehenga", price: 1800 }
          ],
          location: { address: "Main Market", city: "Jaipur", state: "Rajasthan", pincode: "302001" },
          workingHours: "10 AM - 8 PM",
          verificationStatus: "pending"
        });
      }
    }

    const token = signAccessToken(user);

    if (user.email) {
      sendRegistrationEmail({ to: user.email, name: user.name, role: user.role }).catch((error) => {
        console.warn("Registration email notice:", error.message);
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("admin:refresh");

    res.status(201).json({
      token,
      user: { id: user._id, _id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/phone and password are required" });
    }

    const cleanIdentifier = typeof identifier === "string" ? identifier.trim() : String(identifier);
    const emailIdentifier = cleanIdentifier.toLowerCase();
    const digitsOnly = cleanIdentifier.replace(/\D/g, "");
    const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    const orConditions = [
      { email: emailIdentifier },
      { phone: cleanIdentifier }
    ];

    if (digitsOnly && digitsOnly !== cleanIdentifier) {
      orConditions.push({ phone: digitsOnly });
    }
    if (last10Digits && last10Digits !== digitsOnly) {
      orConditions.push({ phone: last10Digits });
    }

    const user = await User.findOne({ $or: orConditions });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account has been deactivated" });
    }

    const token = signAccessToken(user);

    if (user.email) {
      sendLoginSuccessEmail({ to: user.email, name: user.name }).catch((error) => {
        console.warn("Login success email notice:", error.message);
      });
    }

    res.json({
      token,
      user: { id: user._id, _id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role }
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

export async function googleAuth(req, res, next) {
  try {
    const { credential, email, name, avatarUrl, googleId, role = "customer" } = req.body;
    let googleUser = { email, name, avatarUrl, googleId };

    if (credential) {
      if (env.googleClientId) {
        const client = new OAuth2Client(env.googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: env.googleClientId
        });
        const payload = ticket.getPayload();
        googleUser = {
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.picture,
          googleId: payload.sub
        };
      } else {
        try {
          const base64Url = credential.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const decoded = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
          googleUser = {
            email: decoded.email,
            name: decoded.name,
            avatarUrl: decoded.picture,
            googleId: decoded.sub
          };
        } catch {
          // If direct token parse fails, fallback to direct payload fields
        }
      }
    }

    if (!googleUser.email) {
      return res.status(400).json({ message: "Google authentication failed: Email is missing" });
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();
    let user = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(googleUser.googleId ? [{ googleId: googleUser.googleId }] : [])
      ]
    });

    if (!user) {
      const assignedRole = role === "tailor" ? "tailor" : "customer";
      user = await User.create({
        name: googleUser.name || "Google User",
        email: cleanEmail,
        avatarUrl: googleUser.avatarUrl,
        googleId: googleUser.googleId,
        role: assignedRole
      });

      if (assignedRole === "tailor") {
        await Tailor.create({
          userId: user._id,
          shopName: `${user.name}'s Boutique`,
          description: "Specialist in custom stitching, alterations, and design.",
          services: [
            { name: "Blouse", price: 500 },
            { name: "Kurta", price: 600 },
            { name: "Alteration", price: 150 },
            { name: "Lehenga", price: 1800 }
          ],
          location: { address: "Main Market", city: "Jaipur", state: "Rajasthan", pincode: "302001" },
          workingHours: "10 AM - 8 PM",
          verificationStatus: "pending"
        });
      }

      if (user.email) {
        sendRegistrationEmail({ to: user.email, name: user.name, role: user.role }).catch((err) => {
          console.warn("Registration email notice:", err.message);
        });
      }
    } else {
      if (googleUser.avatarUrl && !user.avatarUrl) {
        user.avatarUrl = googleUser.avatarUrl;
      }
      if (googleUser.googleId && !user.googleId) {
        user.googleId = googleUser.googleId;
      }
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    const token = signAccessToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
}
