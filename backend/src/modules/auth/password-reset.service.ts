import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma.js';

interface ResetEntry {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
}

// In-memory store. Sufficient for a single-process demo / licență; in
// production this should live in Redis or a DB table so it survives restarts.
const store = new Map<string, ResetEntry>();
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/**
 * Generates a fresh reset token for the given email if a user exists. Returns
 * { ok: true, token } in development (so the frontend can show it). In a real
 * deployment this would email the link and return only `{ ok: true }`.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't leak which emails exist — return ok regardless.
    return { ok: true, token: null as string | null };
  }
  const token = crypto.randomBytes(24).toString('hex'); // 48 chars
  const tokenHash = sha256(token);
  store.set(tokenHash, {
    userId: user.id,
    email: user.email,
    tokenHash,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    used: false,
  });
  // Surface token in server logs so the developer can copy it in lieu of
  // wiring SMTP. The frontend also receives it in non-production.
  console.log(`[password-reset] token for ${email}: ${token}`);
  const exposeToken = process.env.NODE_ENV !== 'production';
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
  const entry = store.get(tokenHash);
  if (!entry || entry.used || entry.expiresAt < Date.now()) {
    throw new Error('Token-ul este invalid sau a expirat.');
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: entry.userId },
    data: { password: hashed },
  });
  entry.used = true;
  // Free the entry now that it's been used
  store.delete(tokenHash);
  return { ok: true };
}
