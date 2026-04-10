import { Router } from 'express';
import { internalServiceAuth } from '../../middleware/internalServiceAuth';
import { postPersistChatMessages, postSearchPhotosTool } from '../../controllers/internal/aiInternalController';

const router = Router();

router.use(internalServiceAuth);

router.post('/tool/search-photos', postSearchPhotosTool);
router.post('/ai/persist-messages', postPersistChatMessages);

export default router;
