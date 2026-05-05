import { Router, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { GalleryItem } from '../models/GalleryItem';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';
import {
  deleteGalleryMedia,
  getCloudinaryErrorMessage,
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
const uploadGalleryFiles = upload.array('media');

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  return value === true || value === 'true';
};

const normalizeCategory = (value: unknown) => {
  const category = typeof value === 'string' ? value.trim() : '';
  return category || 'Auto Service';
};

const getUploadedFiles = (req: AuthRequest): UploadedGalleryFile[] => {
  const files = (req as any).files;

  if (Array.isArray(files)) {
    return files;
  }

  if ((req as GalleryUploadRequest).file) {
    return [(req as GalleryUploadRequest).file as UploadedGalleryFile];
  }

  return [];
};

router.get('/public', async (_req, res: Response, next: NextFunction) => {
  try {
    const items = await GalleryItem.find({ published: true })
      .sort({ category: 1, sortOrder: 1, createdAt: -1 })
      .limit(24);

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.use(authMiddleware, adminMiddleware);

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await GalleryItem.find().sort({ category: 1, sortOrder: 1, createdAt: -1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  uploadGalleryFiles(req as any, res as any, (error: any) => {
    if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is too large. Upload a file under 100 MB.' });
    }

    if (error) {
      return res.status(400).json({ error: error.message || 'Could not read uploaded file' });
    }

    next();
  });
}, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    const uploadedFiles = getUploadedFiles(req);

    if (uploadedFiles.length === 0 && (!title || !requestedMediaUrl)) {
      return res.status(400).json({ error: 'Title and media file are required' });
    }

    if (uploadedFiles.length > 0 && !isCloudinaryConfigured()) {
      return res.status(503).json({ error: 'Cloudinary is not configured on the server' });
    }

    if (uploadedFiles.length > 0) {
      const createdItems = [];
      const baseSortOrder = Number(sortOrder) || 0;

      for (const [index, file] of uploadedFiles.entries()) {
        let uploadResult;

        try {
          uploadResult = await uploadGalleryMedia(file);
        } catch (error: any) {
          console.error('Cloudinary upload failed:', error);
          return res.status(502).json({ error: getCloudinaryErrorMessage(error) });
        }

        const mediaType = uploadResult.resource_type === 'video' ? 'video' : 'image';
        const originalName = (file.originalname || '').replace(/\.[^/.]+$/, '').trim();
        const itemTitle = String(title || '').trim() || originalName || `Gallery item ${index + 1}`;
        const titleSuffix = uploadedFiles.length > 1 && title ? ` ${index + 1}` : '';

        const item = await GalleryItem.create({
          title: `${itemTitle}${titleSuffix}`,
          description,
          mediaType,
          mediaUrl: uploadResult.secure_url,
          thumbnailUrl: mediaType === 'video' ? getVideoThumbnailUrl(uploadResult.public_id) : '',
          category: normalizeCategory(category),
          cloudinaryPublicId: uploadResult.public_id,
          featured: parseBoolean(featured, true),
          published: parseBoolean(published, true),
          sortOrder: baseSortOrder + index,
        });

        createdItems.push(item);
      }

      return res.status(201).json({ item: createdItems[0], items: createdItems });
    }

    let mediaType: 'image' | 'video';
    let mediaUrl = String(requestedMediaUrl || '');
    let thumbnailUrl = String(requestedThumbnailUrl || '');
    let cloudinaryPublicId = '';

    if (!['image', 'video'].includes(requestedMediaType)) {
      return res.status(400).json({ error: 'Media type must be image or video' });
    }

    mediaType = requestedMediaType;

    const item = await GalleryItem.create({
      title,
      description,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      category: normalizeCategory(category),
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
    const updates = {
      ...req.body,
      ...(req.body.category !== undefined ? { category: normalizeCategory(req.body.category) } : {}),
      ...(req.body.sortOrder !== undefined ? { sortOrder: Number(req.body.sortOrder) || 0 } : {}),
    };

    const item = await GalleryItem.findByIdAndUpdate(req.params.id, updates, {
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
