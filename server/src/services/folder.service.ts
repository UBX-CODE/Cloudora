import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../lib/prisma';
import { storageClient } from '../lib/storage';
import { config } from '../config/env';
import { AppError } from '../utils/errors';
import {
  CreateFolderDTO,
  RenameFolderDTO,
  MoveFolderDTO,
  FolderAncestor,
  FolderStats,
} from '../types/folder.types';
import { getOrSetCache, invalidateCacheByPattern } from '../utils/cache';
import { recordFilesDeleted } from './quota.service';

const FOLDER_CACHE_TTL = 300; // 5 minutes TTL

// Helper to flush all cached folder views for this user
async function invalidateUserFolderCache(ownerId: string): Promise<void> {
  await invalidateCacheByPattern(`cache:folder:*:${ownerId}*`);
}

/**
 * Validates folder name for length, empty characters, and forbidden path characters.
 */
export function validateFolderName(rawName: string | undefined | null): string {
  if (typeof rawName !== 'string') {
    throw new AppError('Folder name is required.', 400);
  }

  const name = rawName.trim();

  if (name.length < 1) {
    throw new AppError('Folder name cannot be empty.', 400);
  }

  if (name.length > 255) {
    throw new AppError('Folder name cannot exceed 255 characters.', 400);
  }

  if (name === '.' || name === '..') {
    throw new AppError('Invalid folder name.', 400);
  }

  // Reject directory separators and null bytes
  if (/[/\\:\0]/.test(name)) {
    throw new AppError('Folder name cannot contain slashes or colons.', 400);
  }

  return name;
}

/**
 * Recursively collects all descendant folder IDs for a given folder in level order.
 */
export async function getDescendantFolderHierarchy(
  ownerId: string,
  rootFolderId: string
): Promise<{ allDescendantIds: string[]; levels: string[][] }> {
  const levels: string[][] = [];
  let currentLevel = [rootFolderId];

  while (currentLevel.length > 0) {
    const children = await prisma.folder.findMany({
      where: {
        ownerId,
        parentId: { in: currentLevel },
      },
      select: { id: true },
    });

    if (children.length === 0) break;

    const nextLevel = children.map((c) => c.id);
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    allDescendantIds: levels.flat(),
    levels,
  };
}

/**
 * Checks if candidateDescendantId is inside ancestorId's subtree.
 * Walks UP from candidateDescendantId to avoid scanning entire trees.
 */
export async function isDescendantFolder(
  ownerId: string,
  ancestorId: string,
  candidateDescendantId: string
): Promise<boolean> {
  if (ancestorId === candidateDescendantId) {
    return true;
  }

  let currentId: string | null = candidateDescendantId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

    const parentRecord: { parentId: string | null } | null = await prisma.folder.findFirst({
      where: { id: currentId, ownerId },
      select: { parentId: true },
    });

    if (!parentRecord) break;
    if (parentRecord.parentId === ancestorId) {
      return true;
    }

    currentId = parentRecord.parentId;
  }

  return false;
}

/**
 * 1. Create a new folder.
 */
export async function createFolder(ownerId: string, dto: CreateFolderDTO) {
  const name = validateFolderName(dto.name);
  const parentId = dto.parentId || null;

  // Validate parent folder if provided
  if (parentId) {
    const parentFolder = await prisma.folder.findFirst({
      where: {
        id: parentId,
        ownerId,
        isTrashed: false,
      },
    });

    if (!parentFolder) {
      throw new AppError('Parent folder not found.', 404);
    }
  }

  // Check duplicate folder name under the same parent
  const existingFolder = await prisma.folder.findFirst({
    where: {
      ownerId,
      parentId,
      name: { equals: name, mode: 'insensitive' },
      isTrashed: false,
    },
  });

  if (existingFolder) {
    throw new AppError('A folder with this name already exists in this location.', 409);
  }

  const folder = await prisma.folder.create({
    data: {
      name,
      ownerId,
      parentId,
    },
  });

  // Invalidate cached views for this user
  await invalidateUserFolderCache(ownerId);

  return folder;
}

/**
 * 2. Get Root Folders (folders with parentId = null).
 */
