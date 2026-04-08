/**
 * Script này chạy một lần khi setup môi trường mới.
 * Nó tạo toàn bộ Permission matrix và Role definitions trong DB.
 * Hoàn toàn idempotent: dùng upsert nên chạy nhiều lần không sinh duplicate.
 *
 * Chạy local: npm run seed
 * Chạy qua Docker: tự động chạy trước `npm run dev` (xem docker-compose.yml)
 */

import 'dotenv/config'; // phải là import đầu tiên — load .env trước khi env.ts validate
import mongoose from 'mongoose';
import { Permission, Role, RESOURCES, ACTIONS } from '../models/Permission.model';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────────────────────
// Permission Matrix
// key: RESOURCE__ACTION, value: description
// ─────────────────────────────────────────────────────────────────────────────

const PERMISSION_MATRIX: Array<{
  resource: (typeof RESOURCES)[number];
  action: (typeof ACTIONS)[number];
  description: string;
}> = [
  // DOSSIER
  { resource: 'DOSSIER', action: 'CREATE', description: 'Tạo hồ sơ thi hành án mới' },
  { resource: 'DOSSIER', action: 'READ', description: 'Xem thông tin hồ sơ' },
  { resource: 'DOSSIER', action: 'UPDATE', description: 'Cập nhật thông tin hồ sơ' },
  { resource: 'DOSSIER', action: 'DELETE', description: 'Xóa hồ sơ (dữ liệu vẫn còn trong audit log)' },
  { resource: 'DOSSIER', action: 'APPROVE', description: 'Phê duyệt quyết định thi hành án' },
  { resource: 'DOSSIER', action: 'EXPORT', description: 'Xuất danh sách hồ sơ ra file' },
  // DOCUMENT
  { resource: 'DOCUMENT', action: 'CREATE', description: 'Tải tài liệu lên hồ sơ' },
  { resource: 'DOCUMENT', action: 'READ', description: 'Xem / tải tài liệu' },
  { resource: 'DOCUMENT', action: 'DELETE', description: 'Xóa tài liệu' },
  { resource: 'DOCUMENT', action: 'PRINT', description: 'In tài liệu' },
  // VERDICT
  { resource: 'VERDICT', action: 'CREATE', description: 'Nhập bản án / quyết định' },
  { resource: 'VERDICT', action: 'READ', description: 'Xem bản án' },
  { resource: 'VERDICT', action: 'UPDATE', description: 'Chỉnh sửa thông tin bản án' },
  // REPORT
  { resource: 'REPORT', action: 'READ', description: 'Xem báo cáo tổng hợp và audit log' },
  { resource: 'REPORT', action: 'EXPORT', description: 'Xuất báo cáo' },
  // USER
  { resource: 'USER', action: 'CREATE', description: 'Tạo tài khoản người dùng' },
  { resource: 'USER', action: 'READ', description: 'Xem thông tin người dùng' },
  { resource: 'USER', action: 'UPDATE', description: 'Cập nhật thông tin người dùng' },
  { resource: 'USER', action: 'DELETE', description: 'Vô hiệu hóa tài khoản' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Role Definitions — liên kết permissions đã tạo với từng role
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_DEFINITIONS = [
  {
    name: 'EXECUTION_OFFICER' as const,
    dataScope: 'OWN' as const,
    description: 'Chấp hành viên — chỉ thao tác trên hồ sơ được giao',
    permissionKeys: [
      'DOSSIER__READ', 'DOSSIER__UPDATE', 'DOSSIER__CREATE',
      'DOCUMENT__CREATE', 'DOCUMENT__READ', 'DOCUMENT__PRINT',
      'VERDICT__READ', 'VERDICT__CREATE',
    ],
  },
  {
    name: 'JUDGE' as const,
    dataScope: 'ALL' as const,
    description: 'Thẩm phán — xem và phê duyệt bản án',
    permissionKeys: [
      'DOSSIER__READ', 'DOSSIER__APPROVE',
      'VERDICT__READ', 'VERDICT__CREATE', 'VERDICT__UPDATE',
      'DOCUMENT__READ',
    ],
  },
  {
    name: 'ARCHIVIST' as const,
    dataScope: 'ALL' as const,
    description: 'Lưu trữ viên — quản lý tài liệu và hồ sơ lưu kho',
    permissionKeys: [
      'DOSSIER__READ', 'DOSSIER__EXPORT',
      'DOCUMENT__CREATE', 'DOCUMENT__READ', 'DOCUMENT__DELETE',
      'VERDICT__READ',
    ],
  },
  {
    name: 'AGENCY_LEADER' as const,
    dataScope: 'UNIT' as const,
    description: 'Lãnh đạo cơ quan — xem toàn bộ hồ sơ trong đơn vị, xem báo cáo',
    permissionKeys: [
      'DOSSIER__READ', 'DOSSIER__APPROVE', 'DOSSIER__DELETE', 'DOSSIER__EXPORT',
      'DOCUMENT__READ', 'DOCUMENT__PRINT',
      'VERDICT__READ',
      'REPORT__READ', 'REPORT__EXPORT',
      'USER__READ',
    ],
  },
  {
    name: 'ADMIN' as const,
    dataScope: 'ALL' as const,
    description: 'Quản trị hệ thống — toàn quyền',
    permissionKeys: PERMISSION_MATRIX.map((p) => `${p.resource}__${p.action}`),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed function
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Upsert permissions
  const permissionMap: Record<string, mongoose.Types.ObjectId> = {};

  for (const perm of PERMISSION_MATRIX) {
    const doc = await Permission.findOneAndUpdate(
      { resource: perm.resource, action: perm.action },
      { $set: perm },
      { upsert: true, new: true }
    );
    permissionMap[`${perm.resource}__${perm.action}`] = doc._id as mongoose.Types.ObjectId;
    console.log(`  Permission upserted: ${perm.resource}__${perm.action}`);
  }

  // Upsert roles
  for (const roleDef of ROLE_DEFINITIONS) {
    const permissionIds = roleDef.permissionKeys.map((key) => {
      const id = permissionMap[key];
      if (!id) throw new Error(`Permission key "${key}" not found in matrix`);
      return id;
    });

    await Role.findOneAndUpdate(
      { name: roleDef.name },
      {
        $set: {
          name: roleDef.name,
          dataScope: roleDef.dataScope,
          description: roleDef.description,
          permissions: permissionIds,
        },
      },
      { upsert: true, new: true }
    );
    console.log(`  Role upserted: ${roleDef.name} (scope: ${roleDef.dataScope})`);
  }

  console.log('\n✅ RBAC seed completed successfully.');
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  // Đảm bảo connection luôn được đóng kể cả khi lỗi
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
