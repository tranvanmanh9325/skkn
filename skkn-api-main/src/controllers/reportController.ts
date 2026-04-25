import { Request, Response } from "express";
import { Report } from "../models/Report";

// ── GET /api/reports ──────────────────────────────────────────────────────────
export const getReports = async (_req: Request, res: Response) => {
  try {
    const reports = await Report.find().sort({ ngayXuat: -1 });
    res.json({ data: reports });
  } catch (err: any) {
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};
