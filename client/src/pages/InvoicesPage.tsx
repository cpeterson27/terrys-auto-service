import React from 'react';
import { Plus } from 'lucide-react';
import { api, formatCurrency, formatDate } from '../lib/api';

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId?: Customer;
  totalAmount: number;
  status: string;
  dueDate: string;
}

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    customerId: '',
    description: '',
    quantity: '1',
    unitPrice: '',
    dueDate: '',
    status: 'sent',
    notes: '',
  });
  const [error, setError] = React.useState('');

  const loadData = React.useCallback(async () => {
    try {
      const [invoiceResponse, customerResponse] = await Promise.all([
        api.get('/invoices'),
        api.get('/bookings/customers'),
      ]);
      setInvoices(invoiceResponse.data.invoices);
      setCustomers(customerResponse.data.customers);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load invoices');
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/invoices', {
        customerId: form.customerId,
        dueDate: form.dueDate,
        status: form.status,
        notes: form.notes,
        items: [
          {
            description: form.description,
            quantity: Number(form.quantity),
            unitPrice: Number(form.unitPrice),
          },
        ],
      });
      setForm({ customerId: '', description: '', quantity: '1', unitPrice: '', dueDate: '', status: 'sent', notes: '' });
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not create invoice');
    }
  };

  const updateStatus = async (invoiceId: string, status: string) => {
    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update invoice');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>New Invoice</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name || customer.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Brake service, oil change, diagnostic..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
            Create Invoice
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Invoice #</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr className="border-b hover:bg-gray-50">
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No invoices yet. Create one to get started.
                </td>
              </tr>
            ) : invoices.map((invoice) => (
              <tr key={invoice._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm">{invoice.customerId?.name || invoice.customerId?.email}</td>
                <td className="px-6 py-4 text-sm">{formatCurrency(invoice.totalAmount)}</td>
                <td className="px-6 py-4 text-sm">
                  <select
                    value={invoice.status}
                    onChange={(e) => updateStatus(invoice._id, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 capitalize"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm">{formatDate(invoice.dueDate)}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">View</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesPage;
