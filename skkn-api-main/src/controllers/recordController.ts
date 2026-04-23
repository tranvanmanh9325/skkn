import { RequestHandler } from "express";
import mongoose, { FilterQuery } from "mongoose";
// Aliased to RecordModel to avoid collision with the built-in Record<K,V> utility type
import { Record as RecordModel, IRecord } from "../models/Core";

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
    const records = await RecordModel.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({ data: records });
  } catch (err) {
    console.error("[RecordController] getRecords error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/records
 * Only the fields defined in IRecord (Core.ts) are written.
 * Tab 2 subject data must be persisted separately via /api/subjects.
 * Returns 409 on duplicate soHoSo.
 */
export const createRecord: RequestHandler = async (req, res) => {
  try {
    const {
      soHoSo,
      loaiHoSo,
      noiTHA,
      loaiNoiTHA,
      doiTHA,
      nguoiCHA,
      ghiChu,
      currentAssignee,
      currentOrgUnit,
      attachments,
    } = req.body;

    const record = await RecordModel.create({
      soHoSo,
      loaiHoSo,
      noiTHA,
      loaiNoiTHA,
      doiTHA,
      // Optional refs — omit if falsy to avoid casting an empty string to ObjectId
      ...(nguoiCHA && { nguoiCHA }),
      ...(ghiChu && { ghiChu }),
      ...(currentAssignee && { currentAssignee }),
      ...(currentOrgUnit && { currentOrgUnit }),
      attachments: Array.isArray(attachments) ? attachments : [],
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
 * Partially updates an existing record.
 */
export const updateRecord: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Whitelist updatable fields to prevent mass-assignment of schema internals
    const {
      soHoSo,
      loaiHoSo,
      noiTHA,
      loaiNoiTHA,
      doiTHA,
      nguoiCHA,
      ghiChu,
      currentAssignee,
      currentOrgUnit,
      attachments,
    } = req.body;

    const updated = await RecordModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(soHoSo !== undefined && { soHoSo }),
          ...(loaiHoSo !== undefined && { loaiHoSo }),
          ...(noiTHA !== undefined && { noiTHA }),
          ...(loaiNoiTHA !== undefined && { loaiNoiTHA }),
          ...(doiTHA !== undefined && { doiTHA }),
          ...(nguoiCHA !== undefined && { nguoiCHA }),
          ...(ghiChu !== undefined && { ghiChu }),
          ...(currentAssignee !== undefined && { currentAssignee }),
          ...(currentOrgUnit !== undefined && { currentOrgUnit }),
          ...(attachments !== undefined && { attachments }),
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
