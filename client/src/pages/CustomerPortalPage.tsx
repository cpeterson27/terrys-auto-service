import React from 'react';
import { api, formatCurrency, formatDate } from '../lib/api';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  issuedDate: string;
  dueDate: string;
}

const CustomerPortalPage: React.FC = () => {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const loadInvoices = async () => {
      try {
        const response = await api.get('/invoices');
        setInvoices(response.data.invoices);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Could not load invoices');
      }
    };

    loadInvoices();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-gray-600 mt-2">View and manage your invoices</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

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
            {invoices.length === 0 ? (
              <tr className="border-b hover:bg-gray-50">
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No invoices available yet.
                </td>
              </tr>
            ) : invoices.map((invoice) => (
              <tr key={invoice._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm">{formatCurrency(invoice.totalAmount)}</td>
                <td className="px-6 py-4 text-sm capitalize">{invoice.status}</td>
                <td className="px-6 py-4 text-sm">{formatDate(invoice.issuedDate)}</td>
                <td className="px-6 py-4 text-sm">{formatDate(invoice.dueDate)}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">Contact Terry</td>
              </tr>
            ))}
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
