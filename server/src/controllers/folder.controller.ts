import { Request, Response, NextFunction } from 'express';
import * as folderService from '../services/folder.service';
import { AppError } from '../utils/errors';

/**
 * 1. Create a new folder
 */
export async function createFolder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { name, parentId } = req.body;

    const folder = await folderService.createFolder(req.user.id, {
      name,
      parentId,
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully.',
      data: { folder },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Get Root Folders
 */
export async function getRootFolders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const folders = await folderService.getRootFolders(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Root folders fetched successfully.',
      data: { folders },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Get Subfolders by Parent ID
 */
export async function getSubfolders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;

    const folders = await folderService.getSubfoldersByParentId(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Subfolders fetched successfully.',
      data: { folders },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * General List Folders handler (supports query `?parentId=xxx` or defaults to root)
 */
export async function getFolders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const parentId = typeof req.query.parentId === 'string' ? req.query.parentId : null;

    const folders = parentId
      ? await folderService.getSubfoldersByParentId(req.user.id, parentId)
      : await folderService.getRootFolders(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Folders fetched successfully.',
      data: { folders },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Get Folder Details with Breadcrumb Ancestors
 */
export async function getFolderDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;

    const result = await folderService.getFolderDetails(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Folder details fetched successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. Rename Folder
 */
export async function renameFolder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;
    const { name } = req.body;

    const folder = await folderService.renameFolder(req.user.id, id, { name });

    res.status(200).json({
      success: true,
      message: 'Folder renamed successfully.',
      data: { folder },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. Move Folder to Another Parent
 */
export async function moveFolder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;
    // Accept targetParentId, destinationFolderId, or parentId
    const targetParentId =
      req.body.targetParentId !== undefined
        ? req.body.targetParentId
        : req.body.destinationFolderId !== undefined
        ? req.body.destinationFolderId
        : req.body.parentId !== undefined
        ? req.body.parentId
        : null;

    const folder = await folderService.moveFolder(req.user.id, id, {
      targetParentId,
    });

    res.status(200).json({
      success: true,
      message: 'Folder moved successfully.',
      data: { folder },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 7. Move Folder to Root
 */
export async function moveFolderToRoot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;

    const folder = await folderService.moveFolderToRoot(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Folder moved to root successfully.',
      data: { folder },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 8. Trash Folder (Soft Delete)
 */
export async function trashFolder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;

    const result = await folderService.trashFolder(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Folder moved to trash successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 9. Restore Folder
 */
export async function restoreFolder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;

    const result = await folderService.restoreFolder(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Folder restored successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 10. Permanently Delete Folder (Hard Delete)
 */
export async function permanentlyDeleteFolder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;

    const result = await folderService.permanentlyDeleteFolder(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Folder permanently deleted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /:id route dispatcher
 * If query param `?permanent=true`, permanently deletes. Otherwise soft-deletes (trashes).
 */
export async function deleteFolderRouter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.query.permanent === 'true') {
    return permanentlyDeleteFolder(req, res, next);
  }
  return trashFolder(req, res, next);
}

/**
 * List Trashed Folders
 */
export async function getTrashedFolders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const folders = await folderService.getTrashedFolders(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Trashed folders fetched successfully.',
      data: { folders },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle or Set Folder Star Status
 */
export async function toggleStarFolder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;
    const { isStarred } = req.body;

    const folder = await folderService.toggleStarFolder(
      req.user.id,
      id,
      typeof isStarred === 'boolean' ? isStarred : undefined
    );

    res.status(200).json({
      success: true,
      message: `Folder ${folder.isStarred ? 'starred' : 'unstarred'} successfully.`,
      data: { folder },
    });
  } catch (error) {
    next(error);
  }
}
