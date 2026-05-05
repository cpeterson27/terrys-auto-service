import React from 'react';
import { Calendar } from 'lucide-react';
import { api, formatDate } from '../lib/api';

interface Booking {
  _id: string;
  serviceDate: string;
  serviceTime: string;
  vehicleInfo: string;
  description: string;
  status: string;
}

const SERVICE_TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'];

interface Slot {
  time: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  openCount: number;
  slots: Slot[];
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const BookingPage: React.FC = () => {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [slots, setSlots] = React.useState<Slot[]>(SERVICE_TIMES.map((time) => ({ time, available: true })));
  const [availabilityDays, setAvailabilityDays] = React.useState<DayAvailability[]>([]);
  const [form, setForm] = React.useState({
    serviceDate: '',
    serviceTime: '',
    vehicleInfo: '',
    description: '',
  });
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [bookingToCancel, setBookingToCancel] = React.useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const loadBookings = React.useCallback(async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.bookings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load appointments');
    }
  }, []);

  React.useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const loadAvailabilityRange = React.useCallback(async () => {
    try {
      const response = await api.get('/bookings/availability-range', {
        params: { start: todayKey(), days: 14 },
      });
      setAvailabilityDays(response.data.availability || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load upcoming availability');
    }
  }, []);

  React.useEffect(() => {
    loadAvailabilityRange();
  }, [loadAvailabilityRange]);

  React.useEffect(() => {
    const loadAvailability = async () => {
      if (!form.serviceDate) {
        setSlots(SERVICE_TIMES.map((time) => ({ time, available: true })));
        return;
      }

      try {
        const response = await api.get('/bookings/availability', {
          params: { date: form.serviceDate },
        });
        setSlots(response.data.slots);

        const selectedSlot = response.data.slots.find((slot: Slot) => slot.time === form.serviceTime);
        if (selectedSlot && !selectedSlot.available) {
          setForm((currentForm) => ({ ...currentForm, serviceTime: '' }));
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Could not load availability');
      }
    };

    loadAvailability();
  }, [form.serviceDate, form.serviceTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/bookings', form);
      setForm({ serviceDate: '', serviceTime: '', vehicleInfo: '', description: '' });
      setSlots(SERVICE_TIMES.map((time) => ({ time, available: true })));
      setMessage('Appointment request sent. Terry will confirm it soon.');
      await loadBookings();
      await loadAvailabilityRange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not book appointment');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async () => {
    if (!bookingToCancel) {
      return;
    }

    setError('');
    setMessage('');
    setCancelLoading(true);

    try {
      await api.patch(`/bookings/${bookingToCancel._id}/customer-cancel`, { reason: cancelReason });
      setBookingToCancel(null);
      setCancelReason('');
      setMessage('Your appointment has been cancelled. Terry has been notified.');
      await loadBookings();
      await loadAvailabilityRange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not cancel appointment');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Book an Appointment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Schedule Service</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}
          
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 font-semibold text-gray-950">Pick an upcoming day</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {availabilityDays.map((day) => {
                const selected = form.serviceDate === day.date;
                const hasOpenings = day.openCount > 0;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setForm({ ...form, serviceDate: day.date, serviceTime: '' })}
                    className={`rounded-lg border p-3 text-left transition ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'} ${!hasOpenings ? 'opacity-70' : ''}`}
                  >
                    <p className="font-semibold text-gray-950">{formatDate(day.date)}</p>
                    <p className={`mt-1 text-sm ${hasOpenings ? 'text-green-700' : 'text-red-700'}`}>
                      {hasOpenings ? `${day.openCount} open time${day.openCount === 1 ? '' : 's'}` : 'Fully booked'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {form.serviceDate && (
            <div className="mb-6 rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 font-semibold text-gray-950">Choose a time</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setForm({ ...form, serviceTime: slot.time })}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                      form.serviceTime === slot.time
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : slot.available
                          ? 'border-green-200 bg-green-50 text-green-800 hover:border-green-500'
                          : 'border-gray-200 bg-gray-100 text-gray-400'
                    }`}
                  >
                    {slot.time}
                    <span className="block text-xs font-medium">{slot.available ? 'Open' : 'Booked'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Date
              </label>
              <input
                type="date"
                min={todayKey()}
                value={form.serviceDate}
                onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <select
                value={form.serviceTime}
                onChange={(e) => setForm({ ...form, serviceTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select time slot</option>
                {slots.map((slot) => (
                  <option key={slot.time} value={slot.time} disabled={!slot.available}>
                    {slot.time}{slot.available ? '' : ' - booked'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Information
              </label>
              <input
                type="text"
                placeholder="e.g., 2020 Honda Civic"
                value={form.vehicleInfo}
                onChange={(e) => setForm({ ...form, vehicleInfo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe the service you need..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !form.serviceDate || !form.serviceTime}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        </div>

        {/* Availability Sidebar */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Calendar className="mr-2" size={20} />
            Selected Day
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            {!form.serviceDate ? (
              <p>Choose a day to see open times.</p>
            ) : slots.map((slot) => (
              <div key={slot.time} className="flex items-center justify-between gap-3">
                <span>{slot.time}</span>
                <span className={slot.available ? 'text-green-700 font-medium' : 'text-gray-400'}>
                  {slot.available ? 'Open' : 'Booked'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Heads up
            </p>
            <p className="text-sm text-blue-700">
              Times marked booked already have an appointment on Terry's schedule.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Your Appointments</h3>
        {bookings.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No appointments booked yet.
          </div>
        ) : (
          <div className="divide-y">
            {bookings.map((booking) => (
              <div key={booking._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-semibold">{formatDate(booking.serviceDate)} at {booking.serviceTime}</p>
                  <p className="text-sm text-gray-600">{booking.vehicleInfo}</p>
                  <p className="text-sm text-gray-600">{booking.description}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-sm font-medium capitalize text-blue-700">{booking.status}</span>
                  {['pending', 'confirmed'].includes(booking.status) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setBookingToCancel(booking);
                        setCancelReason('');
                      }}
                      className="rounded bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">No action available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Cancel appointment</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">Let Terry know you cannot make it</h2>
            <p className="mt-2 text-gray-600">
              This will cancel your appointment and email Terry so he knows the time is open again.
            </p>

            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-950">
                {formatDate(bookingToCancel.serviceDate)} at {bookingToCancel.serviceTime}
              </p>
              <p className="mt-1 text-sm text-gray-600">{bookingToCancel.vehicleInfo}</p>
              <p className="text-sm text-gray-600">{bookingToCancel.description}</p>
            </div>

            <label className="mt-5 block text-sm font-medium text-gray-700">
              Optional note for Terry
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                rows={4}
                placeholder="Example: Something came up and I need to reschedule."
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setBookingToCancel(null);
                  setCancelReason('');
                }}
                disabled={cancelLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={cancelAppointment}
                disabled={cancelLoading}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
