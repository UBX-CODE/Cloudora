import {
  PutObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { storageClient } from '../lib/storage';
import { config } from '../config/env';
import { AppError } from '../utils/errors';
import { verifyStorageQuota, recordUploadCompleted } from './quota.service';
import { dispatchFileProcessingJob } from '../queues/file-processing.queue';

export interface CreateUploadDTO {
  name: string;
  mimeType: string;
  size: number;
  folderId?: string;
}

export interface CreateMultipartUploadDTO {
  name: string;
  mimeType: string;
  size: number;
  folderId?: string;
}

export interface UploadedPartDTO {
  PartNumber: number;
  ETag: string;
}

export interface CompleteMultipartUploadDTO {
  parts: UploadedPartDTO[];
}

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const MULTIPART_THRESHOLD = 16 * 1024 * 1024; // 16 MiB
export const PART_SIZE = 8 * 1024 * 1024; // 8 MiB
export const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes
export const MULTIPART_EXPIRY_MINUTES = 60; // 60 minutes

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
];

/**
 * Validates common file upload metadata.
 */
function validateUploadMetadata(name?: string, mimeType?: string, size?: number): { cleanName: string; cleanMime: string } {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError('File name is required.', 400);
  }

  const cleanName = name.trim();
  if (cleanName.length > 255) {
    throw new AppError('File name cannot exceed 255 characters.', 400);
  }

  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new AppError(`File type '${mimeType}' is not allowed.`, 400);
  }

  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size <= 0) {
    throw new AppError('Invalid file size.', 400);
  }

  if (size > MAX_FILE_SIZE) {
    throw new AppError('File size exceeds the maximum allowed limit of 100 MB.', 400);
  }

  return { cleanName, cleanMime: mimeType };
}

/**
 * Validates folder ownership if folderId is provided.
 */
async function validateFolderOwnership(ownerId: string, folderId?: string): Promise<void> {
  if (!folderId) return;

  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      ownerId,
      isTrashed: false,
    },
  });

  if (!folder) {
    throw new AppError('Destination folder not found.', 404);
  }
}

/**
 * 1. Single-file presigned PUT upload flow (for files <= 16 MiB).
 */
