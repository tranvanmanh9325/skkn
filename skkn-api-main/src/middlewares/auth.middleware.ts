import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { FilterQuery } from 'mongoose';
import { User, IUserDocument } from '../models/User.model';
import { IRoleDocument, Resource, Action } from '../models/Permission.model';
import { AuditLog, AuditResource } from '../models/AuditLog.model';
import { auditContext } from '../plugins/audit.plugin';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface JwtAccessPayload {
  sub: string;   // userId
  iat: number;
  exp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. authenticate
//
// Xác thực JWT từ Authorization header.
// Populate đầy đủ roles → permissions trong MỘT lần query duy nhất,
// sau đó gắn vào req.user để các middleware tiếp theo không phải query lại.
// ─────────────────────────────────────────────────────────────────────────────

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;

    const user = await User.findById(payload.sub)
      .select('+passwordHash') // không cần ở đây nhưng để demo select pattern
      .select('-passwordHash') // loại trừ passwordHash khỏi req.user
      .populate<{ roles: IRoleDocument[] }>({
        path: 'roles',
        match: { isActive: true }, // chỉ populate roles đang active
        populate: { path: 'permissions' },
      })
      .lean<IUserDocument>();

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated.' });
      return;
    }

    // Kiểm tra tài khoản bị khóa do brute-force
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Access token expired.' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. authorize
//
// Kiểm tra xem user có permission cụ thể không (RBAC Permission Check).
// Là một higher-order function để có thể tái sử dụng linh hoạt trong route:
//   router.get('/', authenticate, authorize('DOSSIER', 'READ'), controller)
// ─────────────────────────────────────────────────────────────────────────────

export const authorize = (resource: Resource, action: Action) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const roles = req.user.roles as IRoleDocument[];

    const hasPermission = roles.some((role) =>
      (role.permissions as any[]).some(
        (p) => p.resource === resource && p.action === action
      )
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: `Access denied: missing permission '${action}' on '${resource}'.`,
      });
      return;
    }

    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. scopeQuery — Row-Level Security
//
// Đây là middleware quan trọng nhất về mặt bảo mật dữ liệu.
// Nó inject req.queryFilter dựa trên dataScope của role user.
// Controller PHẢI dùng req.queryFilter làm điều kiện lọc,
// không được tự build query từ params của user.
//
// Diagram:
//   OWN  → { assignedOfficer: userId }     — Officer chỉ thấy hồ sơ của mình
//   UNIT → { unit: unitId }                — Leader thấy hồ sơ trong đơn vị
//   ALL  → {}                              — Admin không giới hạn
// ─────────────────────────────────────────────────────────────────────────────

export const scopeQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const roles = req.user.roles as IRoleDocument[];

  // Xác định scope mạnh nhất (ưu tiên ALL > UNIT > OWN)
  // Dùng trong trường hợp user có nhiều role với scope khác nhau
  const dominantScope = roles.reduce<'OWN' | 'UNIT' | 'ALL'>(
    (highestScope, role) => {
      const scopePriority = { OWN: 1, UNIT: 2, ALL: 3 };
      return scopePriority[role.dataScope] > scopePriority[highestScope]
        ? role.dataScope
        : highestScope;
    },
    'OWN'
  );

  let filter: FilterQuery<any>;

  switch (dominantScope) {
    case 'OWN':
      filter = { assignedOfficer: req.user._id };
      break;
    case 'UNIT':
      filter = { unit: req.user.unit };
      break;
    case 'ALL':
      filter = {};
      break;
    default:
      // Fail-safe: nếu không xác định được scope, áp dụng scope hẹp nhất
      filter = { assignedOfficer: req.user._id };
  }

  req.queryFilter = filter;
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. withAuditContext
//
// Khởi tạo AsyncLocalStorage store cho request hiện tại.
// Tất cả Mongoose hooks trong request này sẽ đọc được userId và IP
// mà không cần truyền qua params → đây là pattern cho cross-cutting concerns.
//
// Phải đặt SAU authenticate vì cần req.user.
// ─────────────────────────────────────────────────────────────────────────────

export const withAuditContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  auditContext.run(
    {
      userId: req.user._id,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    },
    next // mọi code chạy sau next() đều thuộc cùng một AsyncLocalStorage context
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. auditView — Ghi audit log thủ công cho thao tác READ
//
// READ không có Mongoose hook tự động (vì read không thay đổi data).
// Dùng middleware này để ghi "ai đã xem hồ sơ nào" vào audit log.
// ─────────────────────────────────────────────────────────────────────────────

export const auditView = (resource: AuditResource) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resourceId = req.params.id;

    if (resourceId) {
      // Ghi audit log bất đồng bộ, không block request
      // Nếu ghi thất bại, chỉ log lỗi, không crash request của user
      AuditLog.create({
        action: 'READ',
        resource,
        resourceId,
        performedBy: req.user._id,
        ipAddress: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      }).catch((err: unknown) =>
        console.error('[AuditLog] Failed to record READ audit:', err)
      );
    }

    next();
  };
};
