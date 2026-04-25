import { RequestHandler } from "express";
import mongoose, { FilterQuery } from "mongoose";
// Aliased to RecordModel to avoid collision with the built-in Record<K,V> utility type
import { Record as RecordModel, IRecord, IAttachment } from "../models/Core";

// ── Query builder ─────────────────────────────────────────────────────────────

/**
 * Builds a Mongo filter from query params.
 * Only `soHoSo` supports regex search — ObjectId ref fields (noiTHA, doiTHA)
 * require an exact ObjectId match and are only filtered when supplied.
 */
function buildQuery(params: {
  search?: string;
  noiTHA?: string;
  doiTHA?: string;
  loaiHoSo?: string;
}): FilterQuery<IRecord> {
  const query: FilterQuery<IRecord> = {};

  if (params.search?.trim()) {
    // soHoSo is the only free-text field — the others are ObjectId refs
    query.soHoSo = { $regex: params.search.trim(), $options: "i" };
  }

  // Exact ObjectId filters — skip if the value is not a valid ObjectId to
  // prevent a Mongoose CastError from crashing the request
  if (params.noiTHA?.trim() && mongoose.isValidObjectId(params.noiTHA.trim())) {
    query.noiTHA = new mongoose.Types.ObjectId(params.noiTHA.trim());
  }
  if (params.doiTHA?.trim() && mongoose.isValidObjectId(params.doiTHA.trim())) {
    query.doiTHA = new mongoose.Types.ObjectId(params.doiTHA.trim());
  }
  if (params.loaiHoSo?.trim() && mongoose.isValidObjectId(params.loaiHoSo.trim())) {
    query.loaiHoSo = new mongoose.Types.ObjectId(params.loaiHoSo.trim());
  }

  return query;
}

/**
 * Fields that hold ObjectId references. FormData serialises unselected
 * dropdowns as the literal strings "", "null", or "undefined" — all of which
 * cause a Mongoose CastError. We delete such fields before touching Mongoose.
 */
const OBJECT_ID_FIELDS = [
  "loaiHoSo",
  "noiTHA",
  "loaiNoiTHA",
  "doiTHA",
  "nguoiCHA",
  "currentAssignee",
  "currentOrgUnit",
] as const;

const SENTINEL_VALUES = new Set(["", "null", "undefined"]);

/**
 * Removes ObjectId fields whose value is a FormData sentinel so Mongoose never
 * attempts to cast them. Mutates and returns the same object for convenience.
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  for (const field of OBJECT_ID_FIELDS) {
    if (SENTINEL_VALUES.has(body[field] as string)) {
      delete body[field];
    }
  }
  return body;
}

/**
 * Parses the `attachments` field from the request body.
 * The frontend sends it as a JSON string (array of AttachmentItem objects from
 * Cloudinary). Falls back to an empty array on any parse failure.
 */
