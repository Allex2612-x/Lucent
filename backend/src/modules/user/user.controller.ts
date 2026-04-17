import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { UserService, updateProfileSchema, updatePasswordSchema } from './user.service.js';

export class UserController {
  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await UserService.getProfile(userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await UserService.updateProfile(userId, validatedData);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validatedData = updatePasswordSchema.parse(req.body);
      await UserService.updatePassword(userId, validatedData);
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
