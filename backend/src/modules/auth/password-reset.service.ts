import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma.js';
import {
  sendEmail,
  passwordResetEmailHtml,
  passwordResetEmailText,
} from '../../shared/email.js';

// Reset tokens are persisted in the DB (PasswordResetToken) so they survive
// process restarts/redeploys and work across multiple instances behind a load
// balancer. We store only the SHA-256 hash, never the raw token.
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/**
 * Generates a fresh reset token for the given email if a user exists and
 * sends a branded email containing the reset link. The frontend doesn't
 * need to know the token — we always return `{ ok: true }` so attackers
 * can't enumerate which emails are registered.
 *
 * Dev fallback: if RESEND_API_KEY isn't configured (typical local dev),
 * the wrapper logs the token + URL to the console AND we expose it to the
 * frontend so /forgot-password keeps working without SMTP.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't leak which emails exist — return ok regardless.
    return { ok: true, token: null as string | null };
  }
  const token = crypto.randomBytes(24).toString('hex'); // 48 chars
  const tokenHash = sha256(token);

  // Invalidate any prior unused tokens for this user, sweep expired/used rows,
  // then persist the fresh one.
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { userId: user.id, usedAt: null },
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  // Build the reset link from the frontend origin (so emails point to
  // the deployed app, not localhost).
  const frontendBase =
    process.env.FRONTEND_ORIGIN ||
    process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
    'http://localhost:5173';
  const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  console.log(`[password-reset] token for ${email}: ${token}`);
  console.log(`[password-reset] reset URL: ${resetUrl}`);

  // Fire the email via Resend (fails gracefully if RESEND_API_KEY missing).
  const emailResult = await sendEmail({
    to: user.email,
    subject: 'Resetare parolă FARO',
    html: passwordResetEmailHtml(resetUrl, user.firstName),
    text: passwordResetEmailText(resetUrl, user.firstName),
  });

  // Expose the token to the frontend only when SMTP is not configured
  // OR in non-production. This lets the "Forgot password" page show a
  // direct link during local dev. In production with Resend wired up,
  // the token is delivered only via email.
  const isProd = process.env.NODE_ENV === 'production';
  const exposeToken = !isProd || !emailResult.ok;
  return { ok: true, token: exposeToken ? token : null };
}

export async function consumePasswordReset(token: string, newPassword: string) {
  if (!token || token.length < 16) {
    throw new Error('Token invalid.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Parola nouă trebuie să aibă cel puțin 6 caractere.');
  }
  const tokenHash = sha256(token);
  const entry = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!entry || entry.usedAt || entry.expiresAt < new Date()) {
    throw new Error('Token-ul este invalid sau a expirat.');
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  // Atomically: set the new password, bump tokenVersion (revokes every
  // outstanding refresh token for this user — critical when the reset is
  // because the password was compromised), and mark the token used.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: entry.userId },
      data: { password: hashed, tokenVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
  ]);
  return { ok: true };
}
