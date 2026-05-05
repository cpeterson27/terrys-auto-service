import { Router, Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';
import {
  bookingCancellationTemplate,
  bookingConfirmationTemplate,
  customerBookingCancellationTemplate,
  sendEmail,
} from '../utils/emailService';
import { getAvailabilitySettings } from './settings';

const router = Router();

router.use(authMiddleware);

const getDateRange = (dateValue: string) => {
  const date = new Date(dateValue);
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  return { date, nextDate };
};

const isPastServiceDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const serviceDay = new Date(date);
  serviceDay.setHours(0, 0, 0, 0);

  return serviceDay < today;
};

const getAvailabilityForDate = async (dateValue: string) => {
  const { serviceTimes, bookableDays } = await getAvailabilitySettings();
  const { date, nextDate } = getDateRange(dateValue);

  if (!bookableDays.includes(date.getUTCDay())) {
    return { bookable: false, slots: [] };
  }

  const occupiedBookings = await Booking.find({
    serviceDate: { $gte: date, $lt: nextDate },
    status: { $ne: 'cancelled' },
  }).select('serviceTime status');

  const occupiedTimes = new Set(occupiedBookings.map((booking) => booking.serviceTime));
  return {
    bookable: true,
    slots: serviceTimes.map((time) => ({
      time,
      available: !occupiedTimes.has(time),
    })),
  };
};

router.get('/availability', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dateValue = String(req.query.date || '');

    if (!dateValue) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const availability = await getAvailabilityForDate(dateValue);

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

router.get('/availability-range', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const startValue = String(req.query.start || new Date().toISOString().slice(0, 10));
    const days = Math.min(Math.max(Number(req.query.days || 14), 1), 31);
    const startDate = new Date(startValue);
    const availability = [];

    for (let index = 0; index < days; index += 1) {
      const currentDate = new Date(startDate);
      currentDate.setUTCDate(startDate.getUTCDate() + index);
      const dateKey = currentDate.toISOString().slice(0, 10);
      const dayAvailability = await getAvailabilityForDate(dateKey);

      availability.push({
        date: dateKey,
        bookable: dayAvailability.bookable,
        openCount: dayAvailability.slots.filter((slot) => slot.available).length,
        slots: dayAvailability.slots,
      });
    }

    res.json({ availability });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter = req.user?.role === 'admin' ? {} : { customerId: req.user?.userId };
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ serviceDate: 1, serviceTime: 1 });

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceDate, serviceTime, vehicleInfo, description } = req.body;

    if (!serviceDate || !serviceTime || !vehicleInfo || !description) {
      return res.status(400).json({ error: 'Date, time, vehicle, and service description are required' });
    }

    const { serviceTimes, bookableDays } = await getAvailabilitySettings();

    if (!serviceTimes.includes(serviceTime)) {
      return res.status(400).json({ error: 'Please select an available service time' });
    }

    const { date, nextDate } = getDateRange(serviceDate);

    if (isPastServiceDate(date)) {
      return res.status(400).json({ error: 'Please choose a future service date' });
    }

    if (!bookableDays.includes(date.getUTCDay())) {
      return res.status(400).json({ error: 'Terry is not taking online appointments that day. Please choose another day.' });
    }

    const existingBooking = await Booking.findOne({
      serviceDate: { $gte: date, $lt: nextDate },
      serviceTime,
      status: { $ne: 'cancelled' },
    });

    if (existingBooking) {
      return res.status(409).json({ error: 'That appointment time is already taken. Please choose another time.' });
    }

    const booking = await Booking.create({
      customerId: req.user?.userId,
      serviceDate: date,
      serviceTime,
      vehicleInfo,
      description,
    });

    const populatedBooking = await booking.populate('customerId', 'name email phone');
    res.status(201).json({ booking: populatedBooking });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/customer-cancel', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id,
      customerId: req.user?.userId,
    }).populate('customerId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: 'Only pending or confirmed appointments can be cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const customer = booking.customerId as any;
    const customerName = customer?.name || customer?.email || 'Customer';
    const customerEmail = customer?.email || '';
    const appointmentDate = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(booking.serviceDate);

    try {
      const adminEmail = process.env.ADMIN_EMAIL;

      if (adminEmail) {
        await sendEmail(
          adminEmail,
          'Customer cancelled an appointment',
          customerBookingCancellationTemplate(
            customerName,
            customerEmail,
            appointmentDate,
            booking.serviceTime,
            booking.vehicleInfo,
            reason
          )
        );
      }
    } catch (emailError) {
      console.error('Appointment cancelled, but Terry notification email failed:', emailError);
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', adminMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, reason } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status' });
    }

    const currentBooking = await Booking.findById(req.params.id);

    if (!currentBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (status === 'confirmed') {
      const { date, nextDate } = getDateRange(currentBooking.serviceDate.toISOString());
      const conflictingBooking = await Booking.findOne({
        _id: { $ne: currentBooking._id },
        serviceDate: { $gte: date, $lt: nextDate },
        serviceTime: currentBooking.serviceTime,
        status: 'confirmed',
      });

      if (conflictingBooking) {
        return res.status(409).json({ error: 'Another appointment is already confirmed for that time.' });
      }
    }

    currentBooking.status = status;
    await currentBooking.save();

    const booking = await currentBooking.populate('customerId', 'name email phone');
    const customer = booking.customerId as any;
    const customerEmail = customer?.email;
    const customerName = customer?.name || customer?.email || 'there';
    const appointmentDate = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(booking.serviceDate);

    try {
      if (customerEmail && status === 'confirmed') {
        await sendEmail(
          customerEmail,
          'Your appointment is confirmed',
          bookingConfirmationTemplate(customerName, appointmentDate, booking.serviceTime)
        );
      }

      if (customerEmail && status === 'cancelled') {
        await sendEmail(
          customerEmail,
          'Your appointment has been cancelled',
          bookingCancellationTemplate(customerName, appointmentDate, booking.serviceTime, reason)
        );
      }
    } catch (emailError) {
      console.error('Appointment status updated, but notification email failed:', emailError);
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
});

router.get('/customers', adminMiddleware, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('name email phone').sort({ name: 1 });
    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

export default router;
