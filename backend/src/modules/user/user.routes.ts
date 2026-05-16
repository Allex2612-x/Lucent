import { Router } from 'express';
import { UserController } from './user.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/me', UserController.getMe);
router.patch('/me', UserController.updateMe);
router.patch('/me/password', UserController.updatePassword);
router.delete('/me', UserController.deleteMe);

export default router;
