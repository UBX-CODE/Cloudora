import { Worker, Job } from 'bullmq';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { bullmqRedisConnection, FileProcessingJobData } from '../queues/file-processing.queue';
import { storageClient } from '../lib/storage';
import { config } from '../config/env';
import { prisma } from '../lib/prisma';
import { invalidateCacheByPattern } from '../utils/cache';

export const fileProcessingWorker = new Worker<FileProcessingJobData>(
  'file-processing-queue',
  async (job: Job<FileProcessingJobData>) => {
    const { fileId, storageKey, mimeType, ownerId } = job.data;
    console.log(`[Worker] Processing thumbnail for file: "${fileId}" (${mimeType})`);

    // 1. Only process images
    if (!mimeType.startsWith('image/')) {
      console.log(`[Worker] Skipping non-image file: ${mimeType}`);
      return;
    }

    // 2. Fetch original image from MinIO S3
    const getCommand = new GetObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: storageKey,
    });

    const s3Response = await storageClient.send(getCommand);
    if (!s3Response.Body) {
      throw new Error(`Failed to retrieve file "${storageKey}" from MinIO`);
    }

    // Convert S3 stream to Buffer
    const byteArray = await s3Response.Body.transformToByteArray();
    const originalBuffer = Buffer.from(byteArray);

    // 3. Resize and convert to WebP using sharp (256x256 thumbnail)
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize(256, 256, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer();

    // 4. Upload generated thumbnail back to MinIO
    const thumbnailKey = `thumbnails/${fileId}.webp`;
    await storageClient.send(
      new PutObjectCommand({
        Bucket: config.MINIO_BUCKET,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/webp',
      })
    );

    // 5. Update File record in database
    await prisma.file.update({
      where: { id: fileId },
      data: { thumbnailKey },
    });

    // 6. Invalidate file cache so frontend reflects new thumbnail immediately
    await invalidateCacheByPattern(`cache:file:*:${ownerId}*`);

    console.log(`[Worker] ✅ Thumbnail generated & saved: "${thumbnailKey}" (${thumbnailBuffer.length} bytes)`);
  },
  {
    connection: bullmqRedisConnection,
    concurrency: 2, // Process up to 2 image transforms in parallel
  }
);

// Worker Lifecycle & Telemetry Events
fileProcessingWorker.on('ready', () => {
  console.log('[Worker] File processing worker is ready and listening for jobs.');
});

fileProcessingWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully for file ${job.data.fileId}`);
});

fileProcessingWorker.on('failed', (job, err) => {
  console.error(`[Worker] ❌ Job ${job?.id} failed:`, err.message);
});