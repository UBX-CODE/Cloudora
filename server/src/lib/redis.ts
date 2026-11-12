import Redis from 'ioredis';
import { config } from '../config/env';

// Redis Client Instance
export const redisClient = new Redis(config.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    // Reconnect delay with max cap of 2 seconds
    return Math.min(times * 100, 2000);
  },
});

export let isRedisConnected = false;

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
  console.warn('[Redis] Connection warning/error:', err.message);
});

redisClient.on('close', () => {
  isRedisConnected = false;
  console.warn('[Redis] Connection closed.');
});