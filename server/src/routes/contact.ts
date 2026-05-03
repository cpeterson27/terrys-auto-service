import { Router, Request, Response, NextFunction } from 'express';
import { ContactMessage } from '../models/ContactMessage';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();
const recentSubmissions = new Map<string, number>();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, subject, message, company } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const lastSubmission = recentSubmissions.get(ipAddress) || 0;

    if (Date.now() - lastSubmission < 60_000) {
      return res.status(429).json({ error: 'Please wait a minute before sending another message' });
    }

    if (company) {
      return res.status(200).json({ success: true });
    }

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    recentSubmissions.set(ipAddress, Date.now());

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.use(authMiddleware, adminMiddleware);

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    if (!['new', 'read', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid message status' });
    }

    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message });
  } catch (error) {
    next(error);
  }
});

export default router;
