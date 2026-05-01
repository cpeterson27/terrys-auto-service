import React from 'react';
import { useAuthStore } from '../store/authStore';

const CustomerPortalPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-gray-600 mt-2">View and manage your invoices</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Invoice #</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Issue Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No invoices available yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h2>
        <p className="text-blue-700">
          For questions about your invoices or to get in touch, contact Terry directly.
        </p>
      </div>
    </div>
  );
};

export default CustomerPortalPage;
