import { Router, Request, Response } from "express";
import { Subject } from "../models/Core";

const router = Router();

/** GET /api/subjects — returns all personal fields needed by the Tab 2 auto-fill in the record modal. */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const subjects = await Subject
      .find({}, { hoTen: 1, ngaySinh: 1, gioiTinh: 1, cccd: 1, queQuan: 1, thuongTru: 1 })
      .sort({ hoTen: 1 })
      .lean();
    res.json(subjects);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Lỗi máy chủ", error: message });
  }
});

export default router;
