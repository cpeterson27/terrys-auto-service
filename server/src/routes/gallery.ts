import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { GalleryItem } from '../models/GalleryItem';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';
import {
  deleteGalleryMedia,
  getVideoThumbnailUrl,
  isCloudinaryConfigured,
  UploadedGalleryFile,
  uploadGalleryMedia,
} from '../utils/cloudinary';

const router = Router();
type GalleryUploadRequest = AuthRequest & {
  file?: UploadedGalleryFile;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image and video files can be uploaded'));
  },
});

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  return value === true || value === 'true';
};

router.get('/public', async (_req, res: Response, next: NextFunction) => {
  try {
    const items = await GalleryItem.find({ published: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(24);

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.use(authMiddleware, adminMiddleware);

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await GalleryItem.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post('/', upload.single('media'), async (req: GalleryUploadRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      mediaType: requestedMediaType,
      mediaUrl: requestedMediaUrl,
      thumbnailUrl: requestedThumbnailUrl,
      category,
      featured,
      published,
      sortOrder,
    } = req.body;

    if (!title || (!req.file && !requestedMediaUrl)) {
      return res.status(400).json({ error: 'Title and media file are required' });
    }

    if (req.file && !isCloudinaryConfigured()) {
      return res.status(500).json({ error: 'Cloudinary is not configured on the server' });
    }

    let mediaType: 'image' | 'video';
    let mediaUrl = String(requestedMediaUrl || '');
    let thumbnailUrl = String(requestedThumbnailUrl || '');
    let cloudinaryPublicId = '';

    if (req.file) {
      const uploadResult = await uploadGalleryMedia(req.file);
      mediaType = uploadResult.resource_type === 'video' ? 'video' : 'image';
      mediaUrl = uploadResult.secure_url;
      thumbnailUrl = mediaType === 'video' ? getVideoThumbnailUrl(uploadResult.public_id) : '';
      cloudinaryPublicId = uploadResult.public_id;
    } else {
      if (!['image', 'video'].includes(requestedMediaType)) {
        return res.status(400).json({ error: 'Media type must be image or video' });
      }

      mediaType = requestedMediaType;
    }

    const item = await GalleryItem.create({
      title,
      description,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      category,
      cloudinaryPublicId,
      featured: parseBoolean(featured, true),
      published: parseBoolean(published, true),
      sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await GalleryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await GalleryItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    if (item.cloudinaryPublicId) {
      await deleteGalleryMedia(item.cloudinaryPublicId, item.mediaType);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
