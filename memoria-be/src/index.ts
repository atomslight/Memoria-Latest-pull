import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/error';
import { initializeBullBoard } from './config/bullBoard';
import { healthRouter } from './routes/v1/healthRoutes';
import { authRouter } from './routes/v1/authRoutes';
import memoriesRouter from './routes/v1/memoriesRoutes';
import searchRouter from './routes/v1/searchRoutes';
import circlesRouter from './routes/v1/circlesRoutes';
import usersRouter from './routes/v1/usersRoutes';
import aiRouter from './routes/v1/aiRoutes';
import internalServiceRouter from './routes/internal/serviceRoutes';
import { aiCaptionWorker } from './workers/aiCaptionWorker';
import { embeddingWorker } from './workers/embeddingWorker';
import { metadataWorker } from './workers/metadataWorker';
import { faceDetectionWorker } from './workers/faceDetectionWorker';
console.log('🤖 Starting AI caption worker...');
if (aiCaptionWorker) {
  console.log('✅ AI caption worker initialized');
}
console.log('📍 Starting face detection worker...');
if (faceDetectionWorker) {
  console.log('✅ Face detection worker initialized');
}
console.log('📍 Starting metadata worker...');
if (metadataWorker) {
  console.log('✅ Metadata worker initialized');
}
console.log('🔮 Starting embedding worker...');
if (embeddingWorker) {
  console.log('✅ Embedding worker initialized');
}

const app = express();
const PORT = parseInt(env.PORT, 10) || 3000;

app.use(requestId);
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/memories', memoriesRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/circles', circlesRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/ai', aiRouter);

/** Service-to-service (Memoria AI ↔ API): tool execution + chat persistence. Restrict in production. */
app.use('/internal/v1', internalServiceRouter);

const serverAdapter = initializeBullBoard();
app.use('/admin/queues', serverAdapter.getRouter());

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Memoria API server running on port ${PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV || 'development'}`);
  if (env.NODE_ENV !== 'production') {
    console.log(`  → AI service at ${env.AI_SERVICE_URL} (set AI_SERVICE_URL to match ai-service host:port)`);
  }
});
