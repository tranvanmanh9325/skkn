import { Schema, model, Types, Document } from "mongoose";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface IProvince {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDistrict {
  name: string;
  province: Types.ObjectId;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWard {
  name: string;
  district: Types.ObjectId;
  province: Types.ObjectId;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Document types merge the plain interface with Mongoose's Document
export interface IProvinceDocument extends IProvince, Document {}
export interface IDistrictDocument extends IDistrict, Document {}
export interface IWardDocument extends IWard, Document {}

// ── Province ──────────────────────────────────────────────────────────────────

const provinceSchema = new Schema<IProvinceDocument>(
  {
    name: { type: String, required: [true, "Tên tỉnh/thành là bắt buộc"], trim: true },
  },
  { timestamps: true }
);

// ── District ──────────────────────────────────────────────────────────────────

const districtSchema = new Schema<IDistrictDocument>(
  {
    name: { type: String, required: [true, "Tên quận/huyện là bắt buộc"], trim: true },
    province: {
      type: Schema.Types.ObjectId,
      ref: "Province",
      required: [true, "Tỉnh/thành là bắt buộc"],
    },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── Ward ──────────────────────────────────────────────────────────────────────

const wardSchema = new Schema<IWardDocument>(
  {
    name: { type: String, required: [true, "Tên phường/xã là bắt buộc"], trim: true },
    district: {
      type: Schema.Types.ObjectId,
      ref: "District",
      required: [true, "Quận/huyện là bắt buộc"],
    },
    province: {
      type: Schema.Types.ObjectId,
      ref: "Province",
      required: [true, "Tỉnh/thành là bắt buộc"],
    },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── Exports ───────────────────────────────────────────────────────────────────

export const Province = model<IProvinceDocument>("Province", provinceSchema);
export const District = model<IDistrictDocument>("District", districtSchema);
export const Ward = model<IWardDocument>("Ward", wardSchema);
