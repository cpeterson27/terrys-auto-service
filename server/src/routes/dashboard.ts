import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', getDashboardStats);

export default router;
