import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { invalidateCache } from '../utils/cache';

export const DEFAULT_STORAGE_LIMIT = BigInt(5 * 1024 * 1024 * 1024); // 5 GB

/**
 * 1. Pre-flight Quota Check:
 * Ensures (user.storageUsed + pendingUploadBytes + incomingBytes) <= user.storageLimit.
 * Protects S3 bandwidth and storage abuse before any presigned URLs are issued.
 */
export async function verifyStorageQuota(
  userId: string,
  incomingBytes: number
): Promise<{ storageUsed: number; storageLimit: number; remainingBytes: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      storageUsed: true,
      storageLimit: true,
    },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // 15-minute window for active pending uploads to prevent concurrent over-commit
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const pendingAggregate = await prisma.file.aggregate({
    where: {
      ownerId: userId,
      status: 'PENDING',
      createdAt: { gte: fifteenMinutesAgo },
    },
    _sum: {
      size: true,
    },
  });

  const pendingBytes = pendingAggregate._sum.size ? BigInt(pendingAggregate._sum.size) : BigInt(0);
  const currentUsed = BigInt(user.storageUsed);
  const limit = BigInt(user.storageLimit || DEFAULT_STORAGE_LIMIT);
  const requested = BigInt(incomingBytes);

  const projectedUsed = currentUsed + pendingBytes + requested;

  if (projectedUsed > limit) {
    const remaining = Math.max(0, Number(limit - currentUsed));
    const remainingMB = (remaining / (1024 * 1024)).toFixed(1);
    const requestedMB = (incomingBytes / (1024 * 1024)).toFixed(1);
    throw new AppError(
      `Storage quota exceeded. You have ${remainingMB} MB remaining, but the requested upload requires ${requestedMB} MB.`,
      403,
      'STORAGE_QUOTA_EXCEEDED'
    );
  }

  return {
    storageUsed: Number(currentUsed),
    storageLimit: Number(limit),
    remainingBytes: Number(limit - projectedUsed),
  };
}

/**
 * 2. Record Upload Completed:
 * Atomically increments User.storageUsed and flushes Redis storage cache.
 */
export async function recordUploadCompleted(
  userId: string,
  fileSizeBytes: number | bigint
): Promise<number> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: {
        increment: BigInt(fileSizeBytes),
      },
    },
    select: {
      storageUsed: true,
    },
  });

  await invalidateCache(`cache:storage:summary:${userId}`);
  return Number(updatedUser.storageUsed);
}

/**
 * 3. Record Files Deleted:
 * Atomically decrements User.storageUsed (safely guarded against negative values).
 */
export async function recordFilesDeleted(
  userId: string,
  totalBytesDeleted: number | bigint
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true },
  });

  const current = user ? BigInt(user.storageUsed) : BigInt(0);
  const toDelete = BigInt(totalBytesDeleted);
  const newUsed = current > toDelete ? current - toDelete : BigInt(0);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: newUsed,
    },
    select: {
      storageUsed: true,
    },
  });

  await invalidateCache(`cache:storage:summary:${userId}`);
  return Number(updatedUser.storageUsed);
}

/**
 * 4. Self-Healing Reconciliation:
 * Recomputes actual usage from all verified UPLOADED files in the database and updates User.storageUsed.
 */
export async function reconcileUserStorage(userId: string): Promise<number> {
  const aggregate = await prisma.file.aggregate({
    where: {
      ownerId: userId,
      status: 'UPLOADED',
    },
    _sum: {
      size: true,
    },
  });

  const actualUsed = aggregate._sum.size ? BigInt(aggregate._sum.size) : BigInt(0);

  await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: actualUsed,
    },
  });

  await invalidateCache(`cache:storage:summary:${userId}`);
  return Number(actualUsed);
}

