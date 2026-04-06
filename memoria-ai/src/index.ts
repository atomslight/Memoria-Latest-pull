import express from 'express';
import helmet from 'helmet';
import { aiServiceEnv } from './config/env';
import { internalAuth } from './middleware/internalAuth';
import { healthRouter } from './routes/v1/healthRoutes';
import internalRouter from './routes/v1/internalRoutes';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '15mb' }));

app.use('/health', healthRouter);
app.use('/internal/v1', internalAuth, internalRouter);

const port = parseInt(aiServiceEnv.AI_SERVICE_PORT, 10) || 8080;

app.listen(port, () => {
  console.log(`Memoria AI inference service listening on port ${port}`);
  if (aiServiceEnv.NODE_ENV !== 'production') {
    console.log(`  → calls main API at ${aiServiceEnv.MAIN_API_URL} (set MAIN_API_URL if this is wrong)`);
  }
});
