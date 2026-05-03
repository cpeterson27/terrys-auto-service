import React from 'react';
import { useAuthStore } from '../store/authStore';
import { BarChart3, FileText, DollarSign, Calendar } from 'lucide-react';
import { api, formatCurrency, formatDate } from '../lib/api';

interface DashboardStats {
  totalInvoices: number;
  revenue: number;
  pendingBookings: number;
  monthExpenses: number;
  yearExpenses: number;
}

interface Booking {
  _id: string;
  customerId?: { name?: string; email?: string };
  serviceDate: string;
  serviceTime: string;
  vehicleInfo: string;
  description?: string;
  status: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = React.useState<DashboardStats>({
    totalInvoices: 0,
    revenue: 0,
    pendingBookings: 0,
    monthExpenses: 0,
    yearExpenses: 0,
  });
  const [recentBookings, setRecentBookings] = React.useState<Booking[]>([]);
  const [error, setError] = React.useState('');

  const loadStats = React.useCallback(async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.stats);
      setRecentBookings(response.data.recentBookings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load dashboard');
    }
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  const updateBookingStatus = async (bookingId: string, status: string, reason?: string) => {
    setError('');

    try {
      await api.patch(`/bookings/${bookingId}`, { status, reason });
      await loadStats();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update appointment');
    }
  };

  const cancelBooking = (bookingId: string) => {
    const reason = window.prompt('Optional: add a cancellation reason for the customer email.');

    if (reason === null) {
      return;
    }

    updateBookingStatus(bookingId, 'cancelled', reason);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.email}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Invoices</p>
              <p className="text-3xl font-bold">{stats.totalInvoices}</p>
            </div>
            <FileText size={40} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.revenue)}</p>
            </div>
            <DollarSign size={40} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Bookings</p>
              <p className="text-3xl font-bold">{stats.pendingBookings}</p>
            </div>
            <Calendar size={40} className="text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Expenses This Month</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.monthExpenses)}</p>
            </div>
            <BarChart3 size={40} className="text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Upcoming Appointments</h2>
        {recentBookings.length === 0 ? (
          <p className="text-gray-500 py-4">No appointments booked yet.</p>
        ) : (
          <div className="divide-y">
            {recentBookings.map((booking) => (
              <div key={booking._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {booking.customerId?.name || booking.customerId?.email || 'Customer'}
                  </p>
                  <p className="text-sm text-gray-600">{booking.vehicleInfo}</p>
                  {booking.description && (
                    <p className="text-sm text-gray-600">{booking.description}</p>
                  )}
                </div>
                <div className="text-sm text-gray-700">
                  {formatDate(booking.serviceDate)} at {booking.serviceTime}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize text-blue-700">{booking.status}</span>
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => cancelBooking(booking._id)}
                        className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm font-semibold hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(booking._id, 'pending')}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-200"
                      >
                        Back to Pending
                      </button>
                      <button
                        onClick={() => cancelBooking(booking._id)}
                        className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm font-semibold hover:bg-red-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => updateBookingStatus(booking._id, 'completed')}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-100"
                      >
                        Complete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
