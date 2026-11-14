import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../lib/prisma';
import { storageClient } from '../lib/storage';
import { config } from '../config/env';
import { AppError } from '../utils/errors';
import { getFileCategory } from './file.service';
import {
  CreateShareDTO,
  ShareResponseDTO,
  PublicShareResultDTO,
} from '../types/share.types';

/**
 * Format share record into safe API response DTO.
 */
function formatShareResponse(share: any): ShareResponseDTO {
  const isExpired = share.expiresAt ? new Date() > new Date(share.expiresAt) : false;
  const targetType = share.fileId ? 'file' : 'folder';
  const targetId = share.fileId || share.folderId || '';
  const targetName = share.file?.name || share.folder?.name || 'Untitled';

  return {
    id: share.id,
    token: share.token,
    shareUrl: `${config.CORS_ORIGIN || 'http://localhost:5173'}/s/${share.token}`,
    targetType,
    targetId,
    targetName,
    role: share.role,
    isPasswordProtected: Boolean(share.passwordHash),
    expiresAt: share.expiresAt ? new Date(share.expiresAt).toISOString() : null,
    isExpired,
    viewsCount: share.viewsCount,
    sharedWith: share.sharedWith
      ? {
          id: share.sharedWith.id,
          name: share.sharedWith.name,
          email: share.sharedWith.email,
        }
      : null,
    owner: {
      id: share.owner.id,
      name: share.owner.name,
      email: share.owner.email,
    },
    createdAt: new Date(share.createdAt).toISOString(),
    updatedAt: new Date(share.updatedAt).toISOString(),
  };
}

/**
 * 1. Create a share link (Public or direct user-to-user).
 */
export async function createShareLink(
  ownerId: string,
  dto: CreateShareDTO
): Promise<ShareResponseDTO> {
  const { fileId, folderId, sharedWithEmail, role = 'VIEW', password, expiresInDays, expiresAt } = dto;

  if (!fileId && !folderId) {
    throw new AppError('Either fileId or folderId must be provided to create a share link.', 400);
  }

  if (fileId && folderId) {
    throw new AppError('Cannot share both a file and a folder in the same share link.', 400);
  }

  // 1. Verify existence & ownership of target
  if (fileId) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId, isTrashed: false },
    });
    if (!file) {
      throw new AppError('File not found or has been moved to trash.', 404);
    }
  }

  if (folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, ownerId, isTrashed: false },
    });
    if (!folder) {
      throw new AppError('Folder not found or has been moved to trash.', 404);
    }
  }

  // 2. Direct user sharing target (optional)
  let sharedWithUserId: string | null = null;
  if (sharedWithEmail) {
    const targetUser = await prisma.user.findUnique({
      where: { email: sharedWithEmail.trim().toLowerCase() },
    });
    if (!targetUser) {
      throw new AppError(`Target user with email "${sharedWithEmail}" not found.`, 404);
    }
    if (targetUser.id === ownerId) {
      throw new AppError('You cannot share an asset with yourself.', 400);
    }
    sharedWithUserId = targetUser.id;
  }

  // 3. Cryptographic Token Generation (32-character hex)
  const token = crypto.randomBytes(16).toString('hex');

  // 4. Optional Password Hashing
  let passwordHash: string | null = null;
  if (password && password.trim().length > 0) {
    if (password.length < 4) {
      throw new AppError('Share password must be at least 4 characters long.', 400);
    }
    passwordHash = await bcrypt.hash(password, 10);
  }

  // 5. Expiration Calculation
  let calculatedExpiresAt: Date | null = null;
  if (expiresInDays && expiresInDays > 0) {
    calculatedExpiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  } else if (expiresAt) {
    calculatedExpiresAt = new Date(expiresAt);
    if (isNaN(calculatedExpiresAt.getTime()) || calculatedExpiresAt <= new Date()) {
      throw new AppError('Expiration date must be a valid future date.', 400);
    }
  }

  // 6. Persist Share Record
  const newShare = await prisma.share.create({
    data: {
      token,
      fileId: fileId || null,
      folderId: folderId || null,
      ownerId,
      sharedWithId: sharedWithUserId,
      role,
      passwordHash,
      expiresAt: calculatedExpiresAt,
    },
    include: {
      file: true,
      folder: true,
      owner: { select: { id: true, name: true, email: true } },
      sharedWith: { select: { id: true, name: true, email: true } },
    },
  });

  return formatShareResponse(newShare);
}

/**
 * 2. Access a Public Share Link (Handles token lookup, expiry, password checks, telemetry, and presigned URLs).
 */
