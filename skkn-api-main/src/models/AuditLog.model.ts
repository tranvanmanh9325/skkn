import { Schema, model, Document, Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'PRINT',
  'APPROVE',
  'LOGIN',
  'LOGOUT',
] as const;

export const AUDIT_RESOURCES = [
  'DOSSIER',
  'DOCUMENT',
  'VERDICT',
  'REPORT',
  'USER',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditResource = (typeof AUDIT_RESOURCES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface IAuditLog {
  action: AuditAction;
  resource: AuditResource;
  resourceId: Types.ObjectId;
  performedBy?: Types.ObjectId | string;
  before?: Record<string, unknown>;  // snapshot trước khi sửa/xóa
  after?: Record<string, unknown>;   // snapshot sau khi tạo/sửa
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  // metadata bổ sung do controller truyền thủ công (vd: lý do xóa)
  meta?: Record<string, unknown>;
}

export interface IAuditLogDocument extends IAuditLog, Document {}

// ─────────────────────────────────────────────────────────────────────────────
// Schema — thiết kế để KHÔNG BAO GIỜ bị sửa/xóa
// ─────────────────────────────────────────────────────────────────────────────

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    resource: { type: String, enum: AUDIT_RESOURCES, required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, immutable: true }, // immutable: true ngăn sửa field này
    meta: { type: Schema.Types.Mixed },
  },
  {
    // Tắt timestamps tự động (ta tự quản lý bằng `timestamp` field)
    timestamps: false,
    // Tắt versionKey (__v) — không cần thiết và chỉ làm to document
    versionKey: false,
    // Tắt tất cả update paths mặc định
    strict: true,
  }
);

// Index để query audit log hiệu quả theo resource và người thực hiện
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ performedBy: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

// ─────────────────────────────────────────────────────────────────────────────
// Immutability Guards
//
// Chặn MỌI operation write ngoại trừ insertOne/create ở tầng application.
// Đây là tầng bảo vệ thứ nhất (Application Layer).
// Tầng thứ hai là MongoDB RBAC: chỉ cấp INSERT privilege cho service account.
// ─────────────────────────────────────────────────────────────────────────────

const BLOCKED_OPS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndReplace',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
] as const;

BLOCKED_OPS.forEach((op) => {
  AuditLogSchema.pre(op as any, function () {
    throw new Error(
      `[AuditLog] Immutability violation: "${op}" is not allowed on audit logs.`
    );
  });
});

export const AuditLog = model<IAuditLogDocument>('AuditLog', AuditLogSchema);
