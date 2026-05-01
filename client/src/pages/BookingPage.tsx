import React from 'react';
import { Plus, Calendar } from 'lucide-react';

const BookingPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Book an Appointment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Schedule Service</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select time slot</option>
                <option>9:00 AM</option>
                <option>10:00 AM</option>
                <option>11:00 AM</option>
                <option>1:00 PM</option>
                <option>2:00 PM</option>
                <option>3:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Information
              </label>
              <input
                type="text"
                placeholder="e.g., 2020 Honda Civic"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe the service you need..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              Book Appointment
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
            <p>🟢 Morning slots available</p>
            <p>🟡 Afternoon slots limited</p>
            <p>🔴 Evening slots full</p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              💡 Pro Tip
            </p>
            <p className="text-sm text-blue-700">
              Book early for better availability. We typically confirm appointments within 1 hour.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Your Appointments</h3>
        <div className="text-center text-gray-500 py-8">
          No appointments booked yet.
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
