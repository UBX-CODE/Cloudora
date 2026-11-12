import { Request, Response, NextFunction } from 'express';
import {
  createUploadUrl,
  confirmSingleUpload,
  initializeMultipartUpload,
  generatePartUploadUrls,
  completeMultipartUpload,
  abortMultipartUpload,
  getUploadSessionStatus,
} from '../services/file-upload.service';
import { AppError } from '../utils/errors';

/**
 * Single-file upload presigned URL generation (files <= 16 MiB)
 */
export async function generateUploadUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { name, mimeType, size, folderId } = req.body;

    const result = await createUploadUrl(req.user.id, {
      name,
      mimeType,
      size: Number(size),
      folderId,
    });

    res.status(201).json({
      success: true,
      message: 'Upload URL generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initialize multipart upload (files > 16 MiB)
 */
export async function initiateMultipartUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { name, mimeType, size, folderId } = req.body;

    const result = await initializeMultipartUpload(req.user.id, {
      name,
      mimeType,
      size: Number(size),
      folderId,
    });

    res.status(201).json({
      success: true,
      message: 'Multipart upload initialized successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate part upload presigned URLs
 */
export async function getPartUploadUrls(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;
    const { partNumbers } = req.body || {};

    const result = await generatePartUploadUrls(
      req.user.id,
      id,
      Array.isArray(partNumbers) ? partNumbers : undefined
    );

    res.status(200).json({
      success: true,
      message: 'Part upload URLs generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete upload (handles both multipart and single upload flows)
 */
export async function completeUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;
    const { parts } = req.body || {};

    // If parts are provided in the payload, complete multipart upload
    if (Array.isArray(parts)) {
      const result = await completeMultipartUpload(req.user.id, id, parts);

      res.status(200).json({
        success: true,
        message: 'Multipart upload completed and verified successfully',
        data: result,
      });
      return;
    }

    // Otherwise, handle as single PUT upload confirmation
    const result = await confirmSingleUpload(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'File upload verified successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Abort multipart upload
 */
export async function abortUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;
    const result = await abortMultipartUpload(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Multipart upload aborted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get upload session status and resume metadata (MinIO ListParts verification)
 */
export async function getSessionStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Authentication required.', 401);
    }

    const { id } = req.params;
    const result = await getUploadSessionStatus(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Upload session status retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
