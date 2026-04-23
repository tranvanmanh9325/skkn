import { Request, Response } from "express";
import { UnitType } from "../models/MasterData";

// ── GET /api/unit-types ───────────────────────────────────────────────────────
export const getUnitTypes = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const filter =
      q && typeof q === "string" && q.trim()
        ? { $or: [
            { name: { $regex: q.trim(), $options: "i" } },
            { code: { $regex: q.trim(), $options: "i" } },
          ] }
        : {};

    const types = await UnitType.find(filter).sort({ createdAt: -1 });
    res.json(types);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Lỗi máy chủ", error: message });
  }
};

// ── POST /api/unit-types ──────────────────────────────────────────────────────
export const createUnitType = async (req: Request, res: Response) => {
  try {
    const { name, code, description, note } = req.body;
    const unitType = await UnitType.create({ name, code, description, note });
    res.status(201).json(unitType);
  } catch (err: unknown) {
    const mongoErr = err as { code?: number; message?: string };
    // Duplicate key (unique code) surfaces as MongoDB error code 11000
    if (mongoErr.code === 11000) {
      return res.status(409).json({ message: "Mã loại nơi THA đã tồn tại." });
    }
    res.status(400).json({ message: mongoErr.message });
  }
};

// ── PUT /api/unit-types/:id ───────────────────────────────────────────────────
export const updateUnitType = async (req: Request, res: Response) => {
  try {
    const { name, code, description, note } = req.body;
    const updated = await UnitType.findByIdAndUpdate(
      req.params.id,
      { name, code, description, note },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy loại nơi THA." });
    }
    res.json(updated);
  } catch (err: unknown) {
    const mongoErr = err as { code?: number; message?: string };
    if (mongoErr.code === 11000) {
      return res.status(409).json({ message: "Mã loại nơi THA đã tồn tại." });
    }
    res.status(400).json({ message: mongoErr.message });
  }
};

// ── DELETE /api/unit-types/:id ────────────────────────────────────────────────
export const deleteUnitType = async (req: Request, res: Response) => {
  try {
    const deleted = await UnitType.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy loại nơi THA." });
    }
    res.json({ message: "Xóa thành công." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Lỗi máy chủ", error: message });
  }
};
