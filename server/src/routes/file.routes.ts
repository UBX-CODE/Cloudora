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
import { uploadLimiter } from '../middleware/rate-limiter.middleware';
const router = Router();

// All file upload endpoints require authentication
router.use(authenticate);

// Single upload URL generation (files <= 16 MiB)
router.post('/upload-url', uploadLimiter, generateUploadUrl);

// Multipart upload lifecycle endpoints (files > 16 MiB)
router.post('/multipart/initiate', uploadLimiter, initiateMultipartUpload);
router.post('/:id/part-urls', getPartUploadUrls);
router.post('/:id/complete', completeUpload);
router.post('/:id/abort', abortUpload);
router.get('/:id/session', getSessionStatus);

export default router;
