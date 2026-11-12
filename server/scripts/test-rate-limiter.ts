import app from '../src/app';
import { redisClient } from '../src/lib/redis';
import http from 'http';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function startServer(): Promise<{ server: http.Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as any;
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}/api` });
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log(' Testing Cloudora Distributed Rate Limiter (Redis)');
  console.log('======================================================\n');

  const { server, baseUrl } = await startServer();

  try {
    // 1. Flush rate-limiting keys in Redis
    const existingKeys = await redisClient.keys('rl:*');
    if (existingKeys.length > 0) {
      await redisClient.del(...existingKeys);
      console.log(`[Setup] Flushed ${existingKeys.length} old rate-limit keys from Redis.`);
    }

    console.log('\nTesting Auth Rate Limiter (Max: 5 requests per 15 minutes)...');

    // Make 5 consecutive requests to /auth/login
    for (let i = 1; i <= 5; i++) {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@cloudora.dev', password: 'wrong' }),
      });

      const limit = res.headers.get('X-RateLimit-Limit');
      const remaining = res.headers.get('X-RateLimit-Remaining');
      const reset = res.headers.get('X-RateLimit-Reset');

      console.log(`• Request #${i} => HTTP ${res.status} | Limit: ${limit} | Remaining: ${remaining} | Reset: ${reset}`);
      assert(limit === '5', `Limit should be 5`);
      assert(remaining === String(5 - i), `Remaining should be ${5 - i}`);
    }

    // 6th Request: Should be rejected with 429 Too Many Requests!
    console.log('\nSending Request #6 (Must be rejected with 429)...');
    const blockedRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@cloudora.dev', password: 'wrong' }),
    });

    const blockedData = await blockedRes.json();
    const retryAfter = blockedRes.headers.get('Retry-After');
    const remaining = blockedRes.headers.get('X-RateLimit-Remaining');

    console.log(`• Request #6 => HTTP ${blockedRes.status} | Remaining: ${remaining} | Retry-After: ${retryAfter}s`);
    console.log('• Response Body:', blockedData);

    assert(blockedRes.status === 429, `Expected HTTP 429, got ${blockedRes.status}`);
    assert(remaining === '0', 'Remaining should be 0');
    assert(Number(retryAfter) > 0, 'Retry-After should be > 0');
    assert(blockedData.success === false, 'success should be false');

    // 2. Inspect the actual Redis data structure!
    console.log('\n======================================================');
    console.log(' Inspecting Redis Storage Engine (ZSET Internals):');
    console.log('======================================================');
    const keys = await redisClient.keys('rl:*');
    console.log('• Redis Rate Limit Keys:', keys);

    for (const k of keys) {
      const ttl = await redisClient.ttl(k);
      const membersWithScores = await redisClient.zrange(k, 0, '10', 'WITHSCORES');
      console.log(`\nKey: "${k}" (TTL: ${ttl}s)`);
      console.log('Sorted Set Entries [Member, Score (timestamp ms)]:');
      for (let i = 0; i < membersWithScores.length; i += 2) {
        const member = membersWithScores[i];
        const score = membersWithScores[i + 1];
        const dateStr = new Date(Number(score)).toISOString();
        console.log(`   - Member: ${member} | Score: ${score} (${dateStr})`);
      }
    }

    console.log('\nRate Limiter test completed successfully with 100% compliance!\n');
  } finally {
    server.close();
    await redisClient.quit();
  }
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

