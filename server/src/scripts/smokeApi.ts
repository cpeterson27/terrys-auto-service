import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Expense } from '../models/Expense';
import { GalleryItem } from '../models/GalleryItem';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';

dotenv.config();

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const ADMIN_EMAIL = 'terry.tucker63@yahoo.com';

const main = async () => {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD is required for the admin smoke test');
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/terry-auto-service');

  const runId = Date.now();
  const customerEmail = `smoke.customer.${runId}@example.com`;

  const customer = await User.create({
    name: 'Smoke Test Customer',
    email: customerEmail,
    password: 'password123',
    phone: '555-0199',
    role: 'customer',
    emailVerified: true,
  });
  const customerId = customer._id.toString();

  const customerResponse = await axios.post(`${API_URL}/auth/login`, {
    email: customerEmail,
    password: 'password123',
  });
  const customerCookie = customerResponse.headers['set-cookie']?.map((cookie) => cookie.split(';')[0]).join('; ');

  const adminResponse = await axios.post(`${API_URL}/auth/login`, {
    email: ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  const adminCookie = adminResponse.headers['set-cookie']?.map((cookie) => cookie.split(';')[0]).join('; ');

  const customerApi = axios.create({
    baseURL: API_URL,
    headers: { Cookie: customerCookie },
  });
  const adminApi = axios.create({
    baseURL: API_URL,
    headers: { Cookie: adminCookie },
  });

  const bookingResponse = await customerApi.post('/bookings', {
    serviceDate: '2026-06-01',
    serviceTime: '10:00 AM',
    vehicleInfo: '2018 Toyota Camry',
    description: 'Temporary smoke test booking',
  });

  try {
    await customerApi.post('/bookings', {
      serviceDate: '2026-06-01',
      serviceTime: '10:00 AM',
      vehicleInfo: '2019 Honda Accord',
      description: 'Overlapping smoke test booking',
    });
    throw new Error('Overlapping booking was allowed');
  } catch (error: any) {
    if (error.message === 'Overlapping booking was allowed' || error.response?.status !== 409) {
      throw error;
    }
  }

  await adminApi.patch(`/bookings/${bookingResponse.data.booking._id}`, { status: 'confirmed' });

  const invoiceResponse = await adminApi.post('/invoices', {
    customerId,
    dueDate: '2026-06-15',
    status: 'sent',
    items: [
      {
        description: 'Smoke test service',
        quantity: 1,
        unitPrice: 25,
      },
    ],
  });

  const expenseResponse = await adminApi.post('/expenses', {
    description: 'Smoke test shop supply',
    category: 'Supplies',
    amount: 12.5,
  });

  const galleryResponse = await adminApi.post('/gallery', {
    title: 'Smoke test gallery item',
    description: 'Temporary homepage media test',
    mediaType: 'image',
    mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    category: 'Repairs',
    published: true,
    featured: true,
  });

  const publicGalleryResponse = await axios.get(`${API_URL}/gallery/public`);

  if (!publicGalleryResponse.data.items.some((item: any) => item._id === galleryResponse.data.item._id)) {
    throw new Error('Public gallery did not include the published gallery item');
  }

  const [dashboardResponse, customerInvoicesResponse] = await Promise.all([
    adminApi.get('/dashboard/stats'),
    customerApi.get('/invoices'),
  ]);

  if (!customerInvoicesResponse.data.invoices.some((invoice: any) => invoice._id === invoiceResponse.data.invoice._id)) {
    throw new Error('Customer invoice list did not include the new invoice');
  }

  await adminApi.delete(`/expenses/${expenseResponse.data.expense._id}`);

  await Promise.all([
    Booking.findByIdAndDelete(bookingResponse.data.booking._id),
    Invoice.findByIdAndDelete(invoiceResponse.data.invoice._id),
    Expense.findByIdAndDelete(expenseResponse.data.expense._id),
    GalleryItem.findByIdAndDelete(galleryResponse.data.item._id),
    User.findByIdAndDelete(customerId),
  ]);

  console.log('API smoke test passed');
  console.log(`Dashboard invoice count: ${dashboardResponse.data.stats.totalInvoices}`);
  console.log('Temporary smoke-test records deleted');
};

main()
  .catch((error) => {
    console.error(error.response?.data || error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
