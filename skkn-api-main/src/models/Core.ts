import { Schema, model, Types, Document } from "mongoose";

// ── Interfaces ────────────────────────────────────────────────────────────────

export type GioiTinh = "Nam" | "Nữ" | "Khác";

export interface IAttachment {
  fileName: string;
  fileUrl: string;
  size: number;
  uploadedAt: Date;
}

export interface ISubject {
  hoTen: string;
  ngaySinh: Date;
  cccd: string;
  gioiTinh?: GioiTinh;
  // Hometown (quê quán)
  queQuan_Province: Types.ObjectId;
  queQuan_District?: Types.ObjectId;
  queQuan_Ward?: Types.ObjectId;
  // Current residence (nơi ở)
  noiO_Province: Types.ObjectId;
  noiO_District?: Types.ObjectId;
  noiO_Ward?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecord {
  soHoSo: string;
  loaiHoSo: Types.ObjectId;
  noiTHA: Types.ObjectId;
  loaiNoiTHA: Types.ObjectId;
  doiTHA: Types.ObjectId;
  nguoiCHA?: Types.ObjectId;
  ghiChu?: string;
  currentAssignee?: Types.ObjectId;
  currentOrgUnit?: Types.ObjectId;
  attachments: IAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecordTransferHistory {
  record: Types.ObjectId;
  fromUnit?: Types.ObjectId;
  fromUser?: Types.ObjectId;
  toUnit?: Types.ObjectId;
  toUser?: Types.ObjectId;
  transferDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Document types
export interface ISubjectDocument extends ISubject, Document {}
export interface IRecordDocument extends IRecord, Document {}
export interface IRecordTransferHistoryDocument extends IRecordTransferHistory, Document {}

// ── Attachment Sub-schema ─────────────────────────────────────────────────────

const attachmentSchema = new Schema<IAttachment>(
  {
    fileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: [0, "File size cannot be negative"] },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false } // Sub-documents don't need their own _id
);

// ── Subject ───────────────────────────────────────────────────────────────────

const subjectSchema = new Schema<ISubjectDocument>(
  {
    hoTen: { type: String, required: [true, "Họ tên là bắt buộc"], trim: true },
    ngaySinh: { type: Date, required: [true, "Ngày sinh là bắt buộc"] },
    cccd: {
      type: String,
      required: [true, "CCCD là bắt buộc"],
      unique: true,
      trim: true,
      // Exactly 12 numeric characters per Vietnamese national ID standard
      validate: {
        validator: (v: string) => /^\d{12}$/.test(v),
        message: "CCCD phải đúng 12 chữ số",
      },
    },
    gioiTinh: {
      type: String,
      enum: {
        values: ["Nam", "Nữ", "Khác"],
        message: "Giới tính không hợp lệ: {VALUE}",
      },
    },

    // ── Hometown ───────────────────────────────────────────────────────────
    queQuan_Province: {
      type: Schema.Types.ObjectId,
      ref: "Province",
      required: [true, "Tỉnh/thành quê quán là bắt buộc"],
    },
    queQuan_District: { type: Schema.Types.ObjectId, ref: "District" },
    queQuan_Ward: { type: Schema.Types.ObjectId, ref: "Ward" },

    // ── Current residence ──────────────────────────────────────────────────
    noiO_Province: {
      type: Schema.Types.ObjectId,
      ref: "Province",
      required: [true, "Tỉnh/thành nơi ở là bắt buộc"],
    },
    noiO_District: { type: Schema.Types.ObjectId, ref: "District" },
    noiO_Ward: { type: Schema.Types.ObjectId, ref: "Ward" },
  },
  { timestamps: true }
);

// ── Record ────────────────────────────────────────────────────────────────────

const recordSchema = new Schema<IRecordDocument>(
  {
    soHoSo: {
      type: String,
      required: [true, "Số hồ sơ là bắt buộc"],
      unique: true,
      trim: true,
    },
    loaiHoSo: {
      type: Schema.Types.ObjectId,
      ref: "RecordType",
      required: [true, "Loại hồ sơ là bắt buộc"],
    },
    noiTHA: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Nơi THA là bắt buộc"],
    },
    loaiNoiTHA: {
      type: Schema.Types.ObjectId,
      ref: "UnitType",
      required: [true, "Loại nơi THA là bắt buộc"],
    },
    doiTHA: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Đội THA là bắt buộc"],
    },
    nguoiCHA: { type: Schema.Types.ObjectId, ref: "Subject" },
    ghiChu: { type: String, trim: true },
    currentAssignee: { type: Schema.Types.ObjectId, ref: "User" },
    currentOrgUnit: { type: Schema.Types.ObjectId, ref: "OrgUnit" },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true }
);

// ── RecordTransferHistory ─────────────────────────────────────────────────────

const recordTransferHistorySchema = new Schema<IRecordTransferHistoryDocument>(
  {
    record: {
      type: Schema.Types.ObjectId,
      ref: "Record",
      required: [true, "Hồ sơ là bắt buộc"],
    },
    fromUnit: { type: Schema.Types.ObjectId, ref: "OrgUnit" },
    fromUser: { type: Schema.Types.ObjectId, ref: "User" },
    toUnit: { type: Schema.Types.ObjectId, ref: "OrgUnit" },
    toUser: { type: Schema.Types.ObjectId, ref: "User" },
    transferDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── Exports ───────────────────────────────────────────────────────────────────

export const Subject = model<ISubjectDocument>("Subject", subjectSchema);
export const Record = model<IRecordDocument>("Record", recordSchema);
export const RecordTransferHistory = model<IRecordTransferHistoryDocument>(
  "RecordTransferHistory",
  recordTransferHistorySchema
);
