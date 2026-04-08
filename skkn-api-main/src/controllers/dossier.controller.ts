import { Request, Response, NextFunction } from 'express';
import { FilterQuery } from 'mongoose';
import { Dossier, IDossierDocument } from '../models/Dossier.model';
import { AuditLog } from '../models/AuditLog.model';

// ─────────────────────────────────────────────────────────────────────────────
// GET /dossiers — Danh sách hồ sơ (có phân trang)
// ─────────────────────────────────────────────────────────────────────────────

export const listDossiers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    // req.queryFilter đã được scopeQuery inject — KHÔNG tự build filter từ user input
    const baseFilter: FilterQuery<IDossierDocument> = { ...req.queryFilter };

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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
      _id: req.params.id,
      ...req.queryFilter, // RLS filter kết hợp với ID lookup
    })
      .populate('assignedOfficer', 'name employeeId')
      .lean();

    if (!dossier) {
      // Trả về 404 thay vì 403 để không leak thông tin hồ sơ tồn tại hay không
      res.status(404).json({ success: false, message: 'Dossier not found.' });
      return;
    }

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
