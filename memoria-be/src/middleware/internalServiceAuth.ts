import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Validates `Authorization: Bearer <AI_INTERNAL_SECRET>` for service-to-service calls
 * (e.g. Memoria AI service → API).
 */
export function internalServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = env.AI_INTERNAL_SECRET;
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${expected}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
