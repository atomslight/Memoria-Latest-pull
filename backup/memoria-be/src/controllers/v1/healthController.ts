import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { storageService } from '../../services/storage';

/**
 * Detailed Health Check
 * Checks all critical services: database, redis, storage
 */
export const healthCheck = async (_req: Request, res: Response) => {
  const checks = {
    database: false,
    redis: false,
    storage: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  try {
    checks.storage = await storageService.ping();
  } catch (error) {
    console.error('Storage health check failed:', error);
  }

  const allHealthy = checks.database && checks.redis && checks.storage;
  const status = allHealthy ? 'healthy' : 'degraded';
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    checks,
    timestamp: checks.timestamp,
  });
};
