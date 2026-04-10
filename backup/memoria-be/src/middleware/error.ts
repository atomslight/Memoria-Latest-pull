import { Request, Response, NextFunction } from 'express';

/**
 * Custom Application Error
 * Extends Error with HTTP status code and error code
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        details: err.details || {}
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  }

  // Handle unknown errors
  console.error('Unhandled error:', err);
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      details: {}
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
}
