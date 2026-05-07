import { Router } from 'express';
import {
  createBooking,
  customerCancelBooking,
  deleteBooking,
  getBookingAvailability,
  getBookingAvailabilityRange,
  listBookingCustomers,
  listBookings,
  rescheduleBooking,
  updateBookingStatus,
} from '../controllers/bookingController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/availability', getBookingAvailability);
router.get('/availability-range', getBookingAvailabilityRange);
router.get('/', listBookings);
router.post('/', createBooking);
router.patch('/:id/customer-cancel', customerCancelBooking);
router.patch('/:id/reschedule', adminMiddleware, rescheduleBooking);
router.delete('/:id', adminMiddleware, deleteBooking);
router.patch('/:id', adminMiddleware, updateBookingStatus);
router.get('/customers', adminMiddleware, listBookingCustomers);

export default router;
