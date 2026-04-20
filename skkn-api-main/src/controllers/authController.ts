import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoginBody {
  username: string;
  password: string;
}

interface ForgotPasswordBody {
  username: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Fail fast at startup rather than at runtime on the first request
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Returns a signed JWT on valid credentials.
 * Deliberately uses a generic error message to prevent username enumeration.
 */
export const login: RequestHandler<{}, unknown, LoginBody> = async (
  req,
  res
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: "Username and password are required" });
      return;
    }

    // select("+password") is needed only if the field were excluded by default;
    // kept here as a safety net for future schema changes
    const user = await User.findOne({ username: username.toLowerCase() }).select(
      "+password"
    );

    // Use a constant-time comparison to thwart timing attacks
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isMatch) {
      // Same message regardless of whether user exists — prevents enumeration
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: user.toJSON(), // password is stripped by the schema transformer
    });
  } catch (err) {
    console.error("[AuthController] login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/auth/forgot-password
 * Validates that the username exists, then simulates dispatching a reset link.
 * This is an internal admin tool, so revealing username existence is acceptable.
 */
export const forgotPassword: RequestHandler<{}, unknown, ForgotPasswordBody> = async (
  req,
  res
) => {
  try {
    const { username } = req.body;

    if (!username) {
      res.status(400).json({ message: "Vui lòng nhập tên đăng nhập." });
      return;
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      res.status(404).json({ message: "Tài khoản không tồn tại." });
      return;
    }

    // TODO: replace with actual email dispatch (e.g. nodemailer / SendGrid)
    console.log("Reset link sent for user:", user.username);

    res.status(200).json({
      message:
        "Yêu cầu đã được gửi thành công. Vui lòng kiểm tra email hoặc liên hệ quản trị viên.",
    });
  } catch (err) {
    console.error("[AuthController] forgotPassword error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
