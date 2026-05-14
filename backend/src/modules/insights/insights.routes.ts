import { Router } from 'express';
import { InsightsController } from './insights.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);
router.get('/weekly', InsightsController.weekly);
router.get('/tip', InsightsController.tip);
router.get('/recommendations', InsightsController.recommendations);
router.post('/ask', InsightsController.ask);

export default router;
