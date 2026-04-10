import { Router } from 'express';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { storageService } from '../../services/storage';

const router = Router();

/**
 * Detailed Health Check
 * Checks all critical services: database, redis, storage
 */
router.get('/', async (_req, res) => {
  const checks = {
    database: false,
    redis: false,
    storage: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    // Check Redis connection
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

  // Determine overall status
  const allHealthy = checks.database && checks.redis && checks.storage;
  const status = allHealthy ? 'healthy' : 'degraded';
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    checks,
    timestamp: checks.timestamp
  });
});

export { router as healthRouter };
