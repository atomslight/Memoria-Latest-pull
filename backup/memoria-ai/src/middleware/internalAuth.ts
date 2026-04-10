import type { Request, Response, NextFunction } from 'express';
import { aiServiceEnv } from '../config/env';

export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = aiServiceEnv.AI_INTERNAL_SECRET;
  const header = req.headers.authorization;

  if (!header || header !== `Bearer ${expected}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
