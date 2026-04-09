import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', login);

export default router;
