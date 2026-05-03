import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Expense } from '../models/Expense';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';

dotenv.config();

const TEST_EMAIL = 'schema.test@example.com';

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/terry-auto-service');

  const customer = await User.findOneAndUpdate(
    { email: TEST_EMAIL },
    {
      email: TEST_EMAIL,
      password: 'password123',
      name: 'Schema Test Customer',
      role: 'customer',
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const runId = Date.now();

  const booking = await Booking.create({
    customerId: customer._id,
    serviceDate: new Date('2026-05-15T15:00:00.000Z'),
    serviceTime: '10:00 AM',
    vehicleInfo: '2016 Ford F-150',
    description: `Schema test booking ${runId}`,
  });

  const expense = await Expense.create({
    description: `Schema test expense ${runId}`,
    amount: 42.5,
    category: 'Supplies',
    receipt: 'test-receipt.jpg',
  });

  const invoice = await Invoice.create({
    invoiceNumber: `TEST-${runId}`,
    customerId: customer._id,
    subtotal: 100,
    taxAmount: 8.25,
    totalAmount: 108.25,
    dueDate: new Date('2026-05-30T00:00:00.000Z'),
    items: [
      {
        description: 'Oil change',
        quantity: 1,
        unitPrice: 100,
        total: 100,
      },
    ],
    notes: 'Temporary schema test invoice',
  });

  const foundBooking = await Booking.findById(booking._id).populate('customerId', 'email role');
  const foundExpense = await Expense.findById(expense._id);
  const foundInvoice = await Invoice.findById(invoice._id).populate('customerId', 'email role');

  console.log('Created and read schema records:');
  console.log(`Booking: ${foundBooking?._id} status=${foundBooking?.status}`);
  console.log(`Expense: ${foundExpense?._id} amount=${foundExpense?.amount}`);
  console.log(`Invoice: ${foundInvoice?._id} status=${foundInvoice?.status} total=${foundInvoice?.totalAmount}`);

  await Promise.all([
    Booking.findByIdAndDelete(booking._id),
    Expense.findByIdAndDelete(expense._id),
    Invoice.findByIdAndDelete(invoice._id),
  ]);

  console.log('Temporary booking, expense, and invoice records deleted');
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
