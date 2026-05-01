import React from 'react';
import { useAuthStore } from '../store/authStore';
import { BarChart3, FileText, DollarSign, Calendar } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Invoices</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <FileText size={40} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Revenue</p>
              <p className="text-3xl font-bold">$0</p>
            </div>
            <DollarSign size={40} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Bookings</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <Calendar size={40} className="text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Expenses</p>
              <p className="text-3xl font-bold">$0</p>
            </div>
            <BarChart3 size={40} className="text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
        <ul className="space-y-3 text-gray-600">
          <li className="flex items-start">
            <span className="text-green-500 mr-3">✓</span>
            <span>Navigate to Invoices to create and manage your invoices</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-3">✓</span>
            <span>Track your business expenses in the Expenses section</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-3">✓</span>
            <span>Customers can book appointments through their portal</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-3">✓</span>
            <span>Send invoices directly to customers via email</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardPage;
