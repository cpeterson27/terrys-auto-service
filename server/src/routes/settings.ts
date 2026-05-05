import { Router, Response, NextFunction } from 'express';
import { AvailabilitySettings } from '../models/AvailabilitySettings';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

export const DEFAULT_SERVICE_TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
export const DEFAULT_BOOKABLE_DAYS = [1, 2, 3, 4, 5];
const DEFAULT_SERVICE_START_TIME = '09:00';
const DEFAULT_SERVICE_END_TIME = '15:00';
const DEFAULT_SLOT_INTERVAL_MINUTES = 60;
const VALID_BOOKABLE_DAYS = [0, 1, 2, 3, 4, 5, 6];
const VALID_INTERVALS = [30, 45, 60, 90, 120];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeToMinutes = (time: string) => {
  const match = time.match(TIME_PATTERN);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
};

const formatServiceTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
};

const generateServiceTimes = (startTime: string, endTime: string, intervalMinutes: number) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes || !VALID_INTERVALS.includes(intervalMinutes)) {
    return DEFAULT_SERVICE_TIMES;
  }

  const times: string[] = [];

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    times.push(formatServiceTime(minutes));
  }

  return times;
};

export const getAvailabilitySettings = async () => {
  const settings = await AvailabilitySettings.findOne();
  const bookableDays = settings?.bookableDays?.filter((day) => VALID_BOOKABLE_DAYS.includes(day)) || [];
  const serviceStartTime = settings?.serviceStartTime || DEFAULT_SERVICE_START_TIME;
  const serviceEndTime = settings?.serviceEndTime || DEFAULT_SERVICE_END_TIME;
  const slotIntervalMinutes = VALID_INTERVALS.includes(settings?.slotIntervalMinutes || 0)
    ? settings?.slotIntervalMinutes || DEFAULT_SLOT_INTERVAL_MINUTES
    : DEFAULT_SLOT_INTERVAL_MINUTES;
  const serviceTimes = generateServiceTimes(serviceStartTime, serviceEndTime, slotIntervalMinutes);

  return {
    serviceTimes,
    bookableDays: bookableDays.length > 0 ? bookableDays : DEFAULT_BOOKABLE_DAYS,
    serviceStartTime,
    serviceEndTime,
    slotIntervalMinutes,
  };
};

export const getServiceTimes = async () => {
  const settings = await getAvailabilitySettings();
  return settings.serviceTimes;
};

router.get('/public-availability', async (_req, res: Response, next: NextFunction) => {
  try {
    const settings = await getAvailabilitySettings();

    res.json({
      ...settings,
      businessPhone: process.env.BUSINESS_PHONE?.trim() || process.env.ADMIN_PHONE?.trim() || '',
    });
  } catch (error) {
    next(error);
  }
});

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
    const requestedDays = Array.isArray(req.body.bookableDays) ? req.body.bookableDays.map(Number) : [];
    const bookableDays = VALID_BOOKABLE_DAYS.filter((day) => requestedDays.includes(day));
    const serviceStartTime = String(req.body.serviceStartTime || DEFAULT_SERVICE_START_TIME);
    const serviceEndTime = String(req.body.serviceEndTime || DEFAULT_SERVICE_END_TIME);
    const slotIntervalMinutes = Number(req.body.slotIntervalMinutes || DEFAULT_SLOT_INTERVAL_MINUTES);
    const startMinutes = timeToMinutes(serviceStartTime);
    const endMinutes = timeToMinutes(serviceEndTime);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return res.status(400).json({ error: 'Choose a valid start and end time' });
    }

    if (!VALID_INTERVALS.includes(slotIntervalMinutes)) {
      return res.status(400).json({ error: 'Choose a valid appointment interval' });
    }

    if (bookableDays.length === 0) {
      return res.status(400).json({ error: 'Choose at least one bookable day' });
    }

    const serviceTimes = generateServiceTimes(serviceStartTime, serviceEndTime, slotIntervalMinutes);

    const settings = await AvailabilitySettings.findOneAndUpdate(
      {},
      { serviceTimes, bookableDays, serviceStartTime, serviceEndTime, slotIntervalMinutes },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      serviceTimes,
      bookableDays: settings.bookableDays,
      serviceStartTime: settings.serviceStartTime,
      serviceEndTime: settings.serviceEndTime,
      slotIntervalMinutes: settings.slotIntervalMinutes,
      defaultServiceTimes: DEFAULT_SERVICE_TIMES,
      defaultBookableDays: DEFAULT_BOOKABLE_DAYS,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
