import { Router, Request, Response } from "express";
import { Team } from "../models/MasterData";

const router = Router();

/** GET /api/teams — returns all Teams (Đội THA) projected to { _id, name } */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const teams = await Team.find({}, { name: 1 }).sort({ name: 1 }).lean();
    res.json(teams);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Lỗi máy chủ", error: message });
  }
});

export default router;
