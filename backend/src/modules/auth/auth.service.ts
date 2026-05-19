import { prisma } from '../../shared/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError, UnauthorizedError, BadRequestError } from '../../shared/errors.js';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestError('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // Create default categories for the new user
    const { DEFAULT_CATEGORIES } = await import('../../shared/default-categories.js');
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(cat => ({
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
        userId: user.id,
      }))
    });

    const accessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { user, accessToken, refreshToken };
  }

  static async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Trade-off: this distinguishes "no account" from "wrong password",
      // which allows account enumeration. We accept it for a personal-finance
      // app where the UX win (telling the user whether to register vs reset)
      // outweighs the small privacy cost.
      const err = new UnauthorizedError(
        'Nu există un cont cu acest email. Creează unul nou sau verifică datele de logare.',
      );
      (err as any).code = 'EMAIL_NOT_FOUND';
      throw err;
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      const err = new UnauthorizedError(
        'Parolă greșită. Verifică datele de logare sau resetează parola.',
      );
      (err as any).code = 'INVALID_PASSWORD';
      throw err;
    }

    const accessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { user, accessToken, refreshToken };
  }

  static async refreshTokens(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const newAccessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }
}
