import { Router, Request, Response } from "express";
import { Unit } from "../models/MasterData";

const router = Router();

/** GET /api/units — returns all Units (Nơi THA) projected to { _id, name } */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const units = await Unit.find({}, { name: 1 }).sort({ name: 1 }).lean();
    res.json(units);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Lỗi máy chủ", error: message });
  }
});

export default router;
