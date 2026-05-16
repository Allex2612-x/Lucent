import { Request, Response, NextFunction } from 'express';
import { AuthService, registerSchema, loginSchema } from './auth.service.js';
import { AppError } from '../../shared/errors.js';
import { requestPasswordReset, consumePasswordReset } from './password-reset.service.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.register(validatedData);

      // set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.login(validatedData);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        throw new AppError('Refresh token not found', 401);
      }

      const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshTokens(refreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email obligatoriu.' });
      }
      const result = await requestPasswordReset(email);
      // Always 200 — we don't reveal whether the email exists.
      res.json({
        success: true,
        message:
          'Dacă există un cont cu acest email, am trimis un link de resetare. Verifică inbox-ul.',
        token: result.token, // null in production
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.body?.token ?? '').trim();
      const newPassword = String(req.body?.newPassword ?? '');
      await consumePasswordReset(token, newPassword);
      res.json({ success: true, message: 'Parola a fost resetată. Te poți autentifica.' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error?.message || 'Eroare la resetare.' });
    }
  }
}
