/**
 * Admin seeder — bootstraps all required reference documents before creating
 * the initial admin User. Safe to re-run: all operations are idempotent via
 * findOneAndUpdate + upsert.
 *
 * Run with:
 *   npm run seed:admin
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Role, Position } from "../models/System";
import { OrgUnitType, OrgUnit } from "../models/MasterData";

// ── Config ────────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/skkn";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "09032005";
const SALT_ROUNDS = 12;

/** All permissions granted to the bootstrap Admin role. */
const ADMIN_PERMISSIONS = [
  "record:view",
  "record:create",
  "record:update",
  "record:delete",
  "user:view",
  "user:manage",
  "role:view",
  "role:manage",
  "orgunit:view",
  "orgunit:manage",
  "masterdata:view",
  "masterdata:manage",
  "report:view",
  "system:admin",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** findOneAndUpdate with upsert — returns the doc (new or existing). */
async function upsertOne<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  filter: mongoose.FilterQuery<T>,
  data: mongoose.UpdateQuery<T>
): Promise<T> {
  const doc = await model.findOneAndUpdate(filter, { $setOnInsert: data }, { upsert: true, new: true });
  // findOneAndUpdate with upsert always returns a doc when new:true
  return doc as T;
}

// ── Seed ──────────────────────────────────────────────────────────────────────

const seed = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
  console.log("[Seed] Connected to MongoDB:", MONGO_URI);

  // 1. OrgUnitType — must exist before OrgUnit
  const orgUnitType = await upsertOne(OrgUnitType, { name: "Hệ thống" }, { name: "Hệ thống", note: "Loại đơn vị mặc định cho hệ thống" });
  console.log("[Seed] OrgUnitType ready:", orgUnitType._id);

  // 2. OrgUnit — depends on OrgUnitType
  const orgUnit = await upsertOne(
    OrgUnit,
    { name: "Ban Quản Trị" },
    { name: "Ban Quản Trị", type: orgUnitType._id, note: "Đơn vị quản trị hệ thống" }
  );
  console.log("[Seed] OrgUnit ready:", orgUnit._id);

  // 3. Position — description is required per schema
  const position = await upsertOne(
    Position,
    { name: "Quản trị viên" },
    { name: "Quản trị viên", description: "Quản trị toàn hệ thống" }
  );
  console.log("[Seed] Position ready:", position._id);

  // 4. Role — with full permission set
  const role = await upsertOne(
    Role,
    { name: "Admin" },
    { name: "Admin", description: "Nhóm quyền quản trị viên hệ thống", permissions: ADMIN_PERMISSIONS }
  );
  console.log("[Seed] Role ready:", role._id);

  // 5. Admin User — only create if not already present
  const existing = await User.findOne({ username: ADMIN_USERNAME });
  if (existing) {
    console.log(`[Seed] User "${ADMIN_USERNAME}" already exists — skipping.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  await User.create({
    username: ADMIN_USERNAME,
    password: hashedPassword,
    fullName: "Administrator",
    email: "admin@system.local",
    role: role._id,
    position: position._id,
    orgUnit: orgUnit._id,
    isLeader: true,
  });

  console.log(`[Seed] Admin user "${ADMIN_USERNAME}" created successfully.`);
};

// ── Entry point ───────────────────────────────────────────────────────────────

seed()
  .then(() => {
    console.log("[Seed] Completed.");
    process.exit(0);
  })
  .catch((err: Error) => {
    console.error("[Seed] Fatal error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("[Seed] Database connection closed.");
  });
