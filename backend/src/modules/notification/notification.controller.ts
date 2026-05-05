import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { NotificationService } from './notification.service.js';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await NotificationService.getNotifications(req.user!.userId);
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.getUnreadCount(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await NotificationService.markAsRead(
        req.user!.userId,
        req.params.id as string
      );
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.markAllAsRead(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
