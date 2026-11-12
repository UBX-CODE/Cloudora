import { Router } from 'express';
import * as folderController from '../controllers/folder.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All folder routes require valid JWT authentication
router.use(authenticate);

// --- Static collections (placed before /:id to avoid collision) ---
router.get('/root', folderController.getRootFolders);
router.get('/trash', folderController.getTrashedFolders);
router.get('/', folderController.getFolders);
router.post('/', folderController.createFolder);

// --- Individual folder operations ---
router.get('/:id', folderController.getFolderDetails);
router.get('/:id/subfolders', folderController.getSubfolders);

router.patch('/:id/rename', folderController.renameFolder);
router.patch('/:id/move', folderController.moveFolder);
router.patch('/:id/move-to-root', folderController.moveFolderToRoot);
router.patch('/:id/trash', folderController.trashFolder);
router.patch('/:id/restore', folderController.restoreFolder);
router.patch('/:id/star', folderController.toggleStarFolder);

router.delete('/:id/permanent', folderController.permanentlyDeleteFolder);
router.delete('/:id', folderController.deleteFolderRouter);

export default router;
