import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { getUsers } from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, authorizeRoles('ADMIN'), getUsers);

export default router;