export async function createUploadUrl(ownerId: string, data: CreateUploadDTO) {
  const { cleanName, cleanMime } = validateUploadMetadata(data.name, data.mimeType, data.size);
  await validateFolderOwnership(ownerId, data.folderId);
  await verifyStorageQuota(ownerId, data.size);

  const fileId = randomUUID();
  const storageKey = `${ownerId}/${fileId}`;

  const file = await prisma.file.create({
    data: {
      id: fileId,
      name: cleanName,
      mimeType: cleanMime,
      size: BigInt(data.size),
      storageKey,
      status: 'PENDING',
      ownerId,
      folderId: data.folderId ?? null,
    },
  });

  try {
    const command = new PutObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: storageKey,
      ContentType: cleanMime,
      ContentLength: data.size,
    });

    const uploadUrl = await getSignedUrl(storageClient, command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    return {
      fileId: file.id,
      uploadUrl,
      storageKey,
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    };
  } catch (error) {
    await prisma.file.update({
      where: { id: file.id },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}

/**
 * 2. Confirm single-file upload via HeadObject.
 */
export async function confirmSingleUpload(ownerId: string, fileId: string) {
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      ownerId,
    },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  // Idempotent completion check
  if (file.status === 'UPLOADED') {
    return { fileId, status: 'UPLOADED', name: file.name, size: Number(file.size) };
  }

  if (file.status !== 'PENDING' || !file.storageKey) {
    throw new AppError('File cannot be confirmed in its current state.', 400);
  }

  let object;
  try {
    object = await storageClient.send(
      new HeadObjectCommand({
        Bucket: config.MINIO_BUCKET,
        Key: file.storageKey,
      })
    );
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      throw new AppError('File has not been uploaded to object storage yet.', 400);
    }
    throw err;
  }

  if (
    Number(object.ContentLength) !== Number(file.size) ||
    (object.ContentType && object.ContentType !== file.mimeType)
  ) {
    throw new AppError('Uploaded file metadata does not match registered file details.', 400);
  }

  const updatedFile = await prisma.file.update({
    where: { id: file.id },
    data: {
      status: 'UPLOADED',
      checksum: object.ETag?.replace(/"/g, '') || null,
    },
  });

  // Atomically increment user's storage quota usage
  await recordUploadCompleted(ownerId, file.size);

  // Dispatch asynchronous thumbnail generation for images
  if (file.mimeType.startsWith('image/')) {
  await dispatchFileProcessingJob({
    fileId: file.id,
    storageKey: file.storageKey!,
    mimeType: file.mimeType,
    ownerId,
  });
  }

  return {
    fileId: updatedFile.id,
    status: updatedFile.status,
    name: updatedFile.name,
    size: Number(updatedFile.size),
  };
}

/**
 * 3. Initialize multipart upload in MinIO and DB.
 */
export async function initializeMultipartUpload(ownerId: string, data: CreateMultipartUploadDTO) {
  const { cleanName, cleanMime } = validateUploadMetadata(data.name, data.mimeType, data.size);

  if (data.size <= MULTIPART_THRESHOLD) {
    throw new AppError(
      `File size (${data.size} bytes) does not exceed the multipart threshold (16 MiB). Please use the single upload flow.`,
      400
    );
  }

  await validateFolderOwnership(ownerId, data.folderId);
  await verifyStorageQuota(ownerId, data.size);

  const fileId = randomUUID();
  const storageKey = `${ownerId}/${fileId}`;
  const totalParts = Math.ceil(data.size / PART_SIZE);

  // 1. Create File record in PENDING state
  const file = await prisma.file.create({
    data: {
      id: fileId,
      name: cleanName,
      mimeType: cleanMime,
      size: BigInt(data.size),
      storageKey,
      status: 'PENDING',
      ownerId,
      folderId: data.folderId ?? null,
    },
  });

  let multipartUploadId: string | undefined;

  try {
    // 2. Initiate multipart upload in MinIO
    const result = await storageClient.send(
      new CreateMultipartUploadCommand({
        Bucket: config.MINIO_BUCKET,
        Key: storageKey,
        ContentType: cleanMime,
      })
    );

    if (!result.UploadId) {
      throw new AppError('Failed to initialize multipart upload in storage engine.', 500);
    }

    multipartUploadId = result.UploadId;

    // 3. Save upload session in database
    const expiresAt = new Date(Date.now() + MULTIPART_EXPIRY_MINUTES * 60 * 1000);

    const session = await prisma.uploadSession.create({
      data: {
        ownerId,
        fileId,
        multipartUploadId,
        partSize: PART_SIZE,
        totalParts,
        status: 'INITIATED',
        expiresAt,
      },
    });

    return {
      fileId,
      sessionId: session.id,
      storageKey,
      partSize: PART_SIZE,
      totalParts,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    // Clean up MinIO upload if database session creation fails
    if (multipartUploadId) {
      try {
        await storageClient.send(
          new AbortMultipartUploadCommand({
            Bucket: config.MINIO_BUCKET,
            Key: storageKey,
            UploadId: multipartUploadId,
          })
        );
      } catch (cleanupError) {
        console.error('Multipart cleanup failed during initialization failure:', cleanupError);
      }
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'FAILED' },
    });

    throw error;
  }
}

/**
 * 4. Generate presigned part URLs.
 * Supports requesting specific part numbers or all parts.
 * Does NOT mark the upload as in progress merely because URLs were generated.
 */
export async function generatePartUploadUrls(
  ownerId: string,
  fileId: string,
  partNumbers?: number[]
) {
  const session = await prisma.uploadSession.findFirst({
    where: {
      fileId,
      ownerId,
      status: {
        in: ['INITIATED', 'IN_PROGRESS'],
      },
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      file: true,
    },
  });

  if (!session) {
    throw new AppError('Active upload session not found or session has expired.', 404);
  }

  // Determine which parts to sign
  let partsToGenerate: number[] = [];
  if (Array.isArray(partNumbers) && partNumbers.length > 0) {
    // Validate requested part numbers
    for (const num of partNumbers) {
      if (!Number.isInteger(num) || num < 1 || num > session.totalParts) {
        throw new AppError(
          `Invalid part number: ${num}. Must be an integer between 1 and ${session.totalParts}.`,
          400
        );
      }
    }
    partsToGenerate = Array.from(new Set(partNumbers)).sort((a, b) => a - b);
  } else {
    partsToGenerate = Array.from({ length: session.totalParts }, (_, i) => i + 1);
  }

  const urls = await Promise.all(
    partsToGenerate.map(async (partNumber) => {
      const command = new UploadPartCommand({
        Bucket: config.MINIO_BUCKET,
        Key: session.file.storageKey!,
        UploadId: session.multipartUploadId,
        PartNumber: partNumber,
      });

      const uploadUrl = await getSignedUrl(storageClient, command, {
        expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
      });

      return {
        partNumber,
        uploadUrl,
      };
    })
  );

  return {
    fileId,
    sessionId: session.id,
    partSize: session.partSize,
    totalParts: session.totalParts,
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    urls,
  };
}

/**
 * 5. Complete multipart upload.
 * Validates parts, completes in MinIO, verifies with HeadObject, and updates DB in a transaction.
 */
