import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../lib/prisma';
import { storageClient } from '../lib/storage';
import { config } from '../config/env';
import { AppError } from '../utils/errors';
import {
  FileCategory,
  FileListQueryDTO,
  FileResponseDTO,
  StorageSummaryDTO,
} from '../types/file.types';
import { getOrSetCache, invalidateCacheByPattern } from '../utils/cache';
import { recordFilesDeleted } from './quota.service';

const DEFAULT_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB Free Tier

// Invalidate file and folder cache for the user
async function invalidateUserCache(ownerId: string): Promise<void> {
  await invalidateCacheByPattern(`cache:folder:*:${ownerId}*`);
  await invalidateCacheByPattern(`cache:file:*:${ownerId}*`);
  await invalidateCacheByPattern(`cache:storage:*:${ownerId}*`);
}

/**
  * Resolves file category based on MIME type and file extension.
  */
export function getFileCategory(mimeType: string, filename: string): FileCategory {
  const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || '' : '';

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';

  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('officedocument') ||
    mimeType.includes('msword') ||
    mimeType.includes('ms-excel') ||
    mimeType.includes('ms-powerpoint') ||
    ['pdf', 'txt', 'md', 'csv', 'json', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)
  ) {
    return 'document';
  }

  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'archive';
  }

  if (
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'html', 'css', 'sql', 'json'].includes(ext)
  ) {
    return 'code';
  }

  return 'other';
}

/**
 * Formats a Prisma File record into a client-safe FileResponseDTO (handles BigInt -> Number).
 */
export function formatFileResponse(file: any): FileResponseDTO {
  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : '';

  return {
    id: file.id,
    name: file.name,
    extension: ext,
    mimeType: file.mimeType,
    category: getFileCategory(file.mimeType, file.name),
    size: Number(file.size),
    status: file.status,
    folderId: file.folderId,
    hasThumbnail: Boolean(file.thumbnailKey),
    thumbnailKey: file.thumbnailKey || null,
    isStarred: Boolean(file.isStarred),
    isTrashed: Boolean(file.isTrashed),
    trashedAt: file.trashedAt ? new Date(file.trashedAt).toISOString() : null,
    createdAt: new Date(file.createdAt).toISOString(),
    updatedAt: new Date(file.updatedAt).toISOString(),
  };
}

/**
 * Validates a file name for invalid characters and length.
 */
export function validateFileName(rawName: string | undefined | null): string {
  if (typeof rawName !== 'string') {
    throw new AppError('File name is required.', 400);
  }

  const name = rawName.trim();
  if (name.length < 1) {
    throw new AppError('File name cannot be empty.', 400);
  }
  if (name.length > 255) {
    throw new AppError('File name cannot exceed 255 characters.', 400);
  }
  if (/[/\\:\0]/.test(name)) {
    throw new AppError('File name cannot contain slashes or colons.', 400);
  }

  return name;
}

/**
 * 1. Query files with filtering, searching, and sorting.
 */
export async function getFiles(ownerId: string, query: FileListQueryDTO): Promise<FileResponseDTO[]> {
  const whereClause: any = {
    ownerId,
    status: 'UPLOADED',
  };

  // Trash filter: default to non-trashed files unless specifically requested
  if (typeof query.isTrashed === 'boolean') {
    whereClause.isTrashed = query.isTrashed;
  } else {
    whereClause.isTrashed = false;
  }

  // Starred filter
  if (typeof query.isStarred === 'boolean') {
    whereClause.isStarred = query.isStarred;
  }

  // Folder filter:
  // - undefined or 'all': no folder constraint
  // - 'root' or null: only root files (folderId === null)
  // - specific folder UUID: folderId === UUID
  if (query.folderId === 'root' || query.folderId === null) {
    whereClause.folderId = null;
  } else if (query.folderId && query.folderId !== 'all') {
    whereClause.folderId = query.folderId;
  }

  // Search filter
  if (query.search && query.search.trim().length > 0) {
    whereClause.name = {
      contains: query.search.trim(),
      mode: 'insensitive',
    };
  }

  // Sorting
  let orderBy: any = { createdAt: 'desc' };
  const sortDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';

  if (query.sortBy === 'name') {
    orderBy = { name: sortDirection };
  } else if (query.sortBy === 'size') {
    orderBy = { size: sortDirection };
  } else if (query.sortBy === 'date') {
    orderBy = { createdAt: sortDirection };
  }

  const files = await prisma.file.findMany({
    where: whereClause,
    orderBy,
    take: query.limit || 200,
    skip: query.offset || 0,
  });

  let formatted = files.map(formatFileResponse);

  // Category filter (in-memory, mapped from MIME / ext)
  if (query.category && query.category !== 'all') {
    formatted = formatted.filter((f) => f.category === query.category);
  }

  return formatted;
}

