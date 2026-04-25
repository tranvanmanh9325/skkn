import { Router } from "express";
import { getReports } from "../controllers/reportController";

const router = Router();

router.get("/", getReports);

export default router;
