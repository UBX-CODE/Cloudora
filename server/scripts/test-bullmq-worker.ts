import { prisma } from '../src/lib/prisma';
import { redisClient } from '../src/lib/redis';
import { storageClient } from '../src/lib/storage';
import { config } from '../src/config/env';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import * as fileUploadService from '../src/services/file-upload.service';
import '../src/workers/file-processing.worker'; // Boot worker
import sharp from 'sharp';
import bcrypt from 'bcrypt';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n======================================================');
  console.log(' Cloudora BullMQ & Redis Background Worker Test');
  console.log('======================================================\n');

  const testEmail = 'worker_test_user@cloudora.dev';

  try {
    // 1. Cleanup old test data
    console.log('[Setup] Cleaning up old test data...');
    const oldUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (oldUser) {
      await prisma.file.deleteMany({ where: { ownerId: oldUser.id } });
      await prisma.user.delete({ where: { id: oldUser.id } });
    }

    // 2. Create User
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: hashedPassword,
        name: 'Worker Test User',
      },
    });
    console.log(`[Setup] Created user: ${user.email} (${user.id})`);

    // 3. Generate a sample 800x600 PNG image using sharp
    console.log('\n--- 1. Generating Raw Test Image (800x600 PNG) ---');
    const originalImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 99, g: 102, b: 241, alpha: 1 }, // Indigo background
      },
    })
      .png()
      .toBuffer();

    console.log(`• Generated test image: ${originalImageBuffer.length} bytes (800x600)`);

    // 4. Request Upload Presigned URL
    console.log('\n--- 2. Requesting Upload Presigned URL ---');
    const uploadInit = await fileUploadService.createUploadUrl(user.id, {
      name: 'banner_art.png',
      mimeType: 'image/png',
      size: originalImageBuffer.length,
    });
    console.log(`• File created in PENDING state: "${uploadInit.fileId}"`);

    // 5. Upload direct to MinIO S3
    const uploadRes = await fetch(uploadInit.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: originalImageBuffer,
    });
    assert(uploadRes.status === 200, 'MinIO PUT should return 200');
    console.log('• MinIO direct PUT completed with 200 OK');

    // 6. Confirm Single Upload (This dispatches the BullMQ job!)
    console.log('\n--- 3. Confirming Upload & Dispatching BullMQ Job ---');
    const confirmed = await fileUploadService.confirmSingleUpload(user.id, uploadInit.fileId);
    assert(confirmed.status === 'UPLOADED', 'Status should be UPLOADED');
    console.log(`• Upload confirmed! Status: ${confirmed.status}`);
    console.log('• BullMQ job dispatched to Redis queue: "file-processing-queue"');

    // 7. Wait for BullMQ worker to asynchronously process the image
    console.log('\n--- 4. Waiting for Asynchronous Worker Execution ---');
    let thumbnailKey: string | null = null;
    const maxWaitSeconds = 15;
    const start = Date.now();

    for (let i = 0; i < maxWaitSeconds * 2; i++) {
      await sleep(500);
      const fileRecord = await prisma.file.findUnique({
        where: { id: uploadInit.fileId },
        select: { thumbnailKey: true },
      });

      if (fileRecord?.thumbnailKey) {
        thumbnailKey = fileRecord.thumbnailKey;
        break;
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    assert(thumbnailKey !== null, `Worker should populate thumbnailKey within ${maxWaitSeconds}s`);
    console.log(`• Worker finished in ${elapsed}s! Populated thumbnailKey: "${thumbnailKey}"`);

    // 8. Fetch generated WebP thumbnail from MinIO and inspect metadata
    console.log('\n--- 5. Verifying Thumbnail in MinIO Object Storage ---');
    const getThumbCommand = new GetObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: thumbnailKey!,
    });
    const thumbResponse = await storageClient.send(getThumbCommand);
    assert(thumbResponse.ContentType === 'image/webp', 'Content-Type should be image/webp');

    const thumbByteArray = await thumbResponse.Body!.transformToByteArray();
    const thumbBuffer = Buffer.from(thumbByteArray);
    console.log(`• Thumbnail fetched from MinIO: ${thumbBuffer.length} bytes (Content-Type: ${thumbResponse.ContentType})`);

    // Inspect image dimensions using sharp
    const metadata = await sharp(thumbBuffer).metadata();
    console.log(`• Thumbnail format: ${metadata.format} | Dimensions: ${metadata.width}x${metadata.height}`);
    assert(metadata.format === 'webp', 'Thumbnail format must be WebP');
    assert(metadata.width === 256, 'Thumbnail width must be 256px');
    assert(metadata.height === 256, 'Thumbnail height must be 256px');

    console.log('\n======================================================');
    console.log(' ALL BULLMQ & REDIS WORKER TESTS PASSED! ⚡');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ BullMQ test failed:', err);
    process.exit(1);
  } finally {
    try {
      const u = await prisma.user.findUnique({ where: { email: testEmail } });
      if (u) {
        await prisma.file.deleteMany({ where: { ownerId: u.id } });
        await prisma.user.delete({ where: { id: u.id } });
      }
    } catch {}
    await redisClient.quit();
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
