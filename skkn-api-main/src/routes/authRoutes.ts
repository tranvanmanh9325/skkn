import { Router } from "express";
import { login, forgotPassword } from "../controllers/authController";

const router = Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

export default router;
