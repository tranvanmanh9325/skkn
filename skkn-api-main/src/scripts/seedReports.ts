/**
 * Report seeder — idempotently seeds sample Report documents.
 * Uses upsert on `tenBaoCao` as the natural business key to prevent duplicates
 * on container restarts.
 *
 * Run with:
 *   npm run seed:reports
 */

import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Report } from "../models/Report";

// ── Config ────────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/skkn";

// ── Seed data ─────────────────────────────────────────────────────────────────

const reportsData = [
  {
    tenBaoCao: "Báo cáo tháng 1/2025",
    coQuanNhan: "Viện Kiểm sát nhân dân TP.HCM",
    ngayXuat: "2025-01-31",
    trangThai: "Hoàn thành" as const,
  },
  {
    tenBaoCao: "Báo cáo tháng 2/2025",
    coQuanNhan: "TAND quận Bình Thạnh",
    ngayXuat: "2025-02-28",
    trangThai: "Hoàn thành" as const,
  },
  {
    tenBaoCao: "Báo cáo quý I/2025",
    coQuanNhan: "Cục Thi hành án dân sự TP.HCM",
    ngayXuat: "2025-03-31",
    trangThai: "Đang xử lý" as const,
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────────

const seed = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
  console.log("[SeedReports] Connected to MongoDB:", MONGO_URI);

  for (const item of reportsData) {
    await Report.updateOne(
      { tenBaoCao: item.tenBaoCao },
      { $set: item },
      { upsert: true }
    );
    console.log(`[SeedReports] Upserted: "${item.tenBaoCao}"`);
  }
};

// ── Entry point ───────────────────────────────────────────────────────────────

seed()
  .then(() => {
    console.log("[SeedReports] Completed successfully.");
    process.exit(0);
  })
  .catch((err: Error) => {
    console.error("[SeedReports] Fatal error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("[SeedReports] Database connection closed.");
  });
