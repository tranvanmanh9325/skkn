import { Schema, model, Document, Types } from 'mongoose';
import { createAuditPlugin } from '../plugins/audit.plugin';

// ─────────────────────────────────────────────────────────────────────────────
// Dossier (Hồ sơ thi hành án) — Cập nhật cấu trúc động
// ─────────────────────────────────────────────────────────────────────────────

export const DOSSIER_STATUSES = [
  'PENDING',      // Đang chờ xử lý
  'EXECUTING',    // Đang thi hành
  'COMPLETED',    // Đã xong
  'SUSPENDED',    // Tạm đình chỉ
] as const;

export type DossierStatus = (typeof DOSSIER_STATUSES)[number];

export interface IDossier {
  dossierId: string;
  acceptanceDate: Date;
  parties: string;
  status: DossierStatus;
  createdBy: Types.ObjectId;
  assignedOfficer: Types.ObjectId; // người chuyên quản — dùng cho RLS scope 'OWN'
  unit: Types.ObjectId;            // đơn vị — dùng cho RLS scope 'UNIT'
}

export interface IDossierDocument extends IDossier, Document {}

const DossierSchema = new Schema<IDossierDocument>(
  {
    dossierId: { type: String, required: true, unique: true, trim: true },
    acceptanceDate: { type: Date, required: true },
    parties: { type: String, required: true, trim: true },
    status: { type: String, enum: DOSSIER_STATUSES, default: 'PENDING' },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedOfficer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // index riêng cho RLS scope 'OWN'
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true, // index riêng cho RLS scope 'UNIT'
    },
  },
  { timestamps: true }
);

// Compound index tối ưu cho query phổ biến nhất: lọc hồ sơ theo đơn vị + trạng thái
DossierSchema.index({ unit: 1, status: 1, createdAt: -1 });
// Compound index cho officer xem hồ sơ của mình, sắp xếp mới nhất
DossierSchema.index({ assignedOfficer: 1, status: 1, createdAt: -1 });

// Đăng ký audit plugin — Dossier tự động ghi audit log khi create/update/delete
DossierSchema.plugin(createAuditPlugin('DOSSIER'));

export const Dossier = model<IDossierDocument>('Dossier', DossierSchema);
