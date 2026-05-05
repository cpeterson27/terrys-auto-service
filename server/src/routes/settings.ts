import { Router, Response, NextFunction } from 'express';
import { AvailabilitySettings } from '../models/AvailabilitySettings';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

export const DEFAULT_SERVICE_TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
export const DEFAULT_BOOKABLE_DAYS = [1, 2, 3, 4, 5];
const VALID_BOOKABLE_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const getAvailabilitySettings = async () => {
  const settings = await AvailabilitySettings.findOne();
  const serviceTimes = settings?.serviceTimes?.filter(Boolean) || [];
  const bookableDays = settings?.bookableDays?.filter((day) => VALID_BOOKABLE_DAYS.includes(day)) || [];

  return {
    serviceTimes: serviceTimes.length > 0 ? serviceTimes : DEFAULT_SERVICE_TIMES,
    bookableDays: bookableDays.length > 0 ? bookableDays : DEFAULT_BOOKABLE_DAYS,
  };
};

export const getServiceTimes = async () => {
  const settings = await getAvailabilitySettings();
  return settings.serviceTimes;
};

router.use(authMiddleware);

router.get('/availability', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await getAvailabilitySettings();
    res.json({
      ...settings,
      defaultServiceTimes: DEFAULT_SERVICE_TIMES,
      defaultBookableDays: DEFAULT_BOOKABLE_DAYS,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/availability', adminMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requestedTimes = Array.isArray(req.body.serviceTimes) ? req.body.serviceTimes : [];
    const serviceTimes = DEFAULT_SERVICE_TIMES.filter((time) => requestedTimes.includes(time));
    const requestedDays = Array.isArray(req.body.bookableDays) ? req.body.bookableDays.map(Number) : [];
    const bookableDays = VALID_BOOKABLE_DAYS.filter((day) => requestedDays.includes(day));

    if (serviceTimes.length === 0) {
      return res.status(400).json({ error: 'Choose at least one bookable time' });
    }

    if (bookableDays.length === 0) {
      return res.status(400).json({ error: 'Choose at least one bookable day' });
    }

    const settings = await AvailabilitySettings.findOneAndUpdate(
      {},
      { serviceTimes, bookableDays },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      serviceTimes: settings.serviceTimes,
      bookableDays: settings.bookableDays,
      defaultServiceTimes: DEFAULT_SERVICE_TIMES,
      defaultBookableDays: DEFAULT_BOOKABLE_DAYS,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
