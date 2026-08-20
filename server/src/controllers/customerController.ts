import { Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const listCustomers = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await User.find({
      role: 'customer',
      accountDeleted: { $ne: true },
    })
      .select('name email phone emailVerified marketingOptIn marketingOptInAt createdAt')
      .sort({ name: 1, email: 1 })
      .lean();

    const customerIds = customers.map((customer) => customer._id);
    const [bookingCounts, invoiceCounts] = await Promise.all([
      Booking.aggregate([
        { $match: { customerId: { $in: customerIds } } },
        { $group: { _id: '$customerId', count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { customerId: { $in: customerIds } } },
        { $group: { _id: '$customerId', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const bookingsByCustomer = new Map(bookingCounts.map((item) => [String(item._id), item.count]));
    const invoicesByCustomer = new Map(invoiceCounts.map((item) => [String(item._id), item]));

    res.json({
      customers: customers.map((customer) => {
        const customerId = String(customer._id);
        const invoiceSummary = invoicesByCustomer.get(customerId);

        return {
          ...customer,
          bookingCount: bookingsByCustomer.get(customerId) || 0,
          invoiceCount: invoiceSummary?.count || 0,
          invoiceTotal: invoiceSummary?.total || 0,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: 'customer',
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await Promise.all([
      Booking.deleteMany({ customerId: customer._id }),
      Invoice.deleteMany({ customerId: customer._id }),
      User.findByIdAndDelete(customer._id),
    ]);

    res.json({ message: 'Customer and related test records deleted.' });
  } catch (error) {
    next(error);
  }
};