/**
 * 2. Get single file details.
 */
export async function getFileById(ownerId: string, fileId: string): Promise<FileResponseDTO> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  return formatFileResponse(file);
}

/**
 * 3. Generate presigned download URL (attachment disposition).
 * Valid for 15 minutes (900s).
 */
export async function getDownloadUrl(ownerId: string, fileId: string): Promise<{ downloadUrl: string; filename: string }> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  if (file.status !== 'UPLOADED' || !file.storageKey) {
    throw new AppError('File has not completed uploading yet.', 400);
  }

  const cleanName = file.name.replace(/["\r\n]/g, '_');
  const encodedName = encodeURIComponent(cleanName);

  const command = new GetObjectCommand({
    Bucket: config.MINIO_BUCKET,
    Key: file.storageKey,
    ResponseContentDisposition: `attachment; filename="${cleanName}"; filename*=UTF-8''${encodedName}`,
    ResponseContentType: file.mimeType,
  });

  const downloadUrl = await getSignedUrl(storageClient, command, { expiresIn: 900 });

  return {
    downloadUrl,
    filename: file.name,
  };
}

/**
 * 4. Generate presigned streaming/preview URL (inline disposition).
 * Allows direct browser playback of video, audio, PDFs, and high-res images.
 * Valid for 15 minutes (900s).
 */
export async function getPreviewUrl(
  ownerId: string,
  fileId: string
): Promise<{ previewUrl: string; mimeType: string; filename: string; category: FileCategory }> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  if (file.status !== 'UPLOADED' || !file.storageKey) {
    throw new AppError('File has not completed uploading yet.', 400);
  }

  const cleanName = file.name.replace(/["\r\n]/g, '_');
  const encodedName = encodeURIComponent(cleanName);

  const command = new GetObjectCommand({
    Bucket: config.MINIO_BUCKET,
    Key: file.storageKey,
    ResponseContentDisposition: `inline; filename="${cleanName}"; filename*=UTF-8''${encodedName}`,
    ResponseContentType: file.mimeType,
  });

  const previewUrl = await getSignedUrl(storageClient, command, { expiresIn: 900 });

  return {
    previewUrl,
    mimeType: file.mimeType,
    filename: file.name,
    category: getFileCategory(file.mimeType, file.name),
  };
}

/**
 * 4b. Generate presigned thumbnail URL.
 * Valid for 1 hour (3600s).
 */
export async function getThumbnailUrl(
  ownerId: string,
  fileId: string
): Promise<{ thumbnailUrl: string }> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  if (!file.thumbnailKey) {
    throw new AppError('No thumbnail available for this file.', 404);
  }

  const command = new GetObjectCommand({
    Bucket: config.MINIO_BUCKET,
    Key: file.thumbnailKey,
    ResponseContentType: 'image/webp',
    ResponseContentDisposition: 'inline',
  });

  const thumbnailUrl = await getSignedUrl(storageClient, command, { expiresIn: 3600 });
  return { thumbnailUrl };
}

/**
 * 5. Rename file with sibling collision prevention in the same folder.
 */
export async function renameFile(ownerId: string, fileId: string, rawNewName: string): Promise<FileResponseDTO> {
  const newName = validateFileName(rawNewName);

  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  if (file.name === newName) {
    return formatFileResponse(file);
  }

  // Check sibling collision
  const collision = await prisma.file.findFirst({
    where: {
      ownerId,
      folderId: file.folderId,
      name: newName,
      isTrashed: false,
      id: { not: fileId },
    },
  });

  if (collision) {
    throw new AppError('A file with this name already exists in this folder.', 409);
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: { name: newName },
  });

  await invalidateUserCache(ownerId);
  return formatFileResponse(updatedFile);
}

/**
 * 6. Move file to another folder (or root).
 */
export async function moveFile(
  ownerId: string,
  fileId: string,
  targetFolderId: string | null
): Promise<FileResponseDTO> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  // Validate target folder if not root
  if (targetFolderId !== null) {
    const targetFolder = await prisma.folder.findFirst({
      where: { id: targetFolderId, ownerId, isTrashed: false },
    });

    if (!targetFolder) {
      throw new AppError('Destination folder not found or is in trash.', 404);
    }
  }

  // Prevent moving to the same folder
  if (file.folderId === targetFolderId) {
    return formatFileResponse(file);
  }

  // Check sibling collision in target folder
  const collision = await prisma.file.findFirst({
    where: {
      ownerId,
      folderId: targetFolderId,
      name: file.name,
      isTrashed: false,
      id: { not: fileId },
    },
  });

  if (collision) {
    throw new AppError('A file with this name already exists in the destination folder.', 409);
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: { folderId: targetFolderId },
  });

  await invalidateUserCache(ownerId);
  return formatFileResponse(updatedFile);
}

