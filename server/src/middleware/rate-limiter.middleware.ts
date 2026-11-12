import { Request, Response, NextFunction } from 'express';
import { redisClient, isRedisConnected } from '../lib/redis';

export interface RateLimiterOptions {
  windowMs: number;        // Window duration in ms (e.g. 60 * 1000 for 1 min)
  max: number;             // Max allowed requests in this window
  keyPrefix?: string;      // Prefix to namespace keys (e.g. "rl:auth")
  message?: string;        // Custom rejection message
}

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    keyPrefix = 'rl:general',
    message = 'Too many requests. Please try again later.',
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. High Availability Fallback: If Redis is disconnected, fail open
    if (!isRedisConnected) {
      return next();
    }

    try {
      // 2. Determine client identifier (user ID if authenticated, else IP)
      const clientId = req.user?.id
        ? `user:${req.user.id}`
        : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;

      const key = `${keyPrefix}:${clientId}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // 3. Run atomic Redis pipeline to prune old entries & count current requests
      const pipeline = redisClient.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);

      const results = await pipeline.exec();
      if (!results) {
        return next();
      }

      // results[1][1] has the ZCARD count
      const currentCount = (results[1][1] as number) || 0;

      // 4. Check if limit exceeded
      if (currentCount >= max) {
        // Query the oldest item in current window to calculate precise Retry-After
        const oldestEntries = await redisClient.zrange(key, 0, '0', 'WITHSCORES');
        let retryAfterSeconds = windowSeconds;

        if (oldestEntries && oldestEntries.length >= 2) {
          const oldestTimestamp = parseFloat(oldestEntries[1]);
          const resetTimeMs = oldestTimestamp + windowMs;
          retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
        }

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil((now + retryAfterSeconds * 1000) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds);

        res.status(429).json({
          success: false,
          message,
          retryAfter: retryAfterSeconds,
        });
        return;
      }

      // 5. Allow request: Add current request to Sorted Set and refresh TTL
      const uniqueMember = `${now}:${Math.random().toString(36).substring(2, 8)}`;
      await redisClient
        .multi()
        .zadd(key, now, uniqueMember)
        .expire(key, windowSeconds)
        .exec();

      // Set standard rate limit headers on allowed request
      const remaining = Math.max(0, max - currentCount - 1);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

      next();
    } catch (err: any) {
      console.warn('[RateLimiter Error - Fail Open]:', err.message);
      // Fail-open strategy: agar Redis query fail ho, user request drop mat karo
      next();
    }
  };
}
// 1. Auth Limiter: Max 5 attempts per 15 minutes per IP (Brute-force protection)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: 'rl:auth',
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

// 2. Upload Limiter: Max 20 upload creations per minute per user (DDoS / URL Flooding protection)
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  keyPrefix: 'rl:upload',
  message: 'Upload creation rate limit exceeded. Please wait a minute before creating new uploads.',
});

// 3. General API Limiter: Max 100 requests per minute per user/IP
export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  keyPrefix: 'rl:api',
  message: 'Too many API requests. Please slow down.',
});