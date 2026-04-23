import { Request, Response } from "express";
import { RecordType } from "../models/MasterData";

// ── GET /api/record-types ─────────────────────────────────────────────────────
export const getRecordTypes = async (_req: Request, res: Response) => {
  try {
    const types = await RecordType.find().sort({ createdAt: -1 });
    res.json(types);
  } catch (err: any) {
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};

// ── POST /api/record-types ────────────────────────────────────────────────────
export const createRecordType = async (req: Request, res: Response) => {
  try {
    const { name, code, note } = req.body;
    const recordType = await RecordType.create({ name, code, note });
    res.status(201).json(recordType);
  } catch (err: any) {
    // Duplicate key (code) surfaces as code 11000
    if (err.code === 11000) {
      return res.status(409).json({ message: "Mã loại hồ sơ đã tồn tại." });
    }
    res.status(400).json({ message: err.message });
  }
};

// ── PUT /api/record-types/:id ─────────────────────────────────────────────────
export const updateRecordType = async (req: Request, res: Response) => {
  try {
    const { name, code, note } = req.body;
    const updated = await RecordType.findByIdAndUpdate(
      req.params.id,
      { name, code, note },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy loại hồ sơ." });
    }
    res.json(updated);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Mã loại hồ sơ đã tồn tại." });
    }
    res.status(400).json({ message: err.message });
  }
};

// ── DELETE /api/record-types/:id ──────────────────────────────────────────────
export const deleteRecordType = async (req: Request, res: Response) => {
  try {
    const deleted = await RecordType.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy loại hồ sơ." });
    }
    res.json({ message: "Xóa thành công." });
  } catch (err: any) {
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};
