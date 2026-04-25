import { Schema, model, Document } from "mongoose";

// ── Interfaces ────────────────────────────────────────────────────────────────

export type ReportStatus = "Hoàn thành" | "Đang xử lý";

export interface IReport {
  tenBaoCao: string;
  coQuanNhan: string;
  ngayXuat: string;
  trangThai: ReportStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReportDocument extends IReport, Document {}

// ── Schema ────────────────────────────────────────────────────────────────────

const reportSchema = new Schema<IReportDocument>(
  {
    tenBaoCao: {
      type: String,
      required: [true, "Tên báo cáo là bắt buộc"],
      trim: true,
    },
    coQuanNhan: {
      type: String,
      required: [true, "Cơ quan nhận báo cáo là bắt buộc"],
      trim: true,
    },
    ngayXuat: {
      type: String,
      required: [true, "Ngày xuất là bắt buộc"],
      trim: true,
    },
    trangThai: {
      type: String,
      enum: {
        values: ["Hoàn thành", "Đang xử lý"],
        message: "Trạng thái không hợp lệ: {VALUE}",
      },
      required: [true, "Trạng thái là bắt buộc"],
    },
  },
  { timestamps: true }
);

// ── Export ────────────────────────────────────────────────────────────────────

export const Report = model<IReportDocument>("Report", reportSchema);
