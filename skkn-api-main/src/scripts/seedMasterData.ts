/**
 * Master Data seeder — idempotently seeds UnitType and RecordType lookup
 * collections. Uses upsert on `code` (the unique business key) so re-runs
 * on container restart are completely safe.
 *
 * Run with:
 *   npm run seed:master
 */

// Must be the very first executable lines so env vars are available everywhere below.
import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { UnitType, RecordType } from "../models/MasterData";

// ── Config ────────────────────────────────────────────────────────────────────

// Fallback uses the Docker Compose service name (`mongodb`), not `localhost`,
// so the container can reach MongoDB even if MONGODB_URI is not injected.
const MONGO_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/skkn";

// ── Seed data ─────────────────────────────────────────────────────────────────

const unitTypesData = [
  { name: "Trại tạm giam",        code: "TTG",   description: "Trại tạm giam tại các địa phương" },
  { name: "Trại giam địa phương", code: "TGTT1" },
  { name: "Trại giam quân sự",    code: "TGQS" },
  { name: "Giám sát cộng đồng",   code: "GSCĐ" },
];

const recordTypesData = [
  {
    name: "Hồ sơ lao động",
    code: "HSLD",
    note: "Chứa thông tin về việc làm, hợp đồng lao động, bảo hiểm xã hội, tiền lương và đánh giá công việc.",
  },
  {
    name: "Hồ sơ học tập",
    code: "HSHT",
    note: "Lưu trữ thông tin học tập như bảng điểm, chứng chỉ, bằng cấp, quá trình đào tạo hoặc nghiên cứu.",
  },
  {
    name: "Hồ sơ pháp lý",
    code: "HSPL",
    note: "Bao gồm các giấy tờ, tài liệu liên quan đến thủ tục pháp lý, hợp đồng, tranh chấp hoặc quyết định của tòa án.",
  },
  {
    name: "Hồ sơ y tế",
    code: "HSYT",
    note: "Gồm bệnh án, tiền sử bệnh, hồ sơ khám chữa bệnh, kết quả xét nghiệm và thông tin bảo hiểm y tế.",
  },
  {
    name: "Hồ sơ cá nhân",
    code: "HSCA",
    note: "Chứa thông tin cá nhân như họ tên, ngày sinh, địa chỉ, tình trạng hôn nhân và các giấy tờ tùy thân.",
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────────

const seed = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
  console.log("[SeedMasterData] Connected to MongoDB:", MONGO_URI);

  // Upsert on `code` — the unique business key defined as `unique: true` in schema
  for (const item of unitTypesData) {
    await UnitType.updateOne({ code: item.code }, { $set: item }, { upsert: true });
    console.log(`[SeedMasterData] UnitType upserted: ${item.code} — ${item.name}`);
  }

  for (const item of recordTypesData) {
    await RecordType.updateOne({ code: item.code }, { $set: item }, { upsert: true });
    console.log(`[SeedMasterData] RecordType upserted: ${item.code} — ${item.name}`);
  }
};

// ── Entry point ───────────────────────────────────────────────────────────────

seed()
  .then(() => {
    console.log("[SeedMasterData] Completed successfully.");
    process.exit(0);
  })
  .catch((err: Error) => {
    console.error("[SeedMasterData] Fatal error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("[SeedMasterData] Database connection closed.");
  });
