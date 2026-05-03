import { Router, Response, NextFunction } from 'express';
import { GalleryItem } from '../models/GalleryItem';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

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

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      category,
      featured,
      published,
      sortOrder,
    } = req.body;

    if (!title || !mediaType || !mediaUrl) {
      return res.status(400).json({ error: 'Title, media type, and media URL are required' });
    }

    if (!['image', 'video'].includes(mediaType)) {
      return res.status(400).json({ error: 'Media type must be image or video' });
    }

    const item = await GalleryItem.create({
      title,
      description,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      category,
      featured,
      published,
      sortOrder,
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

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
