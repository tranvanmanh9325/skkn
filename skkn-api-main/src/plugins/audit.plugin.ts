import { AsyncLocalStorage } from 'async_hooks';
import { Schema, Types, Document, Query } from 'mongoose';
import { AuditLog, AuditAction, AuditResource } from '../models/AuditLog.model';

// ─────────────────────────────────────────────────────────────────────────────
// Audit Context Store
//
// AsyncLocalStorage truyền context (userId, ip) xuyên suốt call stack
// mà không cần pass qua params. Đây là pattern chuẩn cho cross-cutting concerns.
// Mỗi HTTP request sẽ có một "store" riêng biệt — hoàn toàn thread-safe.
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditContextStore {
  userId: Types.ObjectId | string;
  ipAddress?: string;
  userAgent?: string;
}

export const auditContext = new AsyncLocalStorage<AuditContextStore>();

// ─────────────────────────────────────────────────────────────────────────────
// Audit Plugin Factory
//
// Nhận modelName để biết resource nào đang được audit.
// Sử dụng dạng factory function thay vì generic plugin
// để type-safe và không hardcode tên model bên trong plugin.
// ─────────────────────────────────────────────────────────────────────────────

export function createAuditPlugin(resource: AuditResource) {
  return function auditPlugin(schema: Schema) {
    // ── TRACK UPDATE ─────────────────────────────────────────────────────────
    // Dùng pre hook để lấy document gốc (before) trước khi update
    schema.pre('findOneAndUpdate', async function (this: Query<any, any>) {
      // Lưu snapshot trước khi update vào options để post hook lấy được
      const doc = await this.model.findOne(this.getQuery()).lean();
      this.setOptions({ ...this.getOptions(), _originalDoc: doc });
    });

    schema.post('findOneAndUpdate', async function (this: Query<any, any>, updatedDoc: Document | null) {
      if (!updatedDoc) return;

      const ctx = auditContext.getStore();
      const originalDoc = (this.getOptions() as any)._originalDoc;

      await AuditLog.create({
        action: 'UPDATE' as AuditAction,
        resource,
        resourceId: updatedDoc._id,
        performedBy: ctx?.userId,
        before: originalDoc,
        after: (updatedDoc as any).toObject?.() ?? updatedDoc,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      });
    });

    // ── TRACK DELETE ─────────────────────────────────────────────────────────
    schema.post('findOneAndDelete', async function (this: Query<any, any>, deletedDoc: Document | null) {
      if (!deletedDoc) return;

      const ctx = auditContext.getStore();

      await AuditLog.create({
        action: 'DELETE' as AuditAction,
        resource,
        resourceId: deletedDoc._id,
        performedBy: ctx?.userId,
        before: (deletedDoc as any).toObject?.() ?? deletedDoc,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      });
    });

    // ── TRACK CREATE ─────────────────────────────────────────────────────────
    schema.post('save', async function (doc: Document) {
      const ctx = auditContext.getStore();

      await AuditLog.create({
        action: 'CREATE' as AuditAction,
        resource,
        resourceId: doc._id,
        performedBy: ctx?.userId,
        after: (doc as any).toObject?.() ?? doc,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      });
    });
  };
}
