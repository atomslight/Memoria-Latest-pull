# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Memoria is a photo memories application with an AI-powered backend. It's structured as a monorepo with three separate projects:

- **memoria-fe** - React Native mobile frontend
- **memoria-be** - Express.js backend API with Prisma ORM
- **memoria-ai** - AI inference microservice

## Commands

### Backend (memoria-be)
```bash
npm run dev              # Development server with hot reload (tsx watch)
npm run build            # Compile TypeScript to dist/
npm run start            # Run production build from dist/
npm run type-check       # TypeScript type checking without emit
npm run lint             # ESLint on src/
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
```

### Frontend (memoria-fe)
```bash
npm start                # Start Metro bundler
npm run android          # Build and run on Android
npm run ios              # Build and run on iOS
npm run lint             # Run ESLint
npm run test             # Run Jest tests
npm run adb:reactotron   # Setup ADB reverse for Reactotron debugging
```

### AI Service (memoria-ai)
```bash
npm run dev              # Development server with hot reload
npm run build            # Compile TypeScript to dist/
npm run start            # Run production build
npm run env:sync         # Sync environment variables
```

## Architecture

### Backend (memoria-be)

**Entry Point:** `src/index.ts` → `src/server.ts`

**Layered Architecture:**
- `routes/v1/` - API route definitions (`/api/v1/*`)
- `routes/internal/` - Service-to-service routes (`/internal/v1/*`)
- `controllers/v1/` - Request handlers, HTTP concerns
- `services/` - Business logic, database operations
- `validators/` - Zod schemas for request validation
- `middleware/` - Auth, error handling, request ID

**Background Jobs (BullMQ):**
- `queues/` - Job queue definitions
- `workers/` - Job processors (aiCaptionWorker, embeddingWorker, metadataWorker, thumbnailWorker)
- Bull Board UI at `/admin/queues` for queue monitoring

**Database:** PostgreSQL with Prisma ORM. Key models:
- User → Photos, Circle memberships, Conversations
- Photo → AI results, embeddings (pgvector), storage metadata
- Circle → Members, shared photos
- Conversation → Messages (AI chat history)

**Storage:** AWS S3 with presigned URLs. Public bucket (avatars) and private bucket (memories).

### Frontend (memoria-fe)

**Entry Point:** `src/AppRoot.tsx` wraps the app with providers

**State Management (Hybrid):**
- Redux Toolkit + Redux Saga (`src/redux/`, `src/network/sagas/`) - Complex async flows
- Zustand stores (`src/stores/`) - Auth, preferences, upload state

**Navigation:** React Navigation with `RootNavigator.tsx` and `TabsNavigator.tsx`

**Network Layer:** `src/network/sagas/` contains Redux Saga API calls organized by feature (auth, memories, circles, etc.)

### AI Service (memoria-ai)

**Purpose:** Dedicated microservice for compute-intensive AI inference (embeddings, image captioning)

**Communication:**
- Main API calls AI service at `AI_SERVICE_URL` for embeddings/captions
- AI service calls back to main API at `MAIN_API_URL` for persistence and tool execution
- Both services share `AI_INTERNAL_SECRET` for internal authentication

**Entry Point:** `src/index.ts`
- Routes at `/internal/v1/*` (protected by internalAuth middleware)

## Environment Variables

Both backend and AI service use Zod for environment validation at startup. Required variables:

**Backend (memoria-be):**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis for BullMQ queues
- `S3_BUCKET_NAME` / `S3_PRIVATE_BUCKET_NAME` - AWS S3 buckets
- `JWT_ACCESS_TOKEN_SECRET` + `JWT_REFRESH_TOKEN_SECRET` (or legacy `JWT_SECRET`)
- `AI_SERVICE_URL` - AI inference service URL
- `AI_INTERNAL_SECRET` - Shared secret for service-to-service auth
- `GEMINI_API_KEY` or Vertex AI credentials for AI features

**AI Service (memoria-ai):**
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key
- `VERTEX_AI_PROJECT_ID` - Google Cloud project for Vertex AI
- `MAIN_API_URL` - Main API base URL for callbacks
- `AI_INTERNAL_SECRET` - Must match backend

## Service Communication Flow

```
Frontend → Backend API → AI Service (for inference)
                ↑              │
                └──────────────┘ (tool calls, persistence)
```

The AI service is intentionally separate to scale independently for compute-heavy workloads.