/**
 * 7. Soft delete (trash) file.
 */
export async function trashFile(ownerId: string, fileId: string): Promise<FileResponseDTO> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: {
      isTrashed: true,
      trashedAt: new Date(),
    },
  });

  await invalidateUserCache(ownerId);
  return formatFileResponse(updatedFile);
}

/**
 * 8. Restore file from trash.
 */
export async function restoreFile(ownerId: string, fileId: string): Promise<FileResponseDTO> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  // If parent folder is trashed or was deleted, reparent to root
  let targetFolderId = file.folderId;
  if (targetFolderId) {
    const parent = await prisma.folder.findFirst({
      where: { id: targetFolderId, ownerId },
    });
    if (!parent || parent.isTrashed) {
      targetFolderId = null;
    }
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: {
      isTrashed: false,
      trashedAt: null,
      folderId: targetFolderId,
    },
  });

  await invalidateUserCache(ownerId);
  return formatFileResponse(updatedFile);
}

/**
 * 9. Permanently delete file (deletes MinIO object and DB row).
 */
export async function permanentlyDeleteFile(ownerId: string, fileId: string): Promise<{ deleted: boolean; fileId: string }> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  // 1. Delete object and thumbnail from MinIO S3 bucket
  if (file.storageKey) {
    try {
      await storageClient.send(
        new DeleteObjectCommand({
          Bucket: config.MINIO_BUCKET,
          Key: file.storageKey,
        })
      );
    } catch (err: any) {
      console.warn(`[MinIO Delete Warning] Key "${file.storageKey}":`, err.message);
    }
  }

  if (file.thumbnailKey) {
    try {
      await storageClient.send(
        new DeleteObjectCommand({
          Bucket: config.MINIO_BUCKET,
          Key: file.thumbnailKey,
        })
      );
    } catch (err: any) {
      console.warn(`[MinIO Thumbnail Delete Warning] Key "${file.thumbnailKey}":`, err.message);
    }
  }

  // 2. Delete database record
  await prisma.file.delete({
    where: { id: fileId },
  });

  // 3. Atomically decrement user storage quota
  await recordFilesDeleted(ownerId, file.size);

  await invalidateUserCache(ownerId);
  return { deleted: true, fileId };
}

/**
 * 10. Star / Unstar file.
 */
export async function toggleStarFile(
  ownerId: string,
  fileId: string,
  explicitStar?: boolean
): Promise<FileResponseDTO> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId },
  });

  if (!file) {
    throw new AppError('File not found.', 404);
  }

  const newStarred = typeof explicitStar === 'boolean' ? explicitStar : !file.isStarred;

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: { isStarred: newStarred },
  });

  await invalidateUserCache(ownerId);
  return formatFileResponse(updatedFile);
}

/**
 * 11. Storage Usage Summary with Redis Caching (1 minute TTL).
 */
export async function getStorageUsageSummary(ownerId: string): Promise<StorageSummaryDTO> {
  const cacheKey = `cache:storage:summary:${ownerId}`;

  return getOrSetCache(cacheKey, 60, async () => {
    const files = await prisma.file.findMany({
      where: {
        ownerId,
        status: 'UPLOADED',
        isTrashed: false,
      },
      select: {
        size: true,
        mimeType: true,
        name: true,
      },
    });

    let totalUsedBytes = 0;
    const breakdown = {
      documents: 0,
      images: 0,
      videos: 0,
      audio: 0,
      archives: 0,
      other: 0,
    };

    for (const f of files) {
      const bytes = Number(f.size);
      totalUsedBytes += bytes;

      const cat = getFileCategory(f.mimeType, f.name);
      if (cat === 'document' || cat === 'code') {
        breakdown.documents += bytes;
      } else if (cat === 'image') {
        breakdown.images += bytes;
      } else if (cat === 'video') {
        breakdown.videos += bytes;
      } else if (cat === 'audio') {
        breakdown.audio += bytes;
      } else if (cat === 'archive') {
        breakdown.archives += bytes;
      } else {
        breakdown.other += bytes;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { storageUsed: true, storageLimit: true },
    });

    const userLimit = user ? Number(user.storageLimit) : DEFAULT_STORAGE_LIMIT_BYTES;
    const userUsed = user ? Number(user.storageUsed) : totalUsedBytes;

    const percentageUsed = Math.min(
      100,
      Number(((userUsed / userLimit) * 100).toFixed(2))
    );

    return {
      totalUsedBytes: userUsed,
      storageLimitBytes: userLimit,
      percentageUsed,
      breakdown,
      fileCount: files.length,
    };
  });
}