export async function getPublicShare(
  token: string,
  providedPassword?: string
): Promise<PublicShareResultDTO> {
  const share = await prisma.share.findUnique({
    where: { token },
    include: {
      file: true,
      folder: true,
      owner: { select: { id: true, name: true } },
    },
  });

  if (!share) {
    throw new AppError('Share link not found or has been revoked.', 404);
  }

  // Check Expiration
  if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
    throw new AppError('This share link has expired.', 410);
  }

  const targetType = share.fileId ? 'file' : 'folder';
  const targetName = share.file?.name || share.folder?.name || 'Untitled';

  // Check Password Protection
  if (share.passwordHash) {
    if (!providedPassword) {
      return {
        requiresPassword: true,
        isExpired: false,
        targetType,
        targetName,
        owner: { name: share.owner.name },
      };
    }

    const isPasswordValid = await bcrypt.compare(providedPassword, share.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Incorrect share password.', 401);
    }
  }

  // Atomically increment views count
  await prisma.share.update({
    where: { id: share.id },
    data: { viewsCount: { increment: 1 } },
  });

  // Handle Shared File
  if (share.fileId && share.file) {
    if (share.file.isTrashed || share.file.status !== 'UPLOADED' || !share.file.storageKey) {
      throw new AppError('The requested file is no longer accessible.', 404);
    }

    const cleanName = share.file.name.replace(/["\r\n]/g, '_');
    const encodedName = encodeURIComponent(cleanName);

    // Download URL (attachment)
    const downloadCommand = new GetObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: share.file.storageKey,
      ResponseContentDisposition: `attachment; filename="${cleanName}"; filename*=UTF-8''${encodedName}`,
      ResponseContentType: share.file.mimeType,
    });
    const downloadUrl = await getSignedUrl(storageClient, downloadCommand, { expiresIn: 3600 });

    // Preview URL (inline streaming)
    const previewCommand = new GetObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: share.file.storageKey,
      ResponseContentDisposition: 'inline',
      ResponseContentType: share.file.mimeType,
    });
    const previewUrl = await getSignedUrl(storageClient, previewCommand, { expiresIn: 3600 });

    // Thumbnail URL (if available)
    let thumbnailUrl: string | null = null;
    if (share.file.thumbnailKey) {
      const thumbCommand = new GetObjectCommand({
        Bucket: config.MINIO_BUCKET,
        Key: share.file.thumbnailKey,
        ResponseContentDisposition: 'inline',
        ResponseContentType: 'image/webp',
      });
      thumbnailUrl = await getSignedUrl(storageClient, thumbCommand, { expiresIn: 3600 });
    }

    return {
      requiresPassword: false,
      isExpired: false,
      targetType: 'file',
      targetName: share.file.name,
      role: share.role,
      viewsCount: share.viewsCount + 1,
      createdAt: share.createdAt.toISOString(),
      expiresAt: share.expiresAt ? share.expiresAt.toISOString() : null,
      owner: { name: share.owner.name },
      file: {
        id: share.file.id,
        name: share.file.name,
        size: Number(share.file.size), // BigInt sanitization
        mimeType: share.file.mimeType,
        category: getFileCategory(share.file.mimeType, share.file.name),
        downloadUrl,
        previewUrl,
        thumbnailUrl,
        updatedAt: share.file.updatedAt.toISOString(),
      },
    };
  }

  // Handle Shared Folder
  if (share.folderId && share.folder) {
    if (share.folder.isTrashed) {
      throw new AppError('The requested folder is no longer accessible.', 404);
    }

    const files = await prisma.file.findMany({
      where: {
        folderId: share.folder.id,
        isTrashed: false,
        status: 'UPLOADED',
      },
      orderBy: { createdAt: 'desc' },
    });

    const subfolders = await prisma.folder.findMany({
      where: {
        parentId: share.folder.id,
        isTrashed: false,
      },
      orderBy: { name: 'asc' },
    });

    return {
      requiresPassword: false,
      isExpired: false,
      targetType: 'folder',
      targetName: share.folder.name,
      role: share.role,
      viewsCount: share.viewsCount + 1,
      createdAt: share.createdAt.toISOString(),
      expiresAt: share.expiresAt ? share.expiresAt.toISOString() : null,
      owner: { name: share.owner.name },
      folder: {
        id: share.folder.id,
        name: share.folder.name,
        files: files.map((f) => ({
          id: f.id,
          name: f.name,
          size: Number(f.size), // BigInt sanitization
          mimeType: f.mimeType,
          category: getFileCategory(f.mimeType, f.name),
          updatedAt: f.updatedAt.toISOString(),
        })),
        subfolders: subfolders.map((sf) => ({
          id: sf.id,
          name: sf.name,
          updatedAt: sf.updatedAt.toISOString(),
        })),
      },
    };
  }

  throw new AppError('Share target is invalid.', 400);
}

/**
 * 3. Get all files and folders shared directly with the authenticated user ("Shared With Me").
 */
export async function getSharedWithMe(userId: string): Promise<ShareResponseDTO[]> {
  const shares = await prisma.share.findMany({
    where: {
      sharedWithId: userId,
    },
    include: {
      file: true,
      folder: true,
      owner: { select: { id: true, name: true, email: true } },
      sharedWith: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter out any where target asset is trashed
  const validShares = shares.filter((s) => {
    if (s.file && s.file.isTrashed) return false;
    if (s.folder && s.folder.isTrashed) return false;
    return true;
  });

  return validShares.map(formatShareResponse);
}

/**
 * 4. Get all active share links created by the authenticated user.
 */
export async function getMyCreatedShares(ownerId: string): Promise<ShareResponseDTO[]> {
  const shares = await prisma.share.findMany({
    where: { ownerId },
    include: {
      file: true,
      folder: true,
      owner: { select: { id: true, name: true, email: true } },
      sharedWith: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return shares.map(formatShareResponse);
}

/**
 * 5. Revoke / Delete a share link.
 */
export async function revokeShare(ownerId: string, shareId: string): Promise<{ revoked: boolean }> {
  const share = await prisma.share.findFirst({
    where: { id: shareId, ownerId },
  });

  if (!share) {
    throw new AppError('Share link not found or you do not have permission to revoke it.', 404);
  }

  await prisma.share.delete({
    where: { id: shareId },
  });

  return { revoked: true };
}