export async function getRootFolders(ownerId: string) {
  const cacheKey = `cache:folder:root:${ownerId}`;

  return getOrSetCache(cacheKey, FOLDER_CACHE_TTL, async () => {
    return prisma.folder.findMany({
      where: {
        ownerId,
        parentId: null,
        isTrashed: false,
      },
      include: {
        _count: {
          select: {
            children: { where: { isTrashed: false } },
            files: { where: { isTrashed: false } },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  });
}

/**
 * 3. Get Subfolders by Parent ID.
 */
export async function getSubfoldersByParentId(ownerId: string, parentId: string) {
  // Validate parent existence and ownership first
  const parent = await prisma.folder.findFirst({
    where: {
      id: parentId,
      ownerId,
      isTrashed: false,
    },
  });

  if (!parent) {
    throw new AppError('Parent folder not found.', 404);
  }

  const cacheKey = `cache:folder:subfolders:${ownerId}:${parentId}`;

  return getOrSetCache(cacheKey, FOLDER_CACHE_TTL, async () => {
    return prisma.folder.findMany({
      where: {
        ownerId,
        parentId,
        isTrashed: false,
      },
      include: {
        _count: {
          select: {
            children: { where: { isTrashed: false } },
            files: { where: { isTrashed: false } },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  });
}

/**
 * 4. Get Folder Details with Breadcrumb Ancestors.
 */
export async function getFolderDetails(ownerId: string, folderId: string) {
  const cacheKey = `cache:folder:details:${ownerId}:${folderId}`;

  return getOrSetCache(cacheKey, FOLDER_CACHE_TTL, async () => {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId,
      },
      include: {
        _count: {
          select: {
            children: { where: { isTrashed: false } },
            files: { where: { isTrashed: false } },
          },
        },
      },
    });

    if (!folder) {
      throw new AppError('Folder not found.', 404);
    }

    // Construct breadcrumbs from root to current folder
    const ancestors: FolderAncestor[] = [];
    let currentParentId = folder.parentId;
    const visited = new Set<string>();

    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      const parentRecord: { id: string; name: string; parentId: string | null } | null = await prisma.folder.findFirst({
        where: { id: currentParentId, ownerId },
        select: { id: true, name: true, parentId: true },
      });

      if (!parentRecord) break;
      ancestors.unshift(parentRecord);
      currentParentId = parentRecord.parentId;
    }

    return {
      folder,
      ancestors,
    };
  });
}

/**
 * 5. Rename Folder.
 */
export async function renameFolder(ownerId: string, folderId: string, dto: RenameFolderDTO) {
  const newName = validateFolderName(dto.name);

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId },
  });

  if (!folder) {
    throw new AppError('Folder not found.', 404);
  }

  if (folder.isTrashed) {
    throw new AppError('Cannot rename a folder that is in trash.', 400);
  }

  if (folder.name === newName) {
    return folder;
  }

  // Check sibling name collision
  const collision = await prisma.folder.findFirst({
    where: {
      ownerId,
      parentId: folder.parentId,
      name: { equals: newName, mode: 'insensitive' },
      isTrashed: false,
      id: { not: folderId },
    },
  });

  if (collision) {
    throw new AppError('A folder with this name already exists in this location.', 409);
  }

  const updatedFolder = await prisma.folder.update({
    where: { id: folderId },
    data: { name: newName },
  });

  // Invalidate cache
  await invalidateUserFolderCache(ownerId);

  return updatedFolder;
}

/**
 * 6. Move Folder to Another Parent (with cycle detection and sibling check).
 */
export async function moveFolder(ownerId: string, folderId: string, dto: MoveFolderDTO) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId },
  });

  if (!folder) {
    throw new AppError('Folder not found.', 404);
  }

  if (folder.isTrashed) {
    throw new AppError('Cannot move a folder that is in trash.', 400);
  }

  const targetParentId = dto.targetParentId || null;

  // No-op if already in the target parent
  if (folder.parentId === targetParentId) {
    return folder;
  }

  // Target cannot be self
  if (targetParentId === folder.id) {
    throw new AppError('Cannot move a folder into itself.', 400);
  }

  // If moving into another folder (not root), validate target parent
  if (targetParentId) {
    const targetParent = await prisma.folder.findFirst({
      where: { id: targetParentId, ownerId, isTrashed: false },
    });

    if (!targetParent) {
      throw new AppError('Destination folder not found.', 404);
    }

    // Circular hierarchy prevention: target cannot be a descendant of folder
    const isCircular = await isDescendantFolder(ownerId, folderId, targetParentId);
    if (isCircular) {
      throw new AppError('Cannot move a folder into one of its subfolders.', 400);
    }
  }

  // Sibling collision check at destination
  const collision = await prisma.folder.findFirst({
    where: {
      ownerId,
      parentId: targetParentId,
      name: { equals: folder.name, mode: 'insensitive' },
      isTrashed: false,
      id: { not: folderId },
    },
  });

  if (collision) {
    throw new AppError(
      'A folder with this name already exists in the destination location.',
      409
    );
  }

  const updatedFolder = await prisma.folder.update({
    where: { id: folderId },
    data: { parentId: targetParentId },
  });

  // Invalidate cache
  await invalidateUserFolderCache(ownerId);

  return updatedFolder;
}

