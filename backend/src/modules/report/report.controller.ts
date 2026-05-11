import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { ReportService, exportParamsSchema } from './report.service.js';

export class ReportController {
  static async exportPDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedParams = exportParamsSchema.parse(req.query);
      
      console.log('PDF Export - User:', req.user?.userId);
      console.log('PDF Export - Params:', validatedParams);
      
      const buffer = await ReportService.generatePDF(
        req.user!.userId,
        validatedParams.startDate,
        validatedParams.endDate
      );

      // Generate filename with current date
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const filename = `raport-financiar-${year}-${month}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error('PDF Export Error:', error);
      next(error);
    }
  }

  static async exportExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedParams = exportParamsSchema.parse(req.query);
      
      console.log('Excel Export - User:', req.user?.userId);
      console.log('Excel Export - Params:', validatedParams);
      
      const buffer = await ReportService.generateExcel(
        req.user!.userId,
        validatedParams.startDate,
        validatedParams.endDate
      );

      // Generate filename with current date
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const filename = `raport-financiar-${year}-${month}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Excel Export Error:', error);
      next(error);
    }
  }
}
