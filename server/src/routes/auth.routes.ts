import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limiter.middleware';
const router = Router();

// Public auth routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);

// Protected routes (require valid JWT)
router.get('/me', authenticate, authController.getCurrentUser);

export default router;

