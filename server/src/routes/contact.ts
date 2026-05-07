import { Router } from 'express';
import {
  createContactMessage,
  listContactMessages,
  updateContactMessageStatus,
} from '../controllers/contactController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', createContactMessage);

router.use(authMiddleware, adminMiddleware);

router.get('/', listContactMessages);
router.patch('/:id', updateContactMessageStatus);

export default router;