export async function completeMultipartUpload(
  ownerId: string,
  fileId: string,
  parts: UploadedPartDTO[]
) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
    include: { uploadSession: true },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  // Idempotent handling for duplicate completions
  if (file.status === 'UPLOADED') {
    return {
      fileId,
      status: 'UPLOADED',
      name: file.name,
      size: Number(file.size),
      message: 'Upload already completed.',
    };
  }

  const session = file.uploadSession;
  if (!session) {
    throw new AppError('No upload session associated with this file.', 404);
  }

  if (session.status === 'ABORTED' || session.status === 'FAILED') {
    throw new AppError(`Cannot complete upload session with status: ${session.status}`, 400);
  }

  if (session.expiresAt < new Date()) {
    await prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: 'FAILED' },
    });
    throw new AppError('Upload session has expired. Please initiate a new upload.', 400);
  }

  if (!Array.isArray(parts) || parts.length !== session.totalParts) {
    throw new AppError(
      `Invalid parts list. Expected ${session.totalParts} parts, received ${parts?.length || 0}.`,
      400
    );
  }

  // Sort parts by PartNumber ascending (required by S3)
  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

  // Validate every part from 1 to totalParts is present without duplicates
  const seenParts = new Set<number>();
  for (let i = 0; i < sortedParts.length; i++) {
    const p = sortedParts[i];
    const expectedPartNumber = i + 1;

    if (!p || typeof p.PartNumber !== 'number' || p.PartNumber !== expectedPartNumber) {
      throw new AppError(`Missing or out-of-order part number. Expected part ${expectedPartNumber}.`, 400);
    }

    if (seenParts.has(p.PartNumber)) {
      throw new AppError(`Duplicate part number detected: ${p.PartNumber}`, 400);
    }
    seenParts.add(p.PartNumber);

    if (!p.ETag || typeof p.ETag !== 'string' || !p.ETag.trim()) {
      throw new AppError(`Missing ETag for part ${p.PartNumber}.`, 400);
    }
  }

  // Ensure ETags are properly formatted with quotes for S3
  const formattedParts = sortedParts.map((p) => ({
    PartNumber: p.PartNumber,
    ETag: p.ETag.trim().startsWith('"') ? p.ETag.trim() : `"${p.ETag.trim()}"`,
  }));

  try {
    // 1. Complete multipart upload in MinIO
    await storageClient.send(
      new CompleteMultipartUploadCommand({
        Bucket: config.MINIO_BUCKET,
        Key: file.storageKey!,
        UploadId: session.multipartUploadId,
        MultipartUpload: {
          Parts: formattedParts,
        },
      })
    );

    // 2. Verify resulting object with HeadObject
    const headObject = await storageClient.send(
      new HeadObjectCommand({
        Bucket: config.MINIO_BUCKET,
        Key: file.storageKey!,
      })
    );

    const actualSize = Number(headObject.ContentLength);
    const expectedSize = Number(file.size);

    if (actualSize !== expectedSize) {
      throw new AppError(
        `Final object size mismatch. Expected ${expectedSize} bytes, got ${actualSize} bytes.`,
        400
      );
    }

    // 3. Update File and UploadSession in database transaction
    await prisma.$transaction([
      prisma.file.update({
        where: { id: fileId },
        data: {
          status: 'UPLOADED',
          checksum: headObject.ETag?.replace(/"/g, '') || null,
        },
      }),
      prisma.uploadSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
        },
      }),
    ]);

    // Atomically increment user's storage quota usage
    await recordUploadCompleted(ownerId, actualSize);

    // Dispatch asynchronous thumbnail generation for images
    if (file.mimeType.startsWith('image/')) {
        await dispatchFileProcessingJob({
        fileId: file.id,
        storageKey: file.storageKey!,
        mimeType: file.mimeType,
        ownerId,
      });
    }
    return {
      fileId,
      status: 'UPLOADED',
      name: file.name,
      size: actualSize,
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error('Error completing multipart upload:', error);
    throw new AppError(`Failed to complete multipart upload: ${error.message || 'Storage error'}`, 500);
  }
}

/**
 * 6. Abort multipart upload.
 * Aborts MinIO upload, marks session ABORTED, and marks File FAILED.
 */
