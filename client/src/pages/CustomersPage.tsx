import React from 'react';
import { Mail, Phone, Search, UserCheck } from 'lucide-react';
import { api, formatCurrency, formatDate } from '../lib/api';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified?: boolean;
  createdAt?: string;
  bookingCount: number;
  invoiceCount: number;
  invoiceTotal: number;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [search, setSearch] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await api.get('/customers');
        setCustomers(response.data.customers || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Could not load customers');
      }
    };

    loadCustomers();
  }, []);

  const filteredCustomers = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => (
      customer.name.toLowerCase().includes(query)
      || customer.email.toLowerCase().includes(query)
      || (customer.phone || '').toLowerCase().includes(query)
    ));
  }, [customers, search]);

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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Activity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
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
                <td className="px-6 py-4 text-sm text-gray-700">
                  <p>{customer.bookingCount} appointment{customer.bookingCount === 1 ? '' : 's'}</p>
                  <p>{customer.invoiceCount} invoice{customer.invoiceCount === 1 ? '' : 's'} · {formatCurrency(customer.invoiceTotal)}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {customer.createdAt ? formatDate(customer.createdAt) : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersPage;
