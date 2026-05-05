import React from 'react';
import { Mail } from 'lucide-react';
import { api, formatCurrency, formatDate } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  issuedDate: string;
  dueDate: string;
}

const CustomerPortalPage: React.FC = () => {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [contactOpen, setContactOpen] = React.useState(false);
  const [contactSubject, setContactSubject] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [contactLoading, setContactLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
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

  const openContact = (invoice?: Invoice) => {
    setError('');
    setSuccess('');
    setContactSubject(invoice ? `Question about invoice ${invoice.invoiceNumber}` : 'Invoice question');
    setContactMessage('');
    setContactOpen(true);
  };

  const submitContact = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setContactLoading(true);

    try {
      await api.post('/contact', {
        name: user?.name || user?.email || 'Customer',
        email: user?.email,
        phone: user?.phone || '',
        subject: contactSubject,
        message: contactMessage,
        company: '',
      });
      setContactOpen(false);
      setContactSubject('');
      setContactMessage('');
      setSuccess('Your message has been sent to Terry.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not send your message');
    } finally {
      setContactLoading(false);
    }
  };

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
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
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
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    type="button"
                    onClick={() => openContact(invoice)}
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Mail size={16} />
                    Contact Terry
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h2>
            <p className="text-blue-700">
          For questions about your invoices or to get in touch, contact Terry directly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openContact()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            <Mail size={18} />
            Contact Terry
          </button>
        </div>
      </div>

      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={submitContact} className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Contact Terry</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950">Send a message</h2>
              <p className="mt-2 text-gray-600">Terry will receive this message from your customer account.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Subject</label>
                <input
                  value={contactSubject}
                  onChange={(event) => setContactSubject(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={5}
                  placeholder="Write your question for Terry..."
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                disabled={contactLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={contactLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {contactLoading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerPortalPage;
