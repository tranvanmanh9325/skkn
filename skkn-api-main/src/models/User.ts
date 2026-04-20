import { Schema, model, Document } from "mongoose";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface IUser {
  username: string;
  password: string;
  role: "admin" | "user";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

// ── Schema ────────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
    // Never expose the password field in JSON responses by default
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret["password"];
        return ret;
      },
    },
  }
);

export const User = model<IUserDocument>("User", userSchema);
