import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  generateUploadUrl,
  initiateMultipartUpload,
  getPartUploadUrls,
  completeUpload,
  abortUpload,
  getSessionStatus,
} from '../controllers/file-upload.controller';
import * as fileController from '../controllers/file.controller';
import { uploadLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

// All file endpoints require authentication
router.use(authenticate);

// ==========================================
// 1. Static Routes (Placed BEFORE /:id)
// ==========================================

// Upload Lifecycle
router.post('/upload-url', uploadLimiter, generateUploadUrl);
router.post('/multipart/initiate', uploadLimiter, initiateMultipartUpload);

// Storage & Collections
router.get('/storage-summary', fileController.getStorageSummary);
router.get('/starred', fileController.getStarredFiles);
router.get('/trash', fileController.getTrashFiles);
router.get('/recent', fileController.getRecentFiles);

// List files with query params (folderId, category, search, sorting)
router.get('/', fileController.getFiles);

// ==========================================
// 2. Dynamic Parametric Routes (/:id)
// ==========================================

// Multipart session specific endpoints
router.post('/:id/part-urls', getPartUploadUrls);
router.post('/:id/complete', completeUpload);
router.post('/:id/abort', abortUpload);
router.get('/:id/session', getSessionStatus);

// Presigned Streaming & Download URLs
router.get('/:id/download-url', fileController.getDownloadUrl);
router.get('/:id/preview-url', fileController.getPreviewUrl);
router.get('/:id/thumbnail-url', fileController.getThumbnailUrl);

// File Metadata & Mutations
router.get('/:id', fileController.getFileDetails);
router.patch('/:id/rename', fileController.renameFile);
router.patch('/:id/move', fileController.moveFile);
router.patch('/:id/trash', fileController.trashFile);
router.patch('/:id/restore', fileController.restoreFile);
router.patch('/:id/star', fileController.toggleStarFile);
router.delete('/:id/permanent', fileController.permanentlyDeleteFile);

export default router;
