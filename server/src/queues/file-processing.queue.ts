import { Queue } from 'bullmq';
import { config } from '../config/env';

export interface FileProcessingJobData {
  fileId: string;
  storageKey: string;
  mimeType: string;
  ownerId: string;
}

// Dedicated BullMQ Redis connection options (maxRetriesPerRequest must be null)
export const bullmqRedisConnection = {
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
};

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
  return fileProcessingQueue.add('generate-thumbnail', data);
}