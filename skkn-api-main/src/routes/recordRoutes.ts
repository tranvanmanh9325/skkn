import { Router } from "express";
import {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} from "../controllers/recordController";

const router = Router();

// express.json() (mounted globally in server.ts) handles body parsing.
// Files are no longer uploaded here — they go through POST /api/upload instead.

// GET /api/records
router.get("/", getRecords);

// GET /api/records/:id — chi tiết 1 record kèm attachments
router.get("/:id", getRecordById);

// POST /api/records
router.post("/", createRecord);

// PUT /api/records/:id
router.put("/:id", updateRecord);

// DELETE /api/records/:id
router.delete("/:id", deleteRecord);

export default router;
