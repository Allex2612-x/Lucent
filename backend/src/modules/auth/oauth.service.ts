import { prisma } from '../../shared/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';

export interface OAuthProfile {
  provider: 'google' | 'facebook';
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Find-or-create a user from a verified OAuth profile and issue our regular
 * JWT pair so the rest of the app doesn't need to know it came from OAuth.
 *
 * Idempotent: if an account with the same email exists (whether created via
 * email/password or a prior OAuth login), we reuse it.
 */
export async function loginOrSignupFromOAuth(profile: OAuthProfile) {
  let user = await prisma.user.findUnique({ where: { email: profile.email } });

  if (!user) {
    // Generate an unguessable random password so the row satisfies the schema
    // but the user can never log in via email/password without resetting it.
    const placeholder = await bcrypt.hash(
      `${profile.provider}-${profile.email}-${Date.now()}-${Math.random()}`,
      10,
    );

    user = await prisma.user.create({
      data: {
        email: profile.email,
        password: placeholder,
        firstName: profile.firstName || profile.email.split('@')[0]!,
        lastName: profile.lastName || '',
      },
    });

    // Seed default categories the same way regular signup does
    const { DEFAULT_CATEGORIES } = await import('../../shared/default-categories.js');
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
        userId: user!.id,
      })),
    });
  }

  const accessToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id, tokenVersion: user.tokenVersion }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { user, accessToken, refreshToken };
}
