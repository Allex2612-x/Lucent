import { Router } from 'express';
import { ReportController } from './report.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/export/pdf', ReportController.exportPDF);
router.get('/export/excel', ReportController.exportExcel);

export default router;
