import { Router } from "express";
import {
  getRecordTypes,
  createRecordType,
  updateRecordType,
  deleteRecordType,
} from "../controllers/recordTypeController";

const router = Router();

router.get("/", getRecordTypes);
router.post("/", createRecordType);
router.put("/:id", updateRecordType);
router.delete("/:id", deleteRecordType);

export default router;
