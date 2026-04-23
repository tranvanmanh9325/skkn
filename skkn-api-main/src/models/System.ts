import { Schema, model, Types, Document } from "mongoose";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface IPosition {
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRole {
  name: string;
  description?: string;
  /** Fine-grained permission strings e.g. 'record:view', 'user:manage' */
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: Types.ObjectId;
  position: Types.ObjectId;
  orgUnit: Types.ObjectId;
  /** Direct manager — self-referential */
  manager?: Types.ObjectId;
  isLeader: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Document types
export interface IPositionDocument extends IPosition, Document {}
export interface IRoleDocument extends IRole, Document {}
export interface IUserDocument extends IUser, Document {}

// ── Position ──────────────────────────────────────────────────────────────────

const positionSchema = new Schema<IPositionDocument>(
  {
    name: { type: String, required: [true, "Tên chức vụ là bắt buộc"], trim: true },
    description: { type: String, required: [true, "Mô tả chức vụ là bắt buộc"], trim: true },
  },
  { timestamps: true }
);

// ── Role ──────────────────────────────────────────────────────────────────────

const roleSchema = new Schema<IRoleDocument>(
  {
    name: { type: String, required: [true, "Tên nhóm quyền là bắt buộc"], trim: true },
    description: { type: String, trim: true },
    permissions: {
      type: [String],
      default: [],
      // Enforce non-empty permission strings at the element level
      validate: {
        validator: (arr: string[]) => arr.every((p) => p.trim().length > 0),
        message: "Permission strings must not be empty",
      },
    },
  },
  { timestamps: true }
);

// ── User ──────────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, "Tên đăng nhập là bắt buộc"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Tên đăng nhập tối thiểu 3 ký tự"],
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [6, "Mật khẩu tối thiểu 6 ký tự"],
    },
    fullName: { type: String, required: [true, "Họ tên là bắt buộc"], trim: true },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    phone: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Nhóm quyền là bắt buộc"],
    },
    position: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      required: [true, "Chức vụ là bắt buộc"],
    },
    orgUnit: {
      type: Schema.Types.ObjectId,
      ref: "OrgUnit",
      required: [true, "Đơn vị tổ chức là bắt buộc"],
    },
    manager: { type: Schema.Types.ObjectId, ref: "User" },
    isLeader: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    // Strip password from any JSON serialisation by default
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret["password"];
        return ret;
      },
    },
  }
);

// ── Exports ───────────────────────────────────────────────────────────────────

export const Position = model<IPositionDocument>("Position", positionSchema);
export const Role = model<IRoleDocument>("Role", roleSchema);
export const User = model<IUserDocument>("User", userSchema);
