import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { verifyAccessToken } from '../services/jwt';

/**
 * Authenticated user attached to req.user by auth middleware
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

// Extend Express Request with user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Auth Middleware
 *
 * Verifies JWT Bearer tokens issued by POST /api/v1/auth/login and register.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided',
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization format',
      });
      return;
    }

    const token = authHeader.slice(7);

    let payload: { sub: string; email: string };
    try {
      payload = verifyAccessToken(token);
    } catch {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User no longer exists',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
}
