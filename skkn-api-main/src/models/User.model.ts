import { Schema, model, Document, Types, PopulatedDoc, CallbackWithoutResultAndOptionalError } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IRoleDocument } from './Permission.model';

export interface IUnit {
  _id: Types.ObjectId;
  name: string;
  code: string;
}

export interface IUser {
  employeeId: string;
  name: string;
  email: string;
  passwordHash: string;
  // PopulatedDoc<T> = T | ObjectId — cách chuẩn Mongoose v8
  roles: PopulatedDoc<IRoleDocument>[];
  unit: Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Email không hợp lệ'],
    },
    passwordHash: { type: String, required: true, select: false }, // không trả về mặc định
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role', required: true }],
    unit: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    // Bảo vệ brute-force: đếm login thất bại và lock tạm thời
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { timestamps: true }
);

// Index compound để query thường dùng trong scopeQuery không tốn full scan
UserSchema.index({ unit: 1, isActive: 1 });

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Hash password trước khi save, chỉ khi passwordHash thực sự thay đổi
UserSchema.pre('save', async function (this: IUserDocument, next: CallbackWithoutResultAndOptionalError) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

export const User = model<IUserDocument>('User', UserSchema);
