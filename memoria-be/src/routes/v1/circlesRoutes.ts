import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
  createCircle,
  listCircles,
  getCircleDetail,
  updateCircle,
  bulkAddPhotos,
  deleteCircle,
  getCirclePhotos,
  addPhoto,
  addMember,
  removeMember,
  getCircleMembers,
  updateMemberRole,
} from '../../controllers/v1/circlesController';

const router = Router();

router.use(authMiddleware);

// ─── Create Circle ────────────────────────────────────────────────────────────
router.post('/', createCircle);

// ─── List User's Circles ──────────────────────────────────────────────────────
router.get('/', listCircles);

// ─── Get Circle Detail ────────────────────────────────────────────────────────
router.get('/:id', getCircleDetail);

// ─── Update Circle ────────────────────────────────────────────────────────────
router.patch('/:id', updateCircle);

// ─── Bulk Add Photos to Circle ────────────────────────────────────────────────
router.post('/:id/photos/bulk', bulkAddPhotos);

// ─── Delete Circle ────────────────────────────────────────────────────────────
router.delete('/:id', deleteCircle);

// ─── Get Circle Photos ────────────────────────────────────────────────────────
router.get('/:id/photos', getCirclePhotos);

// ─── Add Photo to Circle ──────────────────────────────────────────────────────
router.post('/:id/photos', addPhoto);

// ─── Add Member ───────────────────────────────────────────────────────────────
router.post('/:id/members', addMember);

// ─── Remove Member ────────────────────────────────────────────────────────────
router.delete('/:id/members/:userId', removeMember);

// ─── Get Circle Members ───────────────────────────────────────────────────────
router.get('/:id/members', getCircleMembers);

// ─── Update Member Role ───────────────────────────────────────────────────────
router.patch('/:id/members/:userId', updateMemberRole);

export default router;