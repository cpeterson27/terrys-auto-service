import React from 'react';
import { Mail, Megaphone, Phone, Search, Trash2, UserCheck } from 'lucide-react';
import { api, formatCurrency, formatDate } from '../lib/api';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified?: boolean;
  marketingOptIn?: boolean;
  marketingOptInAt?: string;
  createdAt?: string;
  bookingCount: number;
  invoiceCount: number;
  invoiceTotal: number;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [search, setSearch] = React.useState('');
  const [customerToDelete, setCustomerToDelete] = React.useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadCustomers = React.useCallback(async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load customers');
    }
  }, []);

  React.useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => (
      customer.name.toLowerCase().includes(query)
      || customer.email.toLowerCase().includes(query)
      || (customer.phone || '').toLowerCase().includes(query)
    ));
  }, [customers, search]);

  const deleteCustomer = async () => {
    if (!customerToDelete) {
      return;
    }

    setError('');
    setDeleteLoading(true);

    try {
      await api.delete(`/customers/${customerToDelete._id}`);
      setCustomerToDelete(null);
      await loadCustomers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 rounded-lg bg-gray-950 px-6 py-7 text-white shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">Customer Directory</p>
        <h1 className="mt-2 text-4xl font-bold">Customers</h1>
        <p className="mt-2 text-gray-300">View customer contact details, account status, appointments, and invoice activity.</p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-600">Active Customers</p>
          <p className="mt-1 text-3xl font-bold text-gray-950">{customers.length}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-600">Verified Emails</p>
          <p className="mt-1 text-3xl font-bold text-gray-950">{customers.filter((customer) => customer.emailVerified).length}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm text-gray-600">Customer Invoice Total</p>
          <p className="mt-1 text-3xl font-bold text-gray-950">
            {formatCurrency(customers.reduce((sum, customer) => sum + customer.invoiceTotal, 0))}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <label className="flex items-center gap-3 rounded-lg border border-gray-300 px-4 py-2">
          <Search size={18} className="text-gray-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full outline-none"
            placeholder="Search by name, email, or phone..."
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contact</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Marketing</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Activity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            ) : filteredCustomers.map((customer) => (
              <tr key={customer._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-950">{customer.name}</p>
                      <span className={`mt-1 inline-block rounded px-2 py-1 text-xs font-semibold ${
                        customer.emailVerified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {customer.emailVerified ? 'Email verified' : 'Email not verified'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <a href={`mailto:${customer.email}`} className="mb-2 flex items-center gap-2 text-blue-700 hover:text-blue-800">
                    <Mail size={16} />
                    {customer.email}
                  </a>
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-gray-700 hover:text-gray-950">
                      <Phone size={16} />
                      {customer.phone}
                    </a>
                  ) : (
                    <p className="text-gray-500">No phone on file</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${customer.marketingOptIn ? 'bg-violet-50 text-violet-800' : 'bg-gray-100 text-gray-600'}`}>
                    <Megaphone size={13} />
                    {customer.marketingOptIn ? 'Opted in' : 'Not opted in'}
                  </span>
                  {customer.marketingOptInAt ? <p className="mt-1.5 text-xs text-gray-500">Consent: {formatDate(customer.marketingOptInAt)}</p> : null}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <p>{customer.bookingCount} appointment{customer.bookingCount === 1 ? '' : 's'}</p>
                  <p>{customer.invoiceCount} invoice{customer.invoiceCount === 1 ? '' : 's'} · {formatCurrency(customer.invoiceTotal)}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {customer.createdAt ? formatDate(customer.createdAt) : 'Unknown'}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(customer)}
                    className="inline-flex items-center justify-end gap-1 rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Delete customer</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">Remove this customer?</h2>
            <p className="mt-2 text-gray-600">
              This deletes the customer login and related appointments/invoices. Use this for test accounts or records Terry intentionally wants removed.
            </p>
            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-950">{customerToDelete.name}</p>
              <p className="break-all text-sm text-gray-600">{customerToDelete.email}</p>
              {customerToDelete.phone && <p className="text-sm text-gray-600">{customerToDelete.phone}</p>}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={deleteLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Customer
              </button>
              <button
                type="button"
                onClick={deleteCustomer}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
