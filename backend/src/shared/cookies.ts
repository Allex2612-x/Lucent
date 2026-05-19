import type { Response, CookieOptions } from 'express';
import { isProduction } from '../config/env.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Centralized refresh-token cookie config. Used by login, register,
 * refresh, OAuth callbacks — anywhere the server issues a new refresh
 * token.
 *
 * In production the frontend and API live on different domains
 * (Railway gives each service its own *.up.railway.app subdomain), so
 * we need `SameSite=None` for the browser to send the cookie at all.
 * That requires `Secure: true`, which Railway provides automatically
 * via its edge TLS termination — `app.set('trust proxy', 1)` lets
 * Express trust the X-Forwarded-Proto header.
 *
 * In development we stay on `SameSite=Lax` over plain HTTP so the
 * cookie still works without HTTPS.
 */
export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response) {
  // Cookie clear must use matching attributes — otherwise the browser
  // treats the clearCookie as a different cookie.
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
}
