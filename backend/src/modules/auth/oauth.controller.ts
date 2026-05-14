import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { loginOrSignupFromOAuth, OAuthProfile } from './oauth.service.js';

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000';

let googleConfigured = false;
let facebookConfigured = false;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_PUBLIC_URL}/api/auth/google/callback`,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email returned from Google'));
        const result: OAuthProfile = {
          provider: 'google',
          email,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
        };
        done(null, result as any);
      },
    ),
  );
  googleConfigured = true;
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${BACKEND_PUBLIC_URL}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name'],
      },
      (_accessToken, _refreshToken, profile, done) => {
        const email = (profile.emails as any)?.[0]?.value;
        if (!email) return done(new Error('No email returned from Facebook'));
        const result: OAuthProfile = {
          provider: 'facebook',
          email,
          firstName: (profile.name as any)?.givenName || '',
          lastName: (profile.name as any)?.familyName || '',
        };
        done(null, result as any);
      },
    ),
  );
  facebookConfigured = true;
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export class OAuthController {
  static providersStatus(_req: Request, res: Response) {
    res.json({
      success: true,
      data: { google: googleConfigured, facebook: facebookConfigured },
    });
  }

  static googleStart(req: Request, res: Response, next: NextFunction) {
    if (!googleConfigured) {
      return res
        .status(503)
        .json({ success: false, message: 'Google OAuth nu este configurat pe backend.' });
    }
    return passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })(req, res, next);
  }

  static googleCallback(req: Request, res: Response, next: NextFunction) {
    if (!googleConfigured) {
      return res
        .status(503)
        .json({ success: false, message: 'Google OAuth nu este configurat pe backend.' });
    }
    passport.authenticate(
      'google',
      { session: false },
      async (err: any, profile: OAuthProfile | false) => {
        if (err || !profile) {
          return res.redirect(`${FRONTEND_ORIGIN}/login?oauth_error=${encodeURIComponent(err?.message || 'failed')}`);
        }
        try {
          const { accessToken, refreshToken } = await loginOrSignupFromOAuth(profile);
          setRefreshCookie(res, refreshToken);
          return res.redirect(`${FRONTEND_ORIGIN}/login?oauth_token=${encodeURIComponent(accessToken)}`);
        } catch (e: any) {
          return res.redirect(`${FRONTEND_ORIGIN}/login?oauth_error=${encodeURIComponent(e?.message || 'failed')}`);
        }
      },
    )(req, res, next);
  }

  static facebookStart(req: Request, res: Response, next: NextFunction) {
    if (!facebookConfigured) {
      return res
        .status(503)
        .json({ success: false, message: 'Facebook OAuth nu este configurat pe backend.' });
    }
    return passport.authenticate('facebook', { scope: ['email'], session: false })(req, res, next);
  }

  static facebookCallback(req: Request, res: Response, next: NextFunction) {
    if (!facebookConfigured) {
      return res
        .status(503)
        .json({ success: false, message: 'Facebook OAuth nu este configurat pe backend.' });
    }
    passport.authenticate(
      'facebook',
      { session: false },
      async (err: any, profile: OAuthProfile | false) => {
        if (err || !profile) {
          return res.redirect(`${FRONTEND_ORIGIN}/login?oauth_error=${encodeURIComponent(err?.message || 'failed')}`);
        }
        try {
          const { accessToken, refreshToken } = await loginOrSignupFromOAuth(profile);
          setRefreshCookie(res, refreshToken);
          return res.redirect(`${FRONTEND_ORIGIN}/login?oauth_token=${encodeURIComponent(accessToken)}`);
        } catch (e: any) {
          return res.redirect(`${FRONTEND_ORIGIN}/login?oauth_error=${encodeURIComponent(e?.message || 'failed')}`);
        }
      },
    )(req, res, next);
  }
}
