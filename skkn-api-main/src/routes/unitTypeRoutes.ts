import { Router } from "express";
import {
  getUnitTypes,
  createUnitType,
  updateUnitType,
  deleteUnitType,
} from "../controllers/unitTypeController";

const router = Router();

router.get("/", getUnitTypes);
router.post("/", createUnitType);
router.put("/:id", updateUnitType);
router.delete("/:id", deleteUnitType);

export default router;
