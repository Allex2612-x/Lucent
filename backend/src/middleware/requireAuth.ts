import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../shared/errors.js';

// Augment Express.User so `req.user` (declared by passport's typings) carries
// our app-specific shape. Without this, AuthRequest's local override clashes
// with passport's global declaration once passport types are loaded.
declare global {
  namespace Express {
    interface User {
      userId: string;
    }
  }
}

export interface AuthRequest extends Request {
  user?: Express.User;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.user = { userId: payload.userId };
    next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid token'));
  }
};
