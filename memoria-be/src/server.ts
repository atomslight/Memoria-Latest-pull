/**
 * Server Entry Point
 * Loads environment variables before importing any modules
 */

// IMPORTANT: Load dotenv FIRST before any other imports
import dotenv from 'dotenv';

// Load .env from current working directory (apps/backend)
dotenv.config();

// Validate environment variables
import { validateEnv } from './config/env';
validateEnv();

// Now import and start the app
import('./index.js');
