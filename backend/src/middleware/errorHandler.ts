import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors.js';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    const payload: any = { success: false, message: err.message };
    if ((err as any).code) payload.code = (err as any).code;
    return res.status(err.statusCode).json(payload);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues,
    });
  }

  console.error('Unhandled Expection:', err);

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
