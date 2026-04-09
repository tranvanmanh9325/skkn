import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { getUsers, createUser } from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, authorizeRoles('ADMIN'), getUsers);
router.post('/', authenticate, authorizeRoles('ADMIN'), createUser);

export default router;