/**
 * 7. Move Folder to Root.
 */
export async function moveFolderToRoot(ownerId: string, folderId: string) {
  return moveFolder(ownerId, folderId, { targetParentId: null });
}

/**
 * 8. Trash Folder (Cascades to nested subfolders and files in a transaction).
 */
export async function trashFolder(ownerId: string, folderId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId },
  });

  if (!folder) {
    throw new AppError('Folder not found.', 404);
  }

  if (folder.isTrashed) {
    throw new AppError('Folder is already in trash.', 400);
  }

  const { allDescendantIds } = await getDescendantFolderHierarchy(ownerId, folderId);
  const allFolderIds = [folderId, ...allDescendantIds];
  const trashedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Soft-delete folder and all nested subfolders
    await tx.folder.updateMany({
      where: {
        id: { in: allFolderIds },
        ownerId,
      },
      data: {
        isTrashed: true,
        trashedAt,
      },
    });

    // Soft-delete all files in all these folders
    const filesUpdateResult = await tx.file.updateMany({
      where: {
        folderId: { in: allFolderIds },
        ownerId,
        isTrashed: false,
      },
      data: {
        isTrashed: true,
        trashedAt,
      },
    });

    return {
      folderId,
      isTrashed: true,
      trashedAt,
      trashedFoldersCount: allFolderIds.length,
      trashedFilesCount: filesUpdateResult.count,
    };
  });

  // Invalidate cache
  await invalidateUserFolderCache(ownerId);

  return result;
}

/**
 * 9. Restore Folder (Restores subfolders and files, reparents if parent is trashed).
 */
export async function restoreFolder(ownerId: string, folderId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId },
  });

  if (!folder) {
    throw new AppError('Folder not found.', 404);
  }

  if (!folder.isTrashed) {
    throw new AppError('Folder is not in trash.', 400);
  }

  // Check parent status: if parent is still trashed or missing, restore to root
  let targetParentId = folder.parentId;
  if (folder.parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: folder.parentId, ownerId, isTrashed: false },
    });

    if (!parent) {
      targetParentId = null;
    }
  }

  // Sibling collision check at destination
  const collision = await prisma.folder.findFirst({
    where: {
      ownerId,
      parentId: targetParentId,
      name: { equals: folder.name, mode: 'insensitive' },
      isTrashed: false,
      id: { not: folderId },
    },
  });

  if (collision) {
    throw new AppError(
      'Cannot restore folder because an active folder with the same name already exists in this location.',
      409
    );
  }

  const { allDescendantIds } = await getDescendantFolderHierarchy(ownerId, folderId);
  const allFolderIds = [folderId, ...allDescendantIds];

  const result = await prisma.$transaction(async (tx) => {
    // Restore the target folder, updating parentId if reparented to root
    const restoredFolder = await tx.folder.update({
      where: { id: folderId },
      data: {
        isTrashed: false,
        trashedAt: null,
        parentId: targetParentId,
      },
    });

    // Restore descendant folders
    if (allDescendantIds.length > 0) {
      await tx.folder.updateMany({
        where: {
          id: { in: allDescendantIds },
          ownerId,
        },
        data: {
          isTrashed: false,
          trashedAt: null,
        },
      });
    }

    // Restore files inside all restored folders
    const restoredFiles = await tx.file.updateMany({
      where: {
        folderId: { in: allFolderIds },
        ownerId,
      },
      data: {
        isTrashed: false,
        trashedAt: null,
      },
    });

    return {
      folder: restoredFolder,
      restoredFoldersCount: allFolderIds.length,
      restoredFilesCount: restoredFiles.count,
    };
  });

  // Invalidate cache
  await invalidateUserFolderCache(ownerId);

  return result;
}

