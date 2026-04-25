/**
 * Records seeder — idempotently seeds the full dependency chain required by the
 * Record model: Province → District → Ward → UnitType → Unit → Team →
 * RecordType → Subject → Record.
 *
 * Each layer uses upsert on its natural unique key so re-runs on container
 * restart are completely safe and produce no duplicates.
 *
 * Run with:
 *   npm run seed:records
 */

// Must be first so env vars are available to all subsequent imports.
import * as dotenv from "dotenv";
dotenv.config();

import mongoose, { Types } from "mongoose";
import { Province, District, Ward } from "../models/Geography";
import { UnitType, Unit, Team, RecordType } from "../models/MasterData";
import { Subject, Record } from "../models/Core";

// ── Config ────────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/skkn";

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Upserts a document by a unique key field and returns its _id.
 * Using `findOneAndUpdate` with `returnDocument: "after"` guarantees we get
 * the persisted _id whether the doc was inserted or already existed.
 */
async function upsertAndGetId<T>(
  model: mongoose.Model<T & mongoose.Document>,
  filter: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<Types.ObjectId> {
  const doc = await model.findOneAndUpdate(filter, { $set: data }, { upsert: true, new: true });
  // doc is guaranteed non-null after upsert: true + new: true
  return (doc as unknown as { _id: Types.ObjectId })._id;
}

// ── Seed ──────────────────────────────────────────────────────────────────────

const seed = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
  console.log("[SeedRecords] Connected to MongoDB:", MONGO_URI);

  // ── 1. Geography ─────────────────────────────────────────────────────────────
  // Two provinces cover all dummy units/subjects below.

  const provinceHaNoi = await upsertAndGetId(Province as any, { name: "Thành phố Hà Nội" }, { name: "Thành phố Hà Nội" });
  const provinceAnGiang = await upsertAndGetId(Province as any, { name: "An Giang" }, { name: "An Giang" });
  console.log("[SeedRecords] Provinces upserted.");

  // Districts — one per province used by our dummy wards.
  const districtLongBien = await upsertAndGetId(District as any, { name: "Quận Long Biên" }, { name: "Quận Long Biên", province: provinceHaNoi });
  const districtQuan1 = await upsertAndGetId(District as any, { name: "Quận 1" }, { name: "Quận 1", province: provinceHaNoi });
  const districtAnGiang = await upsertAndGetId(District as any, { name: "Huyện Thoại Sơn" }, { name: "Huyện Thoại Sơn", province: provinceAnGiang });
  console.log("[SeedRecords] Districts upserted.");

  // Wards — one per unit/subject pair to satisfy required refs.
  const wardBoDe = await upsertAndGetId(Ward as any, { name: "Phường Bồ Đề" }, { name: "Phường Bồ Đề", district: districtLongBien, province: provinceHaNoi });
  const wardPhuongL = await upsertAndGetId(Ward as any, { name: "Phường L" }, { name: "Phường L", district: districtQuan1, province: provinceHaNoi });
  // Generic ward used for the dummy "UBND Phường" unit and subjects without a real ward.
  const wardGeneric = await upsertAndGetId(Ward as any, { name: "Phường Chung" }, { name: "Phường Chung", district: districtLongBien, province: provinceHaNoi });
  const wardAnGiang = await upsertAndGetId(Ward as any, { name: "Thị trấn Núi Sập" }, { name: "Thị trấn Núi Sập", district: districtAnGiang, province: provinceAnGiang });
  console.log("[SeedRecords] Wards upserted.");

  // ── 2. UnitType ───────────────────────────────────────────────────────────────
  // We reuse the master-data UnitType; upsert by code so it coexists with seedMasterData.

  const unitTypeUBND = await upsertAndGetId(UnitType as any, { code: "UBND" }, { name: "UBND", code: "UBND", description: "Ủy ban nhân dân" });
  const unitTypeTHA = await upsertAndGetId(UnitType as any, { code: "THA" }, { name: "Thi hành án", code: "THA", description: "Cơ quan thi hành án" });
  console.log("[SeedRecords] UnitTypes upserted.");

  // ── 3. RecordType ─────────────────────────────────────────────────────────────
  // One generic type used for all seeded records; coexists with seedMasterData records.

  const recordTypeSeed = await upsertAndGetId(RecordType as any, { code: "HSTHAS" }, { name: "Hồ sơ thi hành án sự", code: "HSTHAS", note: "Hồ sơ thi hành án hình sự" });
  console.log("[SeedRecords] RecordType upserted.");

  // ── 4. Units (Nơi THA) ────────────────────────────────────────────────────────

  const unitBoDe = await upsertAndGetId(Unit as any,
    { name: "UBND phường Bồ Đề, quận Long Biên, Thành phố Hà Nội" },
    { name: "UBND phường Bồ Đề, quận Long Biên, Thành phố Hà Nội", shortName: "UBND p.Bồ Đề", type: unitTypeUBND, province: provinceHaNoi, district: districtLongBien, ward: wardBoDe }
  );

  const unitPhuongL = await upsertAndGetId(Unit as any,
    { name: "UBND phường L, quận 1, Thành phố Hà Nội" },
    { name: "UBND phường L, quận 1, Thành phố Hà Nội", shortName: "UBND p.L Q1", type: unitTypeUBND, province: provinceHaNoi, district: districtQuan1, ward: wardPhuongL }
  );

  const unitPhuongGeneric = await upsertAndGetId(Unit as any,
    { name: "UBND Phường" },
    { name: "UBND Phường", shortName: "UBND Phường", type: unitTypeUBND, province: provinceHaNoi, district: districtLongBien, ward: wardGeneric }
  );

  const unitAnGiang = await upsertAndGetId(Unit as any,
    { name: "THA An Giang 1" },
    { name: "THA An Giang 1", shortName: "THA AG1", type: unitTypeTHA, province: provinceAnGiang, district: districtAnGiang, ward: wardAnGiang }
  );
  console.log("[SeedRecords] Units upserted.");

  // ── 5. Teams (Đội THA) ────────────────────────────────────────────────────────
  // `code` is the unique key; use a short deterministic slug.

  const teamDoi1 = await upsertAndGetId(Team as any,
    { code: "D1PC10CATP" },
    { name: "Đội 1, Phòng PC10, CATP Hà Nội.", code: "D1PC10CATP", unit: unitBoDe }
  );

  const teamCQTHAHS = await upsertAndGetId(Team as any,
    { code: "CQTHAHS" },
    { name: "Cơ quan Thi hành án hình sự", code: "CQTHAHS", unit: unitAnGiang }
  );

  const teamTHAHS = await upsertAndGetId(Team as any,
    { code: "THAHS" },
    { name: "Cơ quan THAHS", code: "THAHS", unit: unitAnGiang }
  );
  console.log("[SeedRecords] Teams upserted.");

  // ── 6. Subjects (Người CHA) ───────────────────────────────────────────────────
  // cccd must be unique and exactly 12 digits. Each dummy subject gets a
  // deterministic 12-digit code derived from a sequential offset.

  const subjectData = [
    { hoTen: "Nguyễn Văn A",       cccd: "001099000001", ngaySinh: new Date("1985-03-15"), gioiTinh: "Nam" },
    { hoTen: "HOÀNG HƯƠNG",        cccd: "001099000002", ngaySinh: new Date("1990-07-22"), gioiTinh: "Nữ"  },
    { hoTen: "Bùi Minh Vũ",        cccd: "001099000003", ngaySinh: new Date("1988-11-05"), gioiTinh: "Nam" },
    { hoTen: "TẠ THỊ YẾN",         cccd: "001099000004", ngaySinh: new Date("1992-04-18"), gioiTinh: "Nữ"  },
    { hoTen: "HÀ THỊ THẢO",        cccd: "001099000005", ngaySinh: new Date("1995-09-30"), gioiTinh: "Nữ"  },
    { hoTen: "NGÔ VĂN PHÚC 123444",cccd: "001099000006", ngaySinh: new Date("1980-01-12"), gioiTinh: "Nam" },
    { hoTen: "ĐỖ MINH QUÂN",       cccd: "001099000007", ngaySinh: new Date("1993-06-25"), gioiTinh: "Nam" },
  ] as const;

  // All subjects share the same dummy geographic refs (province/ward are required).
  const commonGeoRefs = {
    queQuan_Province: provinceHaNoi,
    queQuan_Ward: wardGeneric,
    noiO_Province: provinceHaNoi,
    noiO_Ward: wardGeneric,
  };

  const subjectIds: Record<string, Types.ObjectId> = {};
  for (const s of subjectData) {
    const id = await upsertAndGetId(Subject as any, { cccd: s.cccd }, { ...s, ...commonGeoRefs });
    subjectIds[s.hoTen] = id;
    console.log(`[SeedRecords] Subject upserted: ${s.hoTen}`);
  }

  // ── 7. Records (Hồ sơ) ───────────────────────────────────────────────────────

  type RecordSeed = {
    soHoSo: string;
    loaiHoSo: Types.ObjectId;
    noiTHA: Types.ObjectId;
    loaiNoiTHA: Types.ObjectId;
    doiTHA: Types.ObjectId;
    nguoiCHA?: Types.ObjectId;
    ghiChu?: string;
    attachments: [];
  };

  const records: RecordSeed[] = [
    {
      soHoSo: "ho_so_02032006",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["Nguyễn Văn A"],
      noiTHA: unitBoDe,
      loaiNoiTHA: unitTypeUBND,
      doiTHA: teamDoi1,
      attachments: [],
    },
    {
      soHoSo: "28CC0721",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["HOÀNG HƯƠNG"],
      noiTHA: unitPhuongL,
      loaiNoiTHA: unitTypeUBND,
      doiTHA: teamDoi1,
      attachments: [],
    },
    {
      soHoSo: "123123123213123",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["Nguyễn Văn A"],
      noiTHA: unitPhuongGeneric,
      loaiNoiTHA: unitTypeUBND,
      doiTHA: teamDoi1,
      attachments: [],
    },
    {
      soHoSo: "OKOKOKOKO1K",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["Bùi Minh Vũ"],
      noiTHA: unitPhuongL,
      loaiNoiTHA: unitTypeUBND,
      doiTHA: teamCQTHAHS,
      attachments: [],
    },
    {
      soHoSo: "OKOKOKOKOK",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["Bùi Minh Vũ"],
      noiTHA: unitPhuongL,
      loaiNoiTHA: unitTypeUBND,
      doiTHA: teamCQTHAHS,
      attachments: [],
    },
    {
      soHoSo: "18112025",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["TẠ THỊ YẾN"],
      noiTHA: unitAnGiang,
      loaiNoiTHA: unitTypeTHA,
      doiTHA: teamTHAHS,
      attachments: [],
    },
    {
      soHoSo: "181120278",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["TẠ THỊ YẾN"],
      noiTHA: unitBoDe,
      loaiNoiTHA: unitTypeUBND,
      doiTHA: teamDoi1,
      ghiChu: "123",
      attachments: [],
    },
    {
      soHoSo: "25FULLV5_15",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["HÀ THỊ THẢO"],
      noiTHA: unitPhuongGeneric,
      loaiNoiTHA: unitTypeUBND,
      // doiTHA is required by schema; use the generic team as a safe fallback.
      doiTHA: teamDoi1,
      attachments: [],
    },
    {
      soHoSo: "25FULLV5_14",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["NGÔ VĂN PHÚC 123444"],
      noiTHA: unitPhuongGeneric,
      loaiNoiTHA: unitTypeUBND,
      doiTHA: teamDoi1,
      attachments: [],
    },
    {
      soHoSo: "25FULLV5_06",
      loaiHoSo: recordTypeSeed,
      nguoiCHA: subjectIds["ĐỖ MINH QUÂN"],
      noiTHA: unitPhuongGeneric,
      loaiNoiTHA: unitTypeUBND,
      doiTHA: teamDoi1,
      attachments: [],
    },
  ];

  for (const item of records) {
    await Record.updateOne({ soHoSo: item.soHoSo }, { $set: item }, { upsert: true });
    console.log(`[SeedRecords] Record upserted: ${item.soHoSo}`);
  }
};

// ── Entry point ───────────────────────────────────────────────────────────────

seed()
  .then(() => {
    console.log("[SeedRecords] Completed successfully.");
    process.exit(0);
  })
  .catch((err: Error) => {
    console.error("[SeedRecords] Fatal error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("[SeedRecords] Database connection closed.");
  });
