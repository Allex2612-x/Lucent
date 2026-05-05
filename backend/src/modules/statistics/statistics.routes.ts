import { Router } from 'express';
import { StatisticsController } from './statistics.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', StatisticsController.getOverview);
router.get('/by-category', StatisticsController.getByCategory);
router.get('/monthly-trend', StatisticsController.getMonthlyTrend);

export default router;
