import { Schema, model, Document, Types } from 'mongoose';
import { createAuditPlugin } from '../plugins/audit.plugin';

// ─────────────────────────────────────────────────────────────────────────────
// Dossier (Hồ sơ thi hành án) — model ví dụ để demo audit plugin
// ─────────────────────────────────────────────────────────────────────────────

export const DOSSIER_STATUSES = [
  'PENDING',      // Đang thụ lý
  'ACTIVE',       // Đang thi hành
  'SUSPENDED',    // Tạm đình chỉ
  'COMPLETED',    // Đã thi hành xong
  'ARCHIVED',     // Đã lưu kho
] as const;

export const EXECUTION_TYPES = ['MONETARY', 'PROPERTY', 'ACTION'] as const;

export type DossierStatus = (typeof DOSSIER_STATUSES)[number];
export type ExecutionType = (typeof EXECUTION_TYPES)[number];

export interface IDossier {
  caseNumber: string;
  verdictNumber: string;
  verdictDate: Date;
  court: string;
  executionType: ExecutionType;
  status: DossierStatus;
  assignedOfficer: Types.ObjectId; // người chuyên quản — dùng cho RLS scope 'OWN'
  unit: Types.ObjectId;            // đơn vị — dùng cho RLS scope 'UNIT'
  totalAmount?: number;
  notes?: string;
}

export interface IDossierDocument extends IDossier, Document {}

const DossierSchema = new Schema<IDossierDocument>(
  {
    caseNumber: { type: String, required: true, unique: true, trim: true },
    verdictNumber: { type: String, required: true, trim: true },
    verdictDate: { type: Date, required: true },
    court: { type: String, required: true },
    executionType: { type: String, enum: EXECUTION_TYPES, required: true },
    status: { type: String, enum: DOSSIER_STATUSES, default: 'PENDING' },
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
    totalAmount: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

// Compound index tối ưu cho query phổ biến nhất: lọc hồ sơ theo đơn vị + trạng thái
DossierSchema.index({ unit: 1, status: 1, createdAt: -1 });
// Compound index cho officer xem hồ sơ của mình, sắp xếp mới nhất
DossierSchema.index({ assignedOfficer: 1, status: 1, createdAt: -1 });

// Đăng ký audit plugin — Dossier giờ tự động ghi audit log khi create/update/delete
DossierSchema.plugin(createAuditPlugin('DOSSIER'));

export const Dossier = model<IDossierDocument>('Dossier', DossierSchema);
