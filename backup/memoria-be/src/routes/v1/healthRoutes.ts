import { Router } from 'express';
import { healthCheck } from '../../controllers/v1/healthController';

const router = Router();

/**
 * Detailed Health Check
 * Checks all critical services: database, redis, storage
 */
router.get('/', healthCheck);

export { router as healthRouter };