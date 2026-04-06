import Redis from 'ioredis';

/**
 * Redis Connection
 * Used for BullMQ job queue and caching
 */

let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    // Create Redis connection with TLS for Upstash
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
    });

    // Connection event handlers
    redisInstance.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisInstance.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    redisInstance.on('close', () => {
      console.log('🔌 Redis connection closed');
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      if (redisInstance) {
        await redisInstance.quit();
      }
    });
  }

  return redisInstance;
}

// Export lazy-loaded redis instance
export const redis = new Proxy({} as Redis, {
  get: (_target, prop) => {
    const instance = getRedis();
    return instance[prop as keyof Redis];
  },
});

// Export connection for BullMQ (returns the singleton instance)
export function getRedisConnection() {
  return getRedis();
}
