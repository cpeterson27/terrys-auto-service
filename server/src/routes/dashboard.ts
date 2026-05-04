import { Router, Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { Expense } from '../models/Expense';
import { Invoice } from '../models/Invoice';
import { AuthRequest, adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalInvoices,
      paidRevenue,
      pendingBookings,
      monthExpenses,
      yearExpenses,
      recentBookings,
    ] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
      Expense.aggregate([
        { $match: { date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.find({ status: { $in: ['pending', 'confirmed'] }, serviceDate: { $gte: monthStart } })
        .populate('customerId', 'name email')
        .sort({ serviceDate: 1, serviceTime: 1 })
        .limit(8),
    ]);

    res.json({
      stats: {
        totalInvoices,
        revenue: paidRevenue[0]?.total || 0,
        pendingBookings,
        monthExpenses: monthExpenses[0]?.total || 0,
        yearExpenses: yearExpenses[0]?.total || 0,
      },
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
