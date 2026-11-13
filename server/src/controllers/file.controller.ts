import { Request, Response, NextFunction } from 'express';
import * as fileService from '../services/file.service';
import { AppError } from '../utils/errors';
import { FileListQueryDTO, FileCategory } from '../types/file.types';

/**
 * Get files for current user with optional filters (folderId, search, category, sorting).
 */
export async function getFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const {
      folderId,
      search,
      category,
      sortBy,
      sortOrder,
      isStarred,
      isTrashed,
      limit,
      offset,
    } = req.query;

    const query: FileListQueryDTO = {
      folderId: folderId !== undefined ? (folderId as string) : undefined,
      search: search as string | undefined,
      category: category as FileCategory | 'all' | undefined,
      sortBy: sortBy as 'name' | 'date' | 'size' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      isStarred: isStarred !== undefined ? isStarred === 'true' : undefined,
      isTrashed: isTrashed !== undefined ? isTrashed === 'true' : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    };

    const files = await fileService.getFiles(req.user.id, query);

    res.status(200).json({
      success: true,
      message: 'Files retrieved successfully',
      data: files,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single file details.
 */
export async function getFileDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const file = await fileService.getFileById(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'File details retrieved successfully',
      data: file,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get presigned download URL (attachment disposition).
 */
export async function getDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const result = await fileService.getDownloadUrl(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Download URL generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get presigned preview/streaming URL (inline disposition).
 */
export async function getPreviewUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const result = await fileService.getPreviewUrl(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Preview URL generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Rename file.
 */
export async function renameFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const { name } = req.body;

    const updated = await fileService.renameFile(req.user.id, id, name);

    res.status(200).json({
      success: true,
      message: 'File renamed successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Move file to another folder or root.
 */
export async function moveFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const { targetFolderId } = req.body;

    const updated = await fileService.moveFile(req.user.id, id, targetFolderId ?? null);

    res.status(200).json({
      success: true,
      message: 'File moved successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft delete (trash) file.
 */
export async function trashFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const updated = await fileService.trashFile(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'File moved to trash',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restore file from trash.
 */
export async function restoreFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const updated = await fileService.restoreFile(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'File restored successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Permanently delete file from MinIO S3 and database.
 */
export async function permanentlyDeleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const result = await fileService.permanentlyDeleteFile(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'File permanently deleted',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle or set Star status on file.
 */
export async function toggleStarFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const { isStarred } = req.body || {};

    const updated = await fileService.toggleStarFile(req.user.id, id, isStarred);

    res.status(200).json({
      success: true,
      message: updated.isStarred ? 'File starred' : 'File unstarred',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Convenience endpoint: Get all starred files.
 */
export async function getStarredFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const files = await fileService.getFiles(req.user.id, {
      isStarred: true,
      isTrashed: false,
    });

    res.status(200).json({
      success: true,
      message: 'Starred files retrieved successfully',
      data: files,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Convenience endpoint: Get all trashed files.
 */
export async function getTrashFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const files = await fileService.getFiles(req.user.id, {
      isTrashed: true,
    });

    res.status(200).json({
      success: true,
      message: 'Trashed files retrieved successfully',
      data: files,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Convenience endpoint: Get recent files.
 */
export async function getRecentFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const files = await fileService.getFiles(req.user.id, {
      isTrashed: false,
      sortBy: 'date',
      sortOrder: 'desc',
      limit,
    });

    res.status(200).json({
      success: true,
      message: 'Recent files retrieved successfully',
      data: files,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Storage summary and breakdown endpoint.
 */
export async function getStorageSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const summary = await fileService.getStorageUsageSummary(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Storage summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

