import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error';

/**
 * Validation Middleware Factory
 * Creates middleware that validates request body against a Zod schema
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(
          400,
          'Validation failed',
          'VALIDATION_ERROR',
          error.errors
        ));
      } else {
        next(error);
      }
    }
  };
}
