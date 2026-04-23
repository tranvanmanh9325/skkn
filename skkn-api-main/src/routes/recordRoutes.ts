import { Router } from "express";
import { getRecords, createRecord, updateRecord, deleteRecord } from "../controllers/recordController";

const router = Router();

// GET /api/records
router.get("/", getRecords);

// POST /api/records
router.post("/", createRecord);

// PUT /api/records/:id
router.put("/:id", updateRecord);

// DELETE /api/records/:id
router.delete("/:id", deleteRecord);

export default router;
