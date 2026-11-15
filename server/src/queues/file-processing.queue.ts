import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from '../config/env';

export interface FileProcessingJobData {
  fileId: string;
  storageKey: string;
  mimeType: string;
  ownerId: string;
}

export const isQueueEnabled = Boolean(config.REDIS_URL);
export let bullmqRedisConnection: Redis | null = null;
export let fileProcessingQueue: Queue<FileProcessingJobData> | null = null;

if (isQueueEnabled && config.REDIS_URL) {
  bullmqRedisConnection = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[BullMQ Redis] Stopped reconnecting after 3 failed attempts.');
        return null;
      }
      return Math.min(times * 300, 2000);
    },
  });

  bullmqRedisConnection.on('error', (err) => {
    console.warn('[BullMQ Redis] Connection warning:', err.message);
  });

  fileProcessingQueue = new Queue<FileProcessingJobData>('file-processing-queue', {
    connection: bullmqRedisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  fileProcessingQueue.on('error', (err) => {
    console.warn('[BullMQ Queue] Warning:', err.message);
  });
}

// Helper to dispatch a job from Express handlers
export async function dispatchFileProcessingJob(data: FileProcessingJobData) {
  if (!fileProcessingQueue) {
    return;
  }
  try {
    return await fileProcessingQueue.add('generate-thumbnail', data);
  } catch (err: any) {
    console.warn('[BullMQ] Could not dispatch thumbnail job:', err.message);
  }
}