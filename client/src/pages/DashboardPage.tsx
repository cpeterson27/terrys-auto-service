import React from 'react';
import { useAuthStore } from '../store/authStore';
import { BarChart3, Calendar, ChevronLeft, ChevronRight, DollarSign, FileText } from 'lucide-react';
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

const SERVICE_TIME_ORDER = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];

const getDateKey = (date: Date | string) => {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return parsedDate.toISOString().slice(0, 10);
};

const getMonthDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Array<Date | null> = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

const sortBookings = (bookings: Booking[]) =>
  [...bookings].sort((firstBooking, secondBooking) => {
    const firstDate = new Date(firstBooking.serviceDate).getTime();
    const secondDate = new Date(secondBooking.serviceDate).getTime();

    if (firstDate !== secondDate) {
      return firstDate - secondDate;
    }

    return SERVICE_TIME_ORDER.indexOf(firstBooking.serviceTime) - SERVICE_TIME_ORDER.indexOf(secondBooking.serviceTime);
  });

const getStatusClassName = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-50 text-yellow-800';
    case 'confirmed':
      return 'bg-green-50 text-green-800';
    case 'completed':
      return 'bg-blue-50 text-blue-800';
    case 'cancelled':
      return 'bg-red-50 text-red-800';
    default:
      return 'bg-gray-50 text-gray-800';
  }
};

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = React.useState<DashboardStats>({
    totalInvoices: 0,
    revenue: 0,
    pendingBookings: 0,
    monthExpenses: 0,
    yearExpenses: 0,
  });
  const [allBookings, setAllBookings] = React.useState<Booking[]>([]);
  const [calendarMonth, setCalendarMonth] = React.useState(() => new Date());
  const [error, setError] = React.useState('');

  const loadStats = React.useCallback(async () => {
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/bookings'),
      ]);

      setStats(dashboardResponse.data.stats);
      setAllBookings(bookingsResponse.data.bookings);
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
    const reason = window.prompt('Optional: add a cancellation reason for the customer email. They will be asked to choose another day.');

    if (reason === null) {
      return;
    }

    updateBookingStatus(bookingId, 'cancelled', reason);
  };

  const sortedBookings = React.useMemo(() => sortBookings(allBookings), [allBookings]);
  const calendarBookingsByDay = React.useMemo(() => {
    const groups = new Map<string, Booking[]>();

    sortedBookings.forEach((booking) => {
      const key = getDateKey(booking.serviceDate);
      groups.set(key, [...(groups.get(key) || []), booking]);
    });

    return groups;
  }, [sortedBookings]);
  const calendarDays = React.useMemo(() => getMonthDays(calendarMonth), [calendarMonth]);
  const calendarTitle = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(calendarMonth);

  const changeCalendarMonth = (offset: number) => {
    setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
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

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold">Appointment Calendar</h2>
            <p className="text-gray-600 mt-1">All appointments by service day, color-coded by status.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => changeCalendarMonth(-1)}
              className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="min-w-[160px] text-center font-semibold text-gray-900">{calendarTitle}</p>
            <button
              type="button"
              onClick={() => changeCalendarMonth(1)}
              className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="border-b border-gray-200 bg-gray-50 px-2 py-2 text-center">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            const dayBookings = day ? calendarBookingsByDay.get(getDateKey(day)) || [] : [];

            return (
              <div key={day ? getDateKey(day) : `empty-${index}`} className="min-h-[120px] border-b border-r border-gray-200 p-2">
                {day && (
                  <>
                    <p className="mb-2 font-bold text-gray-900">{day.getDate()}</p>
                    <div className="space-y-1">
                      {dayBookings.map((booking) => (
                        <div
                          key={booking._id}
                          className={`rounded px-2 py-1 text-left normal-case tracking-normal ${getStatusClassName(booking.status)}`}
                        >
                          <p className="truncate font-semibold">{booking.serviceTime}</p>
                          <p className="truncate">{booking.customerId?.name || booking.customerId?.email || 'Customer'}</p>
                          <p className="capitalize">{booking.status}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Appointments</h2>
        {sortedBookings.length === 0 ? (
          <p className="text-gray-500 py-4">No appointments booked yet.</p>
        ) : (
          <div className="divide-y">
            {sortedBookings.map((booking) => (
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
                  <span className={`rounded px-2 py-1 text-sm font-medium capitalize ${getStatusClassName(booking.status)}`}>{booking.status}</span>
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
