/**
 * Users API Routes
 *
 * User search for circle member addition
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth';
import { UserSearchSchema } from '../../validators';

const router: RouterType = Router();

router.use(authMiddleware);

/**
 * GET /api/v1/users/search?q=
 *
 * Search users by email or name (case-insensitive contains).
 * Excludes the requesting user from results.
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const parsed = UserSearchSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.errors });
    return;
  }

  const { q } = parsed.data;
  const userId = req.user!.id;

  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 20,
  });

  res.json({ users });
});

export default router;
