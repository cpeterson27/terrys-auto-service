import { Router } from 'express';
import {
  addGalleryItemMedia,
  createGalleryItem,
  deleteGalleryItem,
  listGalleryItems,
  listPublicGalleryItems,
  readGalleryUploadFiles,
  updateGalleryItem,
} from '../controllers/galleryController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/public', listPublicGalleryItems);

router.use(authMiddleware, adminMiddleware);

router.get('/', listGalleryItems);
router.post('/', readGalleryUploadFiles, createGalleryItem);
router.post('/:id/media', readGalleryUploadFiles, addGalleryItemMedia);
router.patch('/:id', updateGalleryItem);
router.delete('/:id', deleteGalleryItem);

export default router;
