import { redisClient, isRedisConnected } from '../lib/redis';

/**
 * Cache-Aside Helper:
 * 1. Checks Redis for the given key.
 * 2. If found (Cache HIT), returns parsed JSON.
 * 3. If missing (Cache MISS), executes fetcher(), stores result in Redis with TTL, and returns it.
 * 4. Graceful Degradation: If Redis is offline, directly executes fetcher() without failing.
 */
export async function getOrSetCache<T>(key: string,ttlSeconds: number,fetcher: () => Promise<T>): Promise<T> {
  // If Redis is down, fail open and query database directly
  if (!isRedisConnected) {
    return fetcher();
  }

  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData) as T;
    }
  } catch (err: any) {
    console.warn(`[Cache Error GET] Key "${key}":`, err.message);
  }

  // Cache MISS -> Fetch from Database
  const freshData = await fetcher();

  // Save to Redis in background with TTL
  if (isRedisConnected && freshData !== undefined && freshData !== null) {
    try {
      await redisClient.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
    } catch (err: any) {
      console.warn(`[Cache Error SET] Key "${key}":`, err.message);
    }
  }

  return freshData;
}

/**
 * Deletes one or more specific cache keys.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (!isRedisConnected || keys.length === 0) return;

  try {
    await redisClient.del(...keys);
  } catch (err: any) {
    console.warn('[Cache Error DEL]:', err.message);
  }
}

/**
 * Deletes all keys matching a specific pattern (e.g. "cache:folders:user123:*").
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  if (!isRedisConnected) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err: any) {
    console.warn(`[Cache Error DEL Pattern "${pattern}"]:`, err.message);
  }
}