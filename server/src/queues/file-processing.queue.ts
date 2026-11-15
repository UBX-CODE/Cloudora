import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from '../config/env';

export interface FileProcessingJobData {
  fileId: string;
  storageKey: string;
  mimeType: string;
  ownerId: string;
}

// Dedicated BullMQ Redis connection instance (maxRetriesPerRequest must be null)
export const bullmqRedisConnection = new Redis(config.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

bullmqRedisConnection.on('error', (err) => {
  console.warn('[BullMQ Redis] Connection warning:', err.message);
});

// 1. Initialize BullMQ Queue
export const fileProcessingQueue = new Queue<FileProcessingJobData>('file-processing-queue', {
  connection: bullmqRedisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on transient failures
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s -> 4s -> 8s
    },
    removeOnComplete: 100, // Keep last 100 completed jobs in Redis for telemetry
    removeOnFail: 500,     // Dead Letter Queue: keep failed jobs for debugging
  },
});

// 2. Helper to dispatch a job from Express handlers
export async function dispatchFileProcessingJob(data: FileProcessingJobData) {
  try {
    return await fileProcessingQueue.add('generate-thumbnail', data);
  } catch (err: any) {
    console.warn('[BullMQ] Could not dispatch thumbnail job:', err.message);
  }
}