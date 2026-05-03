import React from 'react';
import { Plus } from 'lucide-react';
import { api, formatCurrency, formatDate } from '../lib/api';

interface Expense {
  _id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = React.useState('');

  const loadExpenses = React.useCallback(async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.expenses);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load expenses');
    }
  }, []);

  React.useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totals = React.useMemo(() => {
    const now = new Date();
    const monthTotal = expenses
      .filter((expense) => {
        const date = new Date(expense.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    const yearTotal = expenses
      .filter((expense) => new Date(expense.date).getFullYear() === now.getFullYear())
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      monthTotal,
      yearTotal,
      averageMonthly: yearTotal / (now.getMonth() + 1),
    };
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/expenses', {
        ...form,
        amount: Number(form.amount),
      });
      setForm({ description: '', category: '', amount: '', date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      await loadExpenses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not add expense');
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      await loadExpenses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete expense');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Expenses</h1>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add Expense</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Parts, tools, supplies..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
            Save Expense
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Expenses (Month)</p>
          <p className="text-3xl font-bold">{formatCurrency(totals.monthTotal)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Expenses (Year)</p>
          <p className="text-3xl font-bold">{formatCurrency(totals.yearTotal)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Average Monthly</p>
          <p className="text-3xl font-bold">{formatCurrency(totals.averageMonthly)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr className="border-b hover:bg-gray-50">
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No expenses recorded. Add one to track your business costs.
                </td>
              </tr>
            ) : expenses.map((expense) => (
              <tr key={expense._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{expense.description}</td>
                <td className="px-6 py-4 text-sm">{expense.category}</td>
                <td className="px-6 py-4 text-sm">{formatCurrency(expense.amount)}</td>
                <td className="px-6 py-4 text-sm">{formatDate(expense.date)}</td>
                <td className="px-6 py-4 text-right text-sm">
                  <button onClick={() => deleteExpense(expense._id)} className="text-red-600 hover:text-red-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesPage;
