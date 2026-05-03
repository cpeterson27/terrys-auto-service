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

const BookingPage: React.FC = () => {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [slots, setSlots] = React.useState<Slot[]>(SERVICE_TIMES.map((time) => ({ time, available: true })));
  const [form, setForm] = React.useState({
    serviceDate: '',
    serviceTime: '',
    vehicleInfo: '',
    description: '',
  });
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not book appointment');
    } finally {
      setLoading(false);
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
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Date
              </label>
              <input
                type="date"
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
              disabled={loading}
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
            Available Slots
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            {!form.serviceDate ? (
              <p>Choose a service date to see open times.</p>
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
              Times marked booked already have a pending or confirmed appointment.
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
                <span className="text-sm font-medium capitalize text-blue-700">{booking.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
