import { Request, Response } from 'express';

/**
 * Lightweight liveness check for the AI inference process.
 */
export const healthCheck = (_req: Request, res: Response): void => {
  console.log('Health check endpoint called');
  res.json({
    status: 'ok',
    service: 'memoria-ai',
    timestamp: new Date().toISOString(),
  });
};
