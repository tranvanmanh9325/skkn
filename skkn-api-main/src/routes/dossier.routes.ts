import { Router } from 'express';
import {
  authenticate,
  authorize,
  scopeQuery,
  withAuditContext,
  auditView,
} from '../middlewares/auth.middleware';
import * as DossierController from '../controllers/dossier.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Middleware chain giải thích:
//
//  authenticate     → Xác thực JWT, gắn req.user (với roles đã populate)
//  authorize(R, A)  → Kiểm tra permission bit (RBAC)
//  scopeQuery       → Inject req.queryFilter theo dataScope (Row-Level Security)
//  withAuditContext → Set AsyncLocalStorage store cho Mongoose hooks
//  auditView(R)     → Ghi READ audit log bất đồng bộ (chỉ cho GET by ID)
// ─────────────────────────────────────────────────────────────────────────────

// Danh sách hồ sơ — toàn bộ danh sách đã được lọc bởi scopeQuery
router.get(
  '/',
  authenticate,
  authorize('DOSSIER', 'READ'),
  scopeQuery,
  DossierController.listDossiers
);

// Chi tiết — auditView ghi log ai đã xem hồ sơ nào và lúc mấy giờ
router.get(
  '/:id',
  authenticate,
  authorize('DOSSIER', 'READ'),
  scopeQuery,
  auditView('DOSSIER'),        // fire-and-forget, không blocking
  DossierController.getDossierById
);

// Tạo mới
router.post(
  '/',
  authenticate,
  authorize('DOSSIER', 'CREATE'),
  scopeQuery,
  withAuditContext,            // cần trước controller vì save() trigger audit plugin
  DossierController.createDossier
);

// Cập nhật
router.patch(
  '/:id',
  authenticate,
  authorize('DOSSIER', 'UPDATE'),
  scopeQuery,
  withAuditContext,
  DossierController.updateDossier
);

// Xóa — chỉ ADMIN và AGENCY_LEADER có permission này trong DB
router.delete(
  '/:id',
  authenticate,
  authorize('DOSSIER', 'DELETE'),
  scopeQuery,
  withAuditContext,
  DossierController.deleteDossier
);

// Lịch sử audit — chỉ dành cho AGENCY_LEADER và ADMIN
router.get(
  '/:id/audit-log',
  authenticate,
  authorize('REPORT', 'READ'),  // cần permission riêng để xem audit log
  DossierController.getDossierAuditLog
);

export default router;
