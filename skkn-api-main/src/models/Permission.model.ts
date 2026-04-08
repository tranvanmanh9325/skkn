import { Schema, model, Document, Types, PopulatedDoc } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Enums — dùng const enum để tree-shake tốt hơn; export riêng để dùng ở middleware
// ─────────────────────────────────────────────────────────────────────────────

export const RESOURCES = ['DOSSIER', 'DOCUMENT', 'VERDICT', 'REPORT', 'USER'] as const;
export const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'PRINT'] as const;
export const DATA_SCOPES = ['OWN', 'UNIT', 'ALL'] as const;
export const ROLE_NAMES = [
  'EXECUTION_OFFICER',
  'JUDGE',
  'ARCHIVIST',
  'AGENCY_LEADER',
  'ADMIN',
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type DataScope = (typeof DATA_SCOPES)[number];
export type RoleName = (typeof ROLE_NAMES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────────────────

export interface IPermission {
  resource: Resource;
  action: Action;
  description: string;
}

export interface IPermissionDocument extends IPermission, Document {}

const PermissionSchema = new Schema<IPermissionDocument>(
  {
    resource: { type: String, enum: RESOURCES, required: true },
    action: { type: String, enum: ACTIONS, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// Đảm bảo mỗi cặp resource+action là duy nhất
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

export const Permission = model<IPermissionDocument>('Permission', PermissionSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Role
// ─────────────────────────────────────────────────────────────────────────────

export interface IRole {
  name: RoleName;
  /**
   * Phạm vi dữ liệu:
   * - OWN: chỉ thấy hồ sơ được giao cho bản thân
   * - UNIT: thấy tất cả hồ sơ trong đơn vị (dùng cho cấp trưởng phòng)
   * - ALL: không giới hạn (dùng cho Admin)
   */
  dataScope: DataScope;
  // PopulatedDoc<T> = T | ObjectId — cách chuẩn Mongoose v8 để type ref field
  permissions: PopulatedDoc<IPermissionDocument>[];
  description: string;
  isActive: boolean;
}

export interface IRoleDocument extends IRole, Document {}

const RoleSchema = new Schema<IRoleDocument>(
  {
    name: { type: String, enum: ROLE_NAMES, required: true, unique: true },
    dataScope: { type: String, enum: DATA_SCOPES, required: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Role = model<IRoleDocument>('Role', RoleSchema);