function parseAttachments(raw: unknown): IAttachment[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as IAttachment[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as IAttachment[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/records
 * Accepts: search, noiTHA, doiTHA, loaiHoSo (all optional query params).
 */
export const getRecords: RequestHandler = async (req, res) => {
  try {
    // Destructure as plain object to avoid name clash with the Record model
    const { search, noiTHA, doiTHA, loaiHoSo } = req.query as {
      search?: string;
      noiTHA?: string;
      doiTHA?: string;
      loaiHoSo?: string;
    };

    const filter = buildQuery({ search, noiTHA, doiTHA, loaiHoSo });
    const records = await RecordModel.find(filter)
      .populate("nguoiCHA")
      .populate("noiTHA", "name")
      .populate("doiTHA", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ data: records });
  } catch (err) {
    console.error("[RecordController] getRecords error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/records/:id
 * Trả về chi tiết 1 record kèm đầy đủ attachments và populate nguoiCHA.
 */
export const getRecordById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ message: "ID không hợp lệ." });
      return;
    }

    const record = await RecordModel.findById(id)
      .populate("nguoiCHA")
      .populate("noiTHA", "name")
      .populate("doiTHA", "name")
      .lean();

    if (!record) {
      res.status(404).json({ message: "Hồ sơ không tồn tại." });
      return;
    }

    res.status(200).json({ data: record });
  } catch (err) {
    console.error("[RecordController] getRecordById error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/records
 * Only the fields defined in IRecord (Core.ts) are written.
 * Tab 2 subject data must be persisted separately via /api/subjects.
 * Returns 409 on duplicate soHoSo.
 *
 * The `attachments` field is expected as a JSON string produced by the
 * frontend after uploading files to Cloudinary via POST /api/upload.
 */
export const createRecord: RequestHandler = async (req, res) => {
  try {
    const body = sanitizeBody({ ...req.body });

    // Dùng unknown cast để attachments có thể là array (JSON) hoặc string (multipart cũ)
    const b = body as Record<string, unknown>;
    const soHoSo        = b.soHoSo        as string | undefined;
    const loaiHoSo      = b.loaiHoSo      as string | undefined;
    const noiTHA        = b.noiTHA        as string | undefined;
    const loaiNoiTHA    = b.loaiNoiTHA    as string | undefined;
    const doiTHA        = b.doiTHA        as string | undefined;
    const nguoiCHA      = b.nguoiCHA      as string | undefined;
    const ghiChu        = b.ghiChu        as string | undefined;
    const currentAssignee = b.currentAssignee as string | undefined;
    const currentOrgUnit  = b.currentOrgUnit  as string | undefined;
    const rawAttachments  = b.attachments;

    const attachments = parseAttachments(rawAttachments);

    const record = await RecordModel.create({
      soHoSo,
      loaiHoSo,
      noiTHA,
      loaiNoiTHA,
      doiTHA,
      ...(nguoiCHA      && { nguoiCHA }),
      ...(ghiChu        && { ghiChu }),
      ...(currentAssignee && { currentAssignee }),
      ...(currentOrgUnit  && { currentOrgUnit }),
      attachments,
    });

    res.status(201).json({ data: record });
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      res.status(409).json({ message: "Số hồ sơ đã tồn tại. Vui lòng nhập số khác." });
      return;
    }
    console.error("[RecordController] createRecord error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PUT /api/records/:id
 * Accepts `attachments` as a JSON string representing the FULL desired array
 * (existing + newly uploaded). This replaces the previous append-only behaviour,
 * which means the client can also delete attachments by omitting them.
 */
export const updateRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Strip ObjectId-ref fields that FormData serialised as sentinel strings
    const body = sanitizeBody({ ...req.body });

    // Cast to unknown first — attachments có thể là array (JSON) hoặc string (multipart)
    const b = body as Record<string, unknown>;
    const soHoSo          = b.soHoSo          as string | undefined;
    const loaiHoSo        = b.loaiHoSo        as string | undefined;
    const noiTHA          = b.noiTHA          as string | undefined;
    const loaiNoiTHA      = b.loaiNoiTHA      as string | undefined;
    const doiTHA          = b.doiTHA          as string | undefined;
    const nguoiCHA        = b.nguoiCHA        as string | undefined;
    const ghiChu          = b.ghiChu          as string | undefined;
    const currentAssignee = b.currentAssignee as string | undefined;
    const currentOrgUnit  = b.currentOrgUnit  as string | undefined;
    const rawAttachments  = b.attachments;

    const attachments = parseAttachments(rawAttachments);
    console.log("[DEBUG updateRecord] rawAttachments:", rawAttachments);
    console.log("[DEBUG updateRecord] parsed attachments:", attachments);

    const updated = await RecordModel.findByIdAndUpdate(
      id,
      {
        $set: {
          // Only include fields that survived sanitization (i.e. have real values)
          ...(soHoSo !== undefined && { soHoSo }),
          ...(loaiHoSo !== undefined && { loaiHoSo }),
          ...(noiTHA !== undefined && { noiTHA }),
          ...(loaiNoiTHA !== undefined && { loaiNoiTHA }),
          ...(doiTHA !== undefined && { doiTHA }),
          ...(nguoiCHA !== undefined && { nguoiCHA }),
          ...(ghiChu !== undefined && { ghiChu }),
          ...(currentAssignee !== undefined && { currentAssignee }),
          ...(currentOrgUnit !== undefined && { currentOrgUnit }),
          // Always replace the full array — rawAttachments being undefined means
          // the client didn't touch attachments at all, so skip the $set for it
          ...(rawAttachments !== undefined && { attachments }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ message: "Hồ sơ không tồn tại." });
      return;
    }

    res.status(200).json({ data: updated });
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      res.status(409).json({ message: "Số hồ sơ đã tồn tại. Vui lòng nhập số khác." });
      return;
    }
    console.error("[RecordController] updateRecord error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /api/records/:id
 * Hard-deletes a record. Returns 404 when the ID is not found.
 */
export const deleteRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RecordModel.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ message: "Hồ sơ không tồn tại." });
      return;
    }

    res.status(200).json({ message: "Hồ sơ đã được xoá." });
  } catch (err) {
    console.error("[RecordController] deleteRecord error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
