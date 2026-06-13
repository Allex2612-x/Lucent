import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
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

  // Map known Prisma errors to friendly 4xx responses so raw DB errors
  // (and stack traces) never leak through the generic 500 branch — e.g. a
  // foreign-key violation when deleting a record still referenced elsewhere.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003' || err.code === 'P2014') {
      return res.status(409).json({ success: false, message: 'Resursa este folosită de alte înregistrări și nu poate fi ștearsă.' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Există deja o înregistrare cu aceste valori.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Resursa nu a fost găsită.' });
    }
    return res.status(400).json({ success: false, message: 'Cerere invalidă.' });
  }

  console.error('Unhandled Expection:', err);

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
