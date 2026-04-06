import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { searchUsers } from '../../controllers/v1/usersController';

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/v1/users/search?q=
 *
 * Search users by email or name (case-insensitive contains).
 * Excludes the requesting user from results.
 */
router.get('/search', searchUsers);

export default router;