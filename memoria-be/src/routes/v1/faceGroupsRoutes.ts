import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getFaceGroups, getFaceGroup, updateFaceGroup } from '../../controllers/v1/faceGroupsController';

const router = Router();

router.use(authMiddleware);

router.get('/', getFaceGroups);
router.get('/:id', getFaceGroup);
router.patch('/:id', updateFaceGroup);

export default router;
