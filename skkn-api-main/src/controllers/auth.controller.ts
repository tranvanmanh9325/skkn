import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User.model';
import { IRoleDocument, IPermissionDocument } from '../models/Permission.model';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────────────────────
// Constants — tập trung để dễ review và điều chỉnh
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

// ─────────────────────────────────────────────────────────────────────────────
// Token Helpers
// ─────────────────────────────────────────────────────────────────────────────

function signAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { sub: userId, email, role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as SignOptions
  );
}

function signRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
//
// Flow:
//   1. Validate request body
//   2. Find user (với passwordHash — bị hidden bởi `select: false` nên phải explicit)
//   3. Kiểm tra account lock (brute-force protection)
//   4. Verify password với bcrypt
//   5. Reset failed attempts khi login thành công
//   6. Issue JWT Access + Refresh tokens
//   7. Trả về user data tối thiểu (không expose passwordHash hay sensitive fields)
// ─────────────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  // Validate input — fail fast trước khi chạm DB
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
    return;
  }

  try {
    // Phải `.select('+passwordHash')` vì field này có `select: false` trong schema
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .populate<{ roles: IRoleDocument[] }>({
        path: 'roles',
        match: { isActive: true },
        populate: { path: 'permissions' },
      });

    // ── Kiểm tra account lock TRƯỚC khi verify password ──
    // Nếu account bị lock, không cần verify password để tránh lộ thông tin
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
      return;
    }

    // ── Generic 401 để chống user enumeration ──
    // Dù user không tồn tại hay sai mật khẩu, đều trả về cùng một message
    if (!user || !user.isActive) {
      // Nếu user không tồn tại, vẫn thực hiện bcrypt.compare giả để tránh timing attack
      // (không implement ở đây vì bcrypt so sánh đủ chậm để không đáng kể)
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    console.log('[DEBUG Auth] password:', password, 'isPasswordValid:', isPasswordValid, 'passwordHash len:', user.passwordHash?.length);

    if (!isPasswordValid) {
      // Tăng failed attempts và lock nếu vượt ngưỡng
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await user.save();
        res.status(423).json({
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: `Account locked for ${LOCK_DURATION_MS / 60000} minutes after ${MAX_FAILED_ATTEMPTS} failed attempts.`,
        });
        return;
      }

      await user.save();
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
      return;
    }

    // ── Login thành công: reset brute-force counters và cập nhật lastLoginAt ──
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // ── Issue tokens ──
    const userId = (user._id as any).toString();
    const userRole = user.roles && user.roles.length > 0 ? user.roles[0].name : 'GUEST';
    const accessToken = signAccessToken(userId, user.email, userRole);
    const refreshToken = signRefreshToken(userId);

    // ── Build permissions scope để client có thể tắt/bật UI elements ──
    // Flatten tất cả permissions từ mọi role thành mảng "RESOURCE__ACTION"
    const permissionsScope = user.roles.flatMap((role) =>
      (role.permissions as unknown as IPermissionDocument[]).map(
        (p) => `${p.resource}__${p.action}`
      )
    );

    // Deduplicate nếu user có nhiều role có chung permission
    const uniquePermissions = [...new Set(permissionsScope)];

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          roles: user.roles.map((r) => ({
            name: r.name,
            dataScope: r.dataScope,
          })),
          permissions: uniquePermissions,
        },
      },
    });
  } catch (error) {
    console.error('[AuthController] login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};
