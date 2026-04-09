import { Request, Response, NextFunction } from 'express';
import { FilterQuery } from 'mongoose';
import { Dossier, IDossierDocument } from '../models/Dossier.model';
import { AuditLog } from '../models/AuditLog.model';

// ─────────────────────────────────────────────────────────────────────────────
// GET /dossiers — Danh sách hồ sơ (có phân trang)
// ─────────────────────────────────────────────────────────────────────────────

export const getDossiers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 5);
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    // req.queryFilter đã được scopeQuery inject — KHÔNG tự build filter từ user input
    const baseFilter: FilterQuery<IDossierDocument> = { ...req.queryFilter };

    // Tìm kiếm bằng regex không phân biệt hoa thường
    if (search) {
      baseFilter.$or = [
        { dossierId: { $regex: search, $options: 'i' } },
        { parties: { $regex: search, $options: 'i' } },
      ];
    }

    // Cho phép filter thêm theo status (an toàn vì không ảnh hưởng RLS)
    if (req.query.status) {
      baseFilter.status = req.query.status;
    }

    const [dossiers, total] = await Promise.all([
      Dossier.find(baseFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignedOfficer', 'name employeeId')
        .lean(),
      Dossier.countDocuments(baseFilter),
    ]);

    res.json({
      success: true,
      data: dossiers,
      meta: { totalRecords: total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /dossiers/:id — Chi tiết một hồ sơ
// Audit READ được handle bởi auditView middleware trong route, không ở đây.
// ─────────────────────────────────────────────────────────────────────────────

export const getDossierById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Kết hợp req.queryFilter để đảm bảo user có quyền xem hồ sơ này
    // Ví dụ officer với scope 'OWN' sẽ không tìm thấy hồ sơ của người khác dù biết ID
    const dossier = await Dossier.findOne({
      dossierId: req.params.id, // ID public (vd: THA-2026-0009)
      ...req.queryFilter, // RLS filter kết hợp với ID lookup
    })
      .populate('assignedOfficer', 'name employeeId')
      .lean();

    if (!dossier) {
      // Trả về 404 thay vì 403 để không leak thông tin hồ sơ tồn tại hay không
      res.status(404).json({ success: false, message: 'Dossier not found.' });
      return;
    }

    // Ghi AuditLog READ bất đồng bộ (tránh block request)
    AuditLog.create({
      action: 'READ',
      resource: 'DOSSIER',
      resourceId: dossier._id,
      performedBy: req.user._id,
      ipAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch((err: unknown) =>
      console.error('[AuditLog] Failed to record READ audit:', err)
    );

    res.json({ success: true, data: dossier });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /dossiers — Tạo hồ sơ mới
// AuditLog CREATE được tự động ghi bởi audit plugin (post 'save' hook)
// ─────────────────────────────────────────────────────────────────────────────

export const createDossier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dossier = new Dossier({
      ...req.body,
      createdBy: req.user._id,
      assignedOfficer: req.user._id, // mặc định gán cho người tạo
      // Gán cứng unit từ user đang đăng nhập, không tin vào body
      unit: req.user.unit,
    });

    await dossier.save(); // trigger audit plugin's post 'save' hook

    res.status(201).json({ success: true, data: dossier });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /dossiers/:id — Cập nhật hồ sơ
// AuditLog UPDATE được tự động ghi bởi audit plugin (pre/post 'findOneAndUpdate' hooks)
// ─────────────────────────────────────────────────────────────────────────────

export const updateDossier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Không cho phép update các field nhạy cảm qua body
    const { unit, assignedOfficer, ...safeUpdateData } = req.body;

    const dossier = await Dossier.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.queryFilter, // RLS: chỉ update được hồ sơ trong scope của mình
      },
      { $set: safeUpdateData },
      {
        new: true,          // trả về document sau khi update
        runValidators: true, // chạy Mongoose validators trên update
      }
    );

    if (!dossier) {
      res.status(404).json({ success: false, message: 'Dossier not found or access denied.' });
      return;
    }

    res.json({ success: true, data: dossier });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /dossiers/:id — Xóa hồ sơ (chỉ ADMIN / AGENCY_LEADER)
// AuditLog DELETE được tự động ghi bởi audit plugin (post 'findOneAndDelete' hook)
// ─────────────────────────────────────────────────────────────────────────────

export const deleteDossier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dossier = await Dossier.findOneAndDelete({
      _id: req.params.id,
      ...req.queryFilter,
    });

    if (!dossier) {
      res.status(404).json({ success: false, message: 'Dossier not found or access denied.' });
      return;
    }

    res.json({ success: true, message: 'Dossier deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /dossiers/:id/audit-log — Lịch sử thay đổi của một hồ sơ
// Chỉ AGENCY_LEADER và ADMIN mới được xem — enforce ở route level
// ─────────────────────────────────────────────────────────────────────────────

export const getDossierAuditLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logs = await AuditLog.find({
      resource: 'DOSSIER',
      resourceId: req.params.id,
    })
      .sort({ timestamp: -1 })
      .populate('performedBy', 'name employeeId')
      .lean();

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /dossiers/stats — Thống kê thông tin trên bảng điều khiển
// Sử dụng Aggregation Pipeline để đếm nhanh số liệu
// ─────────────────────────────────────────────────────────────────────────────

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const baseFilter = { ...req.queryFilter };

    const stats = await Dossier.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalDossiers: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
          },
          executingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'EXECUTING'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalDossiers: 0,
      pendingCount: 0,
      executingCount: 0,
      completedCount: 0,
    };

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
