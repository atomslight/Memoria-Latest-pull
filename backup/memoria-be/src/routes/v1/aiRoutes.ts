import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { chat, getConversations, getConversationMessages, deleteConversation } from '../../controllers/v1/aiController';

const router = Router();

router.use(authMiddleware);

// ─── POST /chat ───────────────────────────────────────────────────────────────
router.post('/chat', chat);

// ─── GET /conversations ───────────────────────────────────────────────────────
router.get('/conversations', getConversations);

// ─── GET /conversations/:id/messages ─────────────────────────────────────────
router.get('/conversations/:id/messages', getConversationMessages);

// ─── DELETE /conversations/:id ────────────────────────────────────────────────
router.delete('/conversations/:id', deleteConversation);

export default router;