import { Router } from 'express';
import { healthCheck } from '../../controllers/v1/healthController';

const router = Router();

router.get('/', healthCheck);

export { router as healthRouter };
