import { Router } from 'express';
import {
  DEFAULT_BOOKABLE_DAYS,
  DEFAULT_SERVICE_TIMES,
  getAvailability,
  getAvailabilitySettings,
  getPublicAvailability,
  getServiceTimes,
  updateAvailability,
} from '../controllers/settingsController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

export {
  DEFAULT_BOOKABLE_DAYS,
  DEFAULT_SERVICE_TIMES,
  getAvailabilitySettings,
  getServiceTimes,
};

const router = Router();

router.get('/public-availability', getPublicAvailability);

router.use(authMiddleware);

router.get('/availability', getAvailability);
router.patch('/availability', adminMiddleware, updateAvailability);

export default router;
