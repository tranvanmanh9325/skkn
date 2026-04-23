import { Schema, model, Types, Document } from "mongoose";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface IOrgUnitType {
  name: string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrgUnit {
  name: string;
  type: Types.ObjectId;
  parentUnit?: Types.ObjectId;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUnitType {
  name: string;
  code: string;
  description?: string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUnit {
  name: string;
  shortName: string;
  type: Types.ObjectId;
  province: Types.ObjectId;
  district?: Types.ObjectId;
  ward: Types.ObjectId;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITeam {
  name: string;
  code: string;
  unit: Types.ObjectId;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecordType {
  name: string;
  code: string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Document types
export interface IOrgUnitTypeDocument extends IOrgUnitType, Document {}
export interface IOrgUnitDocument extends IOrgUnit, Document {}
export interface IUnitTypeDocument extends IUnitType, Document {}
export interface IUnitDocument extends IUnit, Document {}
export interface ITeamDocument extends ITeam, Document {}
export interface IRecordTypeDocument extends IRecordType, Document {}

// ── OrgUnitType ───────────────────────────────────────────────────────────────

const orgUnitTypeSchema = new Schema<IOrgUnitTypeDocument>(
  {
    name: { type: String, required: [true, "Tên loại đơn vị là bắt buộc"], trim: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── OrgUnit ───────────────────────────────────────────────────────────────────

const orgUnitSchema = new Schema<IOrgUnitDocument>(
  {
    name: { type: String, required: [true, "Tên đơn vị tổ chức là bắt buộc"], trim: true },
    type: {
      type: Schema.Types.ObjectId,
      ref: "OrgUnitType",
      required: [true, "Loại đơn vị là bắt buộc"],
    },
    // Self-referential for hierarchical org trees
    parentUnit: { type: Schema.Types.ObjectId, ref: "OrgUnit" },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── UnitType ──────────────────────────────────────────────────────────────────

const unitTypeSchema = new Schema<IUnitTypeDocument>(
  {
    name: { type: String, required: [true, "Tên loại nơi THA là bắt buộc"], trim: true },
    code: {
      type: String,
      required: [true, "Mã loại nơi THA là bắt buộc"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── Unit ──────────────────────────────────────────────────────────────────────

const unitSchema = new Schema<IUnitDocument>(
  {
    name: { type: String, required: [true, "Tên nơi THA là bắt buộc"], trim: true },
    shortName: { type: String, required: [true, "Tên viết tắt là bắt buộc"], trim: true },
    type: {
      type: Schema.Types.ObjectId,
      ref: "UnitType",
      required: [true, "Loại nơi THA là bắt buộc"],
    },
    province: {
      type: Schema.Types.ObjectId,
      ref: "Province",
      required: [true, "Tỉnh/thành là bắt buộc"],
    },
    district: { type: Schema.Types.ObjectId, ref: "District" },
    ward: {
      type: Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Phường/xã là bắt buộc"],
    },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── Team ──────────────────────────────────────────────────────────────────────

const teamSchema = new Schema<ITeamDocument>(
  {
    name: { type: String, required: [true, "Tên đội THA là bắt buộc"], trim: true },
    code: {
      type: String,
      required: [true, "Mã đội THA là bắt buộc"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Nơi THA là bắt buộc"],
    },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── RecordType ────────────────────────────────────────────────────────────────

const recordTypeSchema = new Schema<IRecordTypeDocument>(
  {
    name: { type: String, required: [true, "Tên loại hồ sơ là bắt buộc"], trim: true },
    code: {
      type: String,
      required: [true, "Mã loại hồ sơ là bắt buộc"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// ── Exports ───────────────────────────────────────────────────────────────────

export const OrgUnitType = model<IOrgUnitTypeDocument>("OrgUnitType", orgUnitTypeSchema);
export const OrgUnit = model<IOrgUnitDocument>("OrgUnit", orgUnitSchema);
export const UnitType = model<IUnitTypeDocument>("UnitType", unitTypeSchema);
export const Unit = model<IUnitDocument>("Unit", unitSchema);
export const Team = model<ITeamDocument>("Team", teamSchema);
export const RecordType = model<IRecordTypeDocument>("RecordType", recordTypeSchema);
