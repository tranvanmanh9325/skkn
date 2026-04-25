/**
 * Enriches existing Subject records with detailed personal data.
 *
 * Strategy: updateOne with $set matched by hoTen — safe to re-run on every
 * container start; no-ops if the data is already correct. The script never
 * creates new subjects; it only patches existing ones.
 *
 * Note: queQuan / thuongTru are plain strings in the request but the Subject
 * schema stores them as Province/District/Ward ObjectId refs (queQuan_Province,
 * noiO_Province, …). Those refs are already populated by seedRecords.ts.
 * This script therefore updates only the scalar personal fields.
 *
 * Run with:
 *   npm run seed:subjects-detailed
 */

// Must be first so env vars are available to all subsequent imports.
import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Subject } from "../models/Core";

// ── Config ────────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/skkn";

// ── Data ──────────────────────────────────────────────────────────────────────

interface SubjectPatch {
  hoTen: string;
  ngaySinh: Date;
  gioiTinh: "Nam" | "Nữ" | "Khác";
  cccd: string;
  queQuan: string;
  thuongTru: string;
}

const subjectPatches: SubjectPatch[] = [
  { hoTen: "Nguyễn Văn A",        ngaySinh: new Date("1990-01-01"), gioiTinh: "Nam", cccd: "001090123456", queQuan: "Hà Nội",           thuongTru: "123 Đường Lê Lợi, Hà Nội" },
  { hoTen: "HOÀNG HƯƠNG",         ngaySinh: new Date("1985-05-12"), gioiTinh: "Nữ",  cccd: "001085654321", queQuan: "Nghệ An",         thuongTru: "456 Phố Huế, Hà Nội" },
  { hoTen: "Bùi Minh Vũ",         ngaySinh: new Date("1992-08-20"), gioiTinh: "Nam", cccd: "001092111222", queQuan: "Thanh Hóa",        thuongTru: "789 Đường Trần Phú, Hà Nội" },
  { hoTen: "TẠ THỊ YẾN",          ngaySinh: new Date("1988-11-05"), gioiTinh: "Nữ",  cccd: "001088333444", queQuan: "Nam Định",        thuongTru: "12 Đường Đinh Tiên Hoàng, Hà Nội" },
  { hoTen: "HÀ THỊ THẢO",         ngaySinh: new Date("1995-02-14"), gioiTinh: "Nữ",  cccd: "001095555666", queQuan: "Hải Phòng",       thuongTru: "34 Phố Bà Triệu, Hà Nội" },
  { hoTen: "NGÔ VĂN PHÚC 123444", ngaySinh: new Date("1980-10-10"), gioiTinh: "Nam", cccd: "001080777888", queQuan: "Hưng Yên",        thuongTru: "56 Đường Ngọc Hồi, Hà Nội" },
  { hoTen: "ĐỖ MINH QUÂN",        ngaySinh: new Date("1998-12-25"), gioiTinh: "Nam", cccd: "001098999000", queQuan: "Thái Bình",        thuongTru: "78 Đường Kim Mã, Hà Nội" },
];

// ── Seed ──────────────────────────────────────────────────────────────────────

const seed = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
  console.log("[SeedSubjectsDetailed] Connected to MongoDB:", MONGO_URI);

  for (const patch of subjectPatches) {
    const result = await Subject.updateOne(
      { hoTen: patch.hoTen },
      { $set: patch }
    );

    if (result.matchedCount === 0) {
      console.warn(`[SeedSubjectsDetailed] No subject found for hoTen="${patch.hoTen}" — skipped.`);
    } else {
      console.log(
        `[SeedSubjectsDetailed] Updated "${patch.hoTen}" ` +
        `(matched: ${result.matchedCount}, modified: ${result.modifiedCount}).`
      );
    }
  }
};

// ── Entry point ───────────────────────────────────────────────────────────────

seed()
  .then(() => {
    console.log("[SeedSubjectsDetailed] Completed successfully.");
    process.exit(0);
  })
  .catch((err: Error) => {
    console.error("[SeedSubjectsDetailed] Fatal error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("[SeedSubjectsDetailed] Database connection closed.");
  });
