import Redis from 'ioredis';
import { config } from '../config/env';

export const isRedisEnabled = Boolean(config.REDIS_URL);
export let isRedisConnected = false;

// Create Redis Client only if a URL is provided
export const redisClient = isRedisEnabled
  ? new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Stopped reconnecting after 3 failed attempts.');
          return null; // Stop retrying
        }
        return Math.min(times * 300, 2000);
      },
    })
  : ({} as unknown as Redis);

if (isRedisEnabled && redisClient.on) {
  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[Redis] Connected to Redis server.');
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
    console.log('[Redis] Connection ready to accept commands.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    console.warn('[Redis] Connection warning:', err.message);
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
  });
} else {
  console.log('[Redis] REDIS_URL not configured. Operating with graceful database fallback.');
}