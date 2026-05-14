import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import {
  getWeeklyInsight,
  getQuickTip,
  askQuestion,
  getRecommendations,
} from './insights.service.js';

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

  static async ask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const question = (req.body?.question ?? '').toString();
      const answer = await askQuestion(req.user!.userId, question);
      res.json({ success: true, data: answer });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error?.message || 'Eroare la întrebare.' });
    }
  }

  static async recommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recs = await getRecommendations(req.user!.userId);
      res.json({ success: true, data: recs });
    } catch (error) {
      next(error);
    }
  }
}
