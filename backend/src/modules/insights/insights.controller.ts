import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { getWeeklyInsight } from './insights.service.js';

export class InsightsController {
  static async weekly(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const force = req.query.refresh === 'true';
      const insight = await getWeeklyInsight(req.user!.userId, force);
      res.json({ success: true, data: insight });
    } catch (error) {
      next(error);
    }
  }
}
