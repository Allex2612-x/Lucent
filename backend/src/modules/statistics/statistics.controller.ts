import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import {
  StatisticsService,
  overviewSchema,
  byCategorySchema,
  monthlyTrendSchema,
} from './statistics.service.js';

export class StatisticsController {
  static async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedParams = overviewSchema.parse(req.query);
      const result = await StatisticsService.getOverview(
        req.user!.userId,
        validatedParams
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getByCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedParams = byCategorySchema.parse(req.query);
      const result = await StatisticsService.getByCategory(
        req.user!.userId,
        validatedParams
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlyTrend(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedParams = monthlyTrendSchema.parse(req.query);
      const result = await StatisticsService.getMonthlyTrend(
        req.user!.userId,
        validatedParams
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
