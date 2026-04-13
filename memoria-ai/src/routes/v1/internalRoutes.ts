import { Router } from 'express';
import { postCaption } from '../../controllers/v1/captionController';
import { postChatStream } from '../../controllers/v1/chatController';
import { postImageEmbedding, postTextEmbedding } from '../../controllers/v1/embeddingController';
import { postFaceDetection } from '../../controllers/v1/faceDetectionController';
const router = Router();

router.post('/embeddings/text', postTextEmbedding);
router.post('/embeddings/image', postImageEmbedding);
router.post('/captions', postCaption);
router.post('/chat/stream', postChatStream);
router.post('/face-detection', postFaceDetection);
export default router;
