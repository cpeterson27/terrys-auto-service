import { Router, Response, NextFunction } from 'express';
import { AvailabilitySettings } from '../models/AvailabilitySettings';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

export const DEFAULT_SERVICE_TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];

export const getServiceTimes = async () => {
  const settings = await AvailabilitySettings.findOne();
  const serviceTimes = settings?.serviceTimes?.filter(Boolean) || [];

  return serviceTimes.length > 0 ? serviceTimes : DEFAULT_SERVICE_TIMES;
};

router.use(authMiddleware);

router.get('/availability', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const serviceTimes = await getServiceTimes();
    res.json({ serviceTimes, defaultServiceTimes: DEFAULT_SERVICE_TIMES });
  } catch (error) {
    next(error);
  }
});

router.patch('/availability', adminMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestedTimes = Array.isArray(req.body.serviceTimes) ? req.body.serviceTimes : [];
    const serviceTimes = DEFAULT_SERVICE_TIMES.filter((time) => requestedTimes.includes(time));

    if (serviceTimes.length === 0) {
      return res.status(400).json({ error: 'Choose at least one bookable time' });
    }

    const settings = await AvailabilitySettings.findOneAndUpdate(
      {},
      { serviceTimes },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ serviceTimes: settings.serviceTimes, defaultServiceTimes: DEFAULT_SERVICE_TIMES });
  } catch (error) {
    next(error);
  }
});

export default router;