export async function abortMultipartUpload(ownerId: string, fileId: string) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
    include: { uploadSession: true },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  const session = file.uploadSession;
  if (!session) {
    throw new AppError('No upload session found for this file.', 404);
  }

  // Idempotent: already aborted
  if (session.status === 'ABORTED') {
    return {
      fileId,
      sessionId: session.id,
      status: 'ABORTED',
      message: 'Upload session already aborted.',
    };
  }

  if (session.status === 'COMPLETED' || file.status === 'UPLOADED') {
    throw new AppError('Cannot abort an upload that has already completed.', 400);
  }

  try {
    // Abort MinIO multipart upload
    await storageClient.send(
      new AbortMultipartUploadCommand({
        Bucket: config.MINIO_BUCKET,
        Key: file.storageKey!,
        UploadId: session.multipartUploadId,
      })
    );
  } catch (err: any) {
    // If MinIO already cleaned it up or doesn't know the uploadId, proceed with DB update
    console.warn(`MinIO abort command returned notice for ${session.multipartUploadId}:`, err.message);
  }

  await prisma.$transaction([
    prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: 'ABORTED' },
    }),
    prisma.file.update({
      where: { id: fileId },
      data: { status: 'FAILED' },
    }),
  ]);

  return {
    fileId,
    sessionId: session.id,
    status: 'ABORTED',
  };
}

/**
 * 7. Get Upload Session Status and Resume Information.
 * Discovers uploaded parts directly from MinIO using ListPartsCommand.
 */
export async function getUploadSessionStatus(ownerId: string, fileId: string) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
    include: { uploadSession: true },
  });

  if (!file || !file.uploadSession) {
    throw new AppError('Active upload session not found.', 404);
  }

  const session = file.uploadSession;
  const isExpired = session.expiresAt < new Date();

  // If session is already completed or aborted
  if (session.status === 'COMPLETED' || session.status === 'ABORTED') {
    return {
      fileId,
      sessionId: session.id,
      status: session.status,
      partSize: session.partSize,
      totalParts: session.totalParts,
      expiresAt: session.expiresAt.toISOString(),
      isExpired,
      uploadedParts: [],
      missingPartNumbers: [],
    };
  }

  // Query MinIO for already uploaded parts
  let minioParts: { PartNumber: number; ETag: string; Size: number }[] = [];
  try {
    const listResult = await storageClient.send(
      new ListPartsCommand({
        Bucket: config.MINIO_BUCKET,
        Key: file.storageKey!,
        UploadId: session.multipartUploadId,
      })
    );

    if (listResult.Parts) {
      minioParts = listResult.Parts.map((p) => ({
        PartNumber: p.PartNumber!,
        ETag: p.ETag?.replace(/"/g, '') || '',
        Size: p.Size || 0,
      }));
    }
  } catch (err: any) {
    console.warn('Could not query MinIO ListParts:', err.message);
  }

  // Update session status to IN_PROGRESS if at least one part exists in MinIO and status was INITIATED
  if (minioParts.length > 0 && session.status === 'INITIATED') {
    await prisma.uploadSession.update({
      where: { id: session.id },
      data: { status: 'IN_PROGRESS' },
    });
    session.status = 'IN_PROGRESS';
  }

  const uploadedPartNumbers = new Set(minioParts.map((p) => p.PartNumber));
  const missingPartNumbers: number[] = [];

  for (let p = 1; p <= session.totalParts; p++) {
    if (!uploadedPartNumbers.has(p)) {
      missingPartNumbers.push(p);
    }
  }

  return {
    fileId,
    sessionId: session.id,
    status: isExpired ? 'FAILED' : session.status,
    partSize: session.partSize,
    totalParts: session.totalParts,
    expiresAt: session.expiresAt.toISOString(),
    isExpired,
    uploadedParts: minioParts.map((p) => ({
      PartNumber: p.PartNumber,
      ETag: p.ETag,
    })),
    missingPartNumbers,
  };
}

/**
 * 8. Cleanup job for expired upload sessions.
 */
export async function cleanupExpiredUploadSessions(): Promise<number> {
  const expiredSessions = await prisma.uploadSession.findMany({
    where: {
      status: { in: ['INITIATED', 'IN_PROGRESS'] },
      expiresAt: { lt: new Date() },
    },
    include: { file: true },
    take: 50,
  });

  let cleanedCount = 0;

  for (const session of expiredSessions) {
    try {
      if (session.file?.storageKey && session.multipartUploadId) {
        await storageClient.send(
          new AbortMultipartUploadCommand({
            Bucket: config.MINIO_BUCKET,
            Key: session.file.storageKey,
            UploadId: session.multipartUploadId,
          })
        );
      }
    } catch {
      // Ignore MinIO errors during cleanup
    }

    try {
      await prisma.$transaction([
        prisma.uploadSession.update({
          where: { id: session.id },
          data: { status: 'FAILED' },
        }),
        prisma.file.update({
          where: { id: session.fileId },
          data: { status: 'FAILED' },
        }),
      ]);
      cleanedCount++;
    } catch (dbError) {
      console.error(`Failed to update expired session ${session.id}:`, dbError);
    }
  }

  return cleanedCount;
}
