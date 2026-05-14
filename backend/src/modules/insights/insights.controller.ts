import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { getWeeklyInsight, getQuickTip } from './insights.service.js';

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

  static async tip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const force = req.query.refresh === 'true';
      const tip = await getQuickTip(req.user!.userId, force);
      res.json({ success: true, data: tip });
    } catch (error) {
      next(error);
    }
  }
}
