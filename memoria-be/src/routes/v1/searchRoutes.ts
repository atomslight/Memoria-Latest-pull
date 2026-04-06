import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { searchMemories } from '../../controllers/v1/searchController';

const router = Router();

router.use(authMiddleware);

router.get('/', searchMemories);

export default router;