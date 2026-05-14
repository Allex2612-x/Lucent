import { Router } from 'express';
import { InsightsController } from './insights.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);
router.get('/weekly', InsightsController.weekly);

export default router;
