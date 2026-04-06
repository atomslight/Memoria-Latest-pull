import { Router } from 'express';
import { postCaption } from '../../controllers/v1/captionController';
import { postChatStream } from '../../controllers/v1/chatController';
import { postImageEmbedding, postTextEmbedding } from '../../controllers/v1/embeddingController';

const router = Router();

router.post('/embeddings/text', postTextEmbedding);
router.post('/embeddings/image', postImageEmbedding);
router.post('/captions', postCaption);
router.post('/chat/stream', postChatStream);

export default router;
