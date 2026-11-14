import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as shareController from '../controllers/share.controller';

const router = Router();

// ==========================================
// 1. Public Unauthenticated Routes
// ==========================================
router.get('/public/:token', shareController.getPublicShare);
router.post('/public/:token/verify', shareController.verifyPublicPassword);

// ==========================================
// 2. Authenticated User Routes
// ==========================================
router.use(authenticate);

router.post('/', shareController.createShare);
router.get('/shared-with-me', shareController.getSharedWithMe);
router.get('/my-shares', shareController.getMyCreatedShares);
router.delete('/:id', shareController.revokeShare);

export default router;
