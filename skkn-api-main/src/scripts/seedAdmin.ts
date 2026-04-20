/**
 * Admin seeder script.
 *
 * Add to package.json scripts:
 *   "seed:admin": "ts-node -r dotenv/config src/scripts/seedAdmin.ts"
 *
 * Run with:
 *   npm run seed:admin
 *
 * Requires: ts-node, dotenv (npm install --save-dev ts-node dotenv)
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/skkn";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "09032005";
const SALT_ROUNDS = 10;

const seed = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
  console.log("[Seed] Connected to MongoDB:", MONGO_URI);

  const existing = await User.findOne({ username: ADMIN_USERNAME });

  if (existing) {
    console.log(`[Seed] User "${ADMIN_USERNAME}" already exists — skipping.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  await User.create({
    username: ADMIN_USERNAME,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`[Seed] Admin user "${ADMIN_USERNAME}" created successfully.`);
};

seed()
  .catch((err) => {
    console.error("[Seed] Fatal error:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("[Seed] Database connection closed.");
  });