/**
 * 10. Permanently Delete Folder.
 * Resolves PostgreSQL onDelete: Restrict by deleting files and subfolders in reverse level order.
 */
export async function permanentlyDeleteFolder(ownerId: string, folderId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId },
  });

  if (!folder) {
    throw new AppError('Folder not found.', 404);
  }

  const { allDescendantIds, levels } = await getDescendantFolderHierarchy(ownerId, folderId);
  const allFolderIds = [folderId, ...allDescendantIds];

  // 1. Find all files in folder hierarchy to track deleted bytes and MinIO storage keys
  const filesToDelete = await prisma.file.findMany({
    where: {
      folderId: { in: allFolderIds },
      ownerId,
    },
    select: { size: true, storageKey: true },
  });

  const totalBytesDeleted = filesToDelete.reduce(
    (sum, f) => sum + BigInt(f.size),
    BigInt(0)
  );

  // 2. Clean up MinIO S3 objects
  for (const f of filesToDelete) {
    if (f.storageKey) {
      try {
        await storageClient.send(
          new DeleteObjectCommand({
            Bucket: config.MINIO_BUCKET,
            Key: f.storageKey,
          })
        );
      } catch (err: any) {
        console.warn(`[MinIO Folder Delete Warning] Key "${f.storageKey}":`, err.message);
      }
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 3. Delete all files inside this folder hierarchy
    const filesDeleted = await tx.file.deleteMany({
      where: {
        folderId: { in: allFolderIds },
        ownerId,
      },
    });

    // 4. Delete folders in bottom-up reverse depth order (deepest children first)
    let foldersDeletedCount = 0;
    for (let i = levels.length - 1; i >= 0; i--) {
      const res = await tx.folder.deleteMany({
        where: {
          id: { in: levels[i] },
          ownerId,
        },
      });
      foldersDeletedCount += res.count;
    }

    // 5. Delete the root target folder
    await tx.folder.delete({
      where: { id: folderId },
    });
    foldersDeletedCount += 1;

    return {
      deletedFolderId: folderId,
      deletedFoldersCount: foldersDeletedCount,
      deletedFilesCount: filesDeleted.count,
    };
  });

  // 6. Atomically decrement user storage quota
  if (totalBytesDeleted > BigInt(0)) {
    await recordFilesDeleted(ownerId, totalBytesDeleted);
  }

  // Invalidate cache
  await invalidateUserFolderCache(ownerId);

  return result;
}

/**
 * Helper: Get all trashed folders for the user.
 */
export async function getTrashedFolders(ownerId: string) {
  return prisma.folder.findMany({
    where: {
      ownerId,
      isTrashed: true,
    },
    orderBy: {
      trashedAt: 'desc',
    },
  });
}

/**
 * Helper: Toggle or set star status on a folder.
 */
export async function toggleStarFolder(
  ownerId: string,
  folderId: string,
  explicitStar?: boolean
) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId, isTrashed: false },
  });

  if (!folder) {
    throw new AppError('Folder not found.', 404);
  }

  const newStarred = typeof explicitStar === 'boolean' ? explicitStar : !folder.isStarred;

  const updatedFolder = await prisma.folder.update({
    where: { id: folderId },
    data: { isStarred: newStarred },
  });

  // Invalidate cache
  await invalidateUserFolderCache(ownerId);

  return updatedFolder;
}
