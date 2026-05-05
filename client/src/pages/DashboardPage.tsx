import React from 'react';
import { useAuthStore } from '../store/authStore';
import { BarChart3, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, DollarSign, FileText, RotateCw, User, XCircle } from 'lucide-react';
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

const DEFAULT_SERVICE_TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];
const SLOT_INTERVALS = [30, 45, 60, 90, 120];
const BOOKABLE_DAYS = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

const timeOptions = Array.from({ length: 18 * 2 + 1 }, (_value, index) => {
  const totalMinutes = 5 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

const formatTimeOption = (time: string) => {
  const [hoursValue, minutes] = time.split(':').map(Number);
  const period = hoursValue >= 12 ? 'PM' : 'AM';
  const hours = hoursValue % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
};

const serviceTimeToMinutes = (time: string) => {
  const match = time.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3];

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

const timeValueToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const buildServiceTimes = (startTime: string, endTime: string, intervalMinutes: number) => {
  const startMinutes = timeValueToMinutes(startTime);
  const endMinutes = timeValueToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    return [];
  }

  const times: string[] = [];

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    times.push(formatTimeOption(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`));
  }

  return times;
};

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

    return serviceTimeToMinutes(firstBooking.serviceTime) - serviceTimeToMinutes(secondBooking.serviceTime);
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
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [cancellationBooking, setCancellationBooking] = React.useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = React.useState('');
  const [cancellationSaving, setCancellationSaving] = React.useState(false);
  const [rescheduleBooking, setRescheduleBooking] = React.useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState('');
  const [rescheduleTime, setRescheduleTime] = React.useState('');
  const [rescheduleReason, setRescheduleReason] = React.useState('');
  const [rescheduleSaving, setRescheduleSaving] = React.useState(false);
  const [availableServiceTimes, setAvailableServiceTimes] = React.useState<string[]>(DEFAULT_SERVICE_TIMES);
  const [bookableDays, setBookableDays] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [serviceStartTime, setServiceStartTime] = React.useState('09:00');
  const [serviceEndTime, setServiceEndTime] = React.useState('15:00');
  const [slotIntervalMinutes, setSlotIntervalMinutes] = React.useState(60);
  const [availabilityMessage, setAvailabilityMessage] = React.useState('');
  const [availabilitySaving, setAvailabilitySaving] = React.useState(false);
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

  React.useEffect(() => {
    const loadAvailability = async () => {
      try {
        const response = await api.get('/settings/availability');
        setAvailableServiceTimes(response.data.serviceTimes || DEFAULT_SERVICE_TIMES);
        setBookableDays(response.data.bookableDays || [1, 2, 3, 4, 5]);
        setServiceStartTime(response.data.serviceStartTime || '09:00');
        setServiceEndTime(response.data.serviceEndTime || '15:00');
        setSlotIntervalMinutes(response.data.slotIntervalMinutes || 60);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Could not load availability settings');
      }
    };

    loadAvailability();
  }, []);

  const updateBookingStatus = async (bookingId: string, status: string, reason?: string) => {
    setError('');

    try {
      await api.patch(`/bookings/${bookingId}`, { status, reason });
      await loadStats();
      setSelectedBooking((currentBooking) => currentBooking && currentBooking._id === bookingId
        ? { ...currentBooking, status }
        : currentBooking
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update appointment');
    }
  };

  const openCancellationModal = (booking: Booking) => {
    setSelectedBooking(null);
    setCancellationBooking(booking);
    setCancellationReason('');
  };

  const openRescheduleModal = (booking: Booking) => {
    setSelectedBooking(null);
    setRescheduleBooking(booking);
    setRescheduleDate(getDateKey(booking.serviceDate));
    setRescheduleTime(booking.serviceTime);
    setRescheduleReason('');
  };

  const closeCancellationModal = () => {
    if (cancellationSaving) {
      return;
    }

    setCancellationBooking(null);
    setCancellationReason('');
  };

  const submitCancellation = async () => {
    if (!cancellationBooking) {
      return;
    }

    setCancellationSaving(true);

    try {
      await updateBookingStatus(cancellationBooking._id, 'cancelled', cancellationReason);
      setCancellationBooking(null);
      setCancellationReason('');
    } finally {
      setCancellationSaving(false);
    }
  };

  const closeRescheduleModal = () => {
    if (rescheduleSaving) {
      return;
    }

    setRescheduleBooking(null);
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleReason('');
  };

  const submitReschedule = async () => {
    if (!rescheduleBooking) {
      return;
    }

    setError('');
    setRescheduleSaving(true);

    try {
      await api.patch(`/bookings/${rescheduleBooking._id}/reschedule`, {
        serviceDate: rescheduleDate,
        serviceTime: rescheduleTime,
        reason: rescheduleReason,
      });
      await loadStats();
      setRescheduleBooking(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not reschedule appointment');
    } finally {
      setRescheduleSaving(false);
    }
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

  const toggleBookableDay = (day: number) => {
    setAvailabilityMessage('');
    setBookableDays((currentDays) => (
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : BOOKABLE_DAYS.map((bookableDay) => bookableDay.value).filter((bookableDay) => [...currentDays, day].includes(bookableDay))
    ));
  };

  const saveAvailability = async () => {
    setError('');
    setAvailabilityMessage('');
    setAvailabilitySaving(true);

    try {
      const response = await api.patch('/settings/availability', {
        bookableDays,
        serviceStartTime,
        serviceEndTime,
        slotIntervalMinutes,
      });
      setAvailableServiceTimes(response.data.serviceTimes || DEFAULT_SERVICE_TIMES);
      setBookableDays(response.data.bookableDays || [1, 2, 3, 4, 5]);
      setServiceStartTime(response.data.serviceStartTime || serviceStartTime);
      setServiceEndTime(response.data.serviceEndTime || serviceEndTime);
      setSlotIntervalMinutes(response.data.slotIntervalMinutes || slotIntervalMinutes);
      setAvailabilityMessage('Online booking schedule updated.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save availability settings');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const adminFirstName = user?.name?.trim().split(/\s+/)[0] || 'Terry';
  const readableDays = BOOKABLE_DAYS
    .filter((day) => bookableDays.includes(day.value))
    .map((day) => day.fullLabel)
    .join(', ');
  const previewServiceTimes = React.useMemo(
    () => buildServiceTimes(serviceStartTime, serviceEndTime, slotIntervalMinutes),
    [serviceStartTime, serviceEndTime, slotIntervalMinutes]
  );
  const scheduleSummary = `${readableDays || 'No days'} from ${formatTimeOption(serviceStartTime)} to ${formatTimeOption(serviceEndTime)}`;
  const todayKey = getDateKey(new Date());
  const activeBookings = sortedBookings.filter((booking) => booking.status !== 'cancelled' && booking.status !== 'completed');
  const todayBookings = activeBookings.filter((booking) => getDateKey(booking.serviceDate) === todayKey);
  const nextBookings = activeBookings.filter((booking) => getDateKey(booking.serviceDate) >= todayKey).slice(0, 6);
  const customerName = (booking: Booking) => booking.customerId?.name || booking.customerId?.email || 'Customer';

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 rounded-lg bg-gray-950 px-6 py-7 text-white shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">Terry's Auto Service</p>
        <h1 className="mt-2 text-4xl font-bold">Welcome back, {adminFirstName}</h1>
        <p className="mt-2 text-gray-300">Manage appointments, business records, gallery work, and online booking availability.</p>
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
              <p className="text-gray-600">Appointments</p>
              <p className="text-3xl font-bold">{allBookings.length}</p>
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
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Online Booking Schedule</h2>
            <p className="text-gray-600 mt-1">Choose the days, start time, end time, and appointment spacing customers can request online.</p>
            <p className="mt-3 rounded border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">{scheduleSummary}</p>
            {availabilityMessage && (
              <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {availabilityMessage}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={saveAvailability}
            disabled={availabilitySaving}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {availabilitySaving ? 'Saving...' : 'Save Times'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              <div>
                <h3 className="font-bold text-gray-950">Bookable Days</h3>
                <p className="text-sm text-gray-600">{readableDays || 'No days selected'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {BOOKABLE_DAYS.map((day) => {
                const enabled = bookableDays.includes(day.value);

                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleBookableDay(day.value)}
                    className={`rounded-lg border px-3 py-3 text-left ${
                      enabled
                        ? 'border-blue-300 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="block text-sm font-bold">{day.label}</span>
                    <span className="block text-xs">{enabled ? 'Taking requests' : 'Unavailable'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              <div>
                <h3 className="font-bold text-gray-950">Hours and Appointment Length</h3>
                <p className="text-sm text-gray-600">{previewServiceTimes.length} time slot{previewServiceTimes.length === 1 ? '' : 's'} will be shown to customers.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium text-gray-700">
                Start
                <select
                  value={serviceStartTime}
                  onChange={(event) => setServiceStartTime(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{formatTimeOption(time)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                End
                <select
                  value={serviceEndTime}
                  onChange={(event) => setServiceEndTime(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{formatTimeOption(time)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Spacing
                <select
                  value={slotIntervalMinutes}
                  onChange={(event) => setSlotIntervalMinutes(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {SLOT_INTERVALS.map((interval) => (
                    <option key={interval} value={interval}>{interval} minutes</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-sm font-semibold text-gray-700">Customer time preview</p>
              <div className="flex flex-wrap gap-2">
                {previewServiceTimes.map((time) => (
                  <span key={time} className="rounded-full border border-green-200 bg-white px-3 py-1 text-sm font-medium text-green-800">
                    {time}
                  </span>
                ))}
                {previewServiceTimes.length === 0 && (
                  <span className="text-sm text-red-700">End time must be later than start time.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold">Appointment Calendar</h2>
            <p className="text-gray-600 mt-1">Click any appointment to confirm, complete, reschedule, or cancel it.</p>
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="grid grid-cols-7 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="border-b border-gray-200 bg-gray-50 px-2 py-2 text-center">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                const dayBookings = day ? calendarBookingsByDay.get(getDateKey(day)) || [] : [];
                const isToday = day ? getDateKey(day) === todayKey : false;

                return (
                  <div key={day ? getDateKey(day) : `empty-${index}`} className="min-h-[132px] border-b border-r border-gray-200 p-2">
                    {day && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <p className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${isToday ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>
                            {day.getDate()}
                          </p>
                          {dayBookings.length > 0 && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                              {dayBookings.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.map((booking) => (
                            <button
                              key={booking._id}
                              type="button"
                              onClick={() => setSelectedBooking(booking)}
                              className={`block w-full rounded px-2 py-1 text-left normal-case tracking-normal transition hover:ring-2 hover:ring-blue-300 ${getStatusClassName(booking.status)}`}
                            >
                              <span className="block truncate font-semibold">{booking.serviceTime} · {customerName(booking)}</span>
                              <span className="block truncate">{booking.vehicleInfo}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-950">Today</h3>
              <p className="text-sm text-gray-600">{todayBookings.length} active appointment{todayBookings.length === 1 ? '' : 's'}</p>
            </div>
            <div className="space-y-2">
              {todayBookings.length === 0 ? (
                <p className="rounded-lg bg-white p-3 text-sm text-gray-600">No active appointments today.</p>
              ) : todayBookings.map((booking) => (
                <button
                  key={booking._id}
                  type="button"
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-blue-300"
                >
                  <p className="font-semibold text-gray-950">{booking.serviceTime} · {customerName(booking)}</p>
                  <p className="text-sm text-gray-600">{booking.vehicleInfo}</p>
                  <span className={`mt-2 inline-block rounded px-2 py-1 text-xs font-semibold capitalize ${getStatusClassName(booking.status)}`}>
                    {booking.status}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-bold text-gray-950">Next Up</h3>
              <div className="mt-3 space-y-2">
                {nextBookings.length === 0 ? (
                  <p className="rounded-lg bg-white p-3 text-sm text-gray-600">No upcoming active appointments.</p>
                ) : nextBookings.map((booking) => (
                  <button
                    key={booking._id}
                    type="button"
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-blue-300"
                  >
                    <p className="text-sm font-semibold text-gray-950">{formatDate(booking.serviceDate)} at {booking.serviceTime}</p>
                    <p className="text-sm text-gray-600">{customerName(booking)} · {booking.vehicleInfo}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Appointment</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-950">{customerName(selectedBooking)}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDate(selectedBooking.serviceDate)} at {selectedBooking.serviceTime}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close appointment"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-gray-500">
                    <Clock size={18} />
                    <p className="text-xs font-semibold uppercase">Time</p>
                  </div>
                  <p className="font-semibold text-gray-950">{selectedBooking.serviceTime}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-gray-500">
                    <User size={18} />
                    <p className="text-xs font-semibold uppercase">Customer</p>
                  </div>
                  <p className="font-semibold text-gray-950">{customerName(selectedBooking)}</p>
                  {selectedBooking.customerId?.email && (
                    <p className="text-sm text-gray-600">{selectedBooking.customerId.email}</p>
                  )}
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Status</p>
                  <span className={`inline-block rounded px-2 py-1 text-sm font-semibold capitalize ${getStatusClassName(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Vehicle</p>
                <p className="mt-1 text-gray-700">{selectedBooking.vehicleInfo}</p>
                {selectedBooking.description && (
                  <>
                    <p className="mt-4 text-sm font-semibold text-gray-900">Service Request</p>
                    <p className="mt-1 whitespace-pre-wrap text-gray-700">{selectedBooking.description}</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedBooking.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => updateBookingStatus(selectedBooking._id, 'confirmed')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
                  >
                    <CheckCircle size={18} />
                    Confirm Appointment
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => updateBookingStatus(selectedBooking._id, 'completed')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    <CheckCircle size={18} />
                    Mark Complete
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => updateBookingStatus(selectedBooking._id, 'pending')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Back to Pending
                  </button>
                )}
                {['pending', 'confirmed'].includes(selectedBooking.status) && (
                  <button
                    type="button"
                    onClick={() => openRescheduleModal(selectedBooking)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <RotateCw size={18} />
                    Reschedule
                  </button>
                )}
                {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => openCancellationModal(selectedBooking)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 hover:bg-red-100"
                  >
                    <XCircle size={18} />
                    Cancel and Email Customer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Reschedule appointment</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950">Choose a new day and time</h2>
              <p className="mt-2 text-gray-600">
                The appointment will be confirmed at the new time and the customer will receive an email.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-950">{customerName(rescheduleBooking)}</p>
              <p className="mt-1 text-sm text-gray-600">{rescheduleBooking.vehicleInfo}</p>
              <p className="text-sm text-gray-600">
                Current: {formatDate(rescheduleBooking.serviceDate)} at {rescheduleBooking.serviceTime}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                New Date
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(event) => setRescheduleDate(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                New Time
                <select
                  value={rescheduleTime}
                  onChange={(event) => setRescheduleTime(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                >
                  {availableServiceTimes.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-5 block text-sm font-medium text-gray-700">
              Message to include in the email
              <textarea
                value={rescheduleReason}
                onChange={(event) => setRescheduleReason(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Example: Terry had an emergency come up and moved your appointment to the next available time."
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRescheduleModal}
                disabled={rescheduleSaving}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Current Time
              </button>
              <button
                type="button"
                onClick={submitReschedule}
                disabled={rescheduleSaving}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {rescheduleSaving ? 'Saving...' : 'Reschedule & Email Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancellationBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Cancel and reschedule</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950">Email the customer to choose another day</h2>
              <p className="mt-2 text-gray-600">
                This will cancel the appointment and send an apology asking the customer to submit a new request.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-950">
                {cancellationBooking.customerId?.name || cancellationBooking.customerId?.email || 'Customer'}
              </p>
              <p className="mt-1 text-sm text-gray-600">{cancellationBooking.vehicleInfo}</p>
              <p className="text-sm text-gray-600">
                {formatDate(cancellationBooking.serviceDate)} at {cancellationBooking.serviceTime}
              </p>
            </div>

            <label className="mt-5 block text-sm font-medium text-gray-700">
              Message to include in the email
              <textarea
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Example: Terry had an emergency come up and needs to reschedule. Please choose another day that works for you."
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancellationModal}
                disabled={cancellationSaving}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={submitCancellation}
                disabled={cancellationSaving}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancellationSaving ? 'Sending...' : 'Cancel Appointment & Email Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
