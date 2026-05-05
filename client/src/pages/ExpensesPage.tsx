import React from 'react';
import { Download, Plus, Printer, Trash2 } from 'lucide-react';
import { api, formatCurrency, formatDate } from '../lib/api';

interface Expense {
  _id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  receipt?: string;
}

interface TaxInvoice {
  _id: string;
  invoiceNumber: string;
  customerId?: { name?: string; email?: string };
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  status: string;
  issuedDate?: string;
  dueDate: string;
}

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [expenseToDelete, setExpenseToDelete] = React.useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [reportLoading, setReportLoading] = React.useState(false);
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

  const deleteExpense = async () => {
    if (!expenseToDelete) {
      return;
    }

    setDeleteLoading(true);
    setError('');

    try {
      await api.delete(`/expenses/${expenseToDelete._id}`);
      setExpenseToDelete(null);
      await loadExpenses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete expense');
    } finally {
      setDeleteLoading(false);
    }
  };

  const escapeCsv = (value: string | number | undefined | null) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const moneyValue = (amount: number | undefined) => Number(amount || 0).toFixed(2);

  const escapeHtml = (value: string | number | undefined | null) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return String(value ?? '').replace(/[&<>"']/g, (character) => replacements[character]);
  };

  const loadTaxExportData = async () => {
    const [expenseResponse, invoiceResponse] = await Promise.all([
      api.get('/expenses'),
      api.get('/invoices'),
    ]);
    const exportExpenses: Expense[] = expenseResponse.data.expenses || [];
    const invoices: TaxInvoice[] = invoiceResponse.data.invoices || [];
    const categoryTotals = exportExpenses.reduce<Record<string, number>>((totalsByCategory, expense) => {
      const category = expense.category || 'Uncategorized';
      return {
        ...totalsByCategory,
        [category]: (totalsByCategory[category] || 0) + expense.amount,
      };
    }, {});
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
    const totalExpenses = exportExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const paidRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    return {
      categoryTotals,
      exportExpenses,
      invoices,
      paidRevenue,
      totalExpenses,
    };
  };

  const exportTaxCsv = async () => {
    setExportLoading(true);
    setError('');

    try {
      const { categoryTotals, exportExpenses, invoices, paidRevenue, totalExpenses } = await loadTaxExportData();
      const rows = [
        ['Terry Auto Service Tax Export'],
        ['Generated', new Date().toISOString()],
        [],
        ['Summary'],
        ['Total Expenses', moneyValue(totalExpenses)],
        ['Paid Invoice Revenue', moneyValue(paidRevenue)],
        ['Net Before Other Adjustments', moneyValue(paidRevenue - totalExpenses)],
        [],
        ['Expense Totals by Category'],
        ['Category', 'Total'],
        ...Object.entries(categoryTotals)
          .sort(([firstCategory], [secondCategory]) => firstCategory.localeCompare(secondCategory))
          .map(([category, total]) => [category, moneyValue(total)]),
        [],
        ['Expenses'],
        ['Date', 'Category', 'Description', 'Amount', 'Receipt'],
        ...exportExpenses.map((expense) => [
          new Date(expense.date).toISOString().slice(0, 10),
          expense.category,
          expense.description,
          moneyValue(expense.amount),
          expense.receipt || '',
        ]),
        [],
        ['Invoices'],
        ['Invoice Number', 'Customer', 'Status', 'Issued Date', 'Due Date', 'Subtotal', 'Tax', 'Total'],
        ...invoices.map((invoice) => [
          invoice.invoiceNumber,
          invoice.customerId?.name || invoice.customerId?.email || '',
          invoice.status,
          invoice.issuedDate ? new Date(invoice.issuedDate).toISOString().slice(0, 10) : '',
          invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : '',
          moneyValue(invoice.subtotal),
          moneyValue(invoice.taxAmount),
          moneyValue(invoice.totalAmount),
        ]),
      ];
      const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `terrys-auto-tax-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not export tax report');
    } finally {
      setExportLoading(false);
    }
  };

  const printTaxReport = async () => {
    setReportLoading(true);
    setError('');

    try {
      const { categoryTotals, exportExpenses, invoices, paidRevenue, totalExpenses } = await loadTaxExportData();
      const generatedDate = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date());
      const categoryRows = Object.entries(categoryTotals)
        .sort(([firstCategory], [secondCategory]) => firstCategory.localeCompare(secondCategory))
        .map(([category, total]) => `
          <tr>
            <td>${escapeHtml(category)}</td>
            <td class="amount">${escapeHtml(formatCurrency(total))}</td>
          </tr>
        `)
        .join('');
      const expenseRows = exportExpenses
        .map((expense) => `
          <tr>
            <td>${escapeHtml(formatDate(expense.date))}</td>
            <td>${escapeHtml(expense.category)}</td>
            <td>${escapeHtml(expense.description)}</td>
            <td class="amount">${escapeHtml(formatCurrency(expense.amount))}</td>
          </tr>
        `)
        .join('');
      const invoiceRows = invoices
        .map((invoice) => `
          <tr>
            <td>${escapeHtml(invoice.invoiceNumber)}</td>
            <td>${escapeHtml(invoice.customerId?.name || invoice.customerId?.email || '')}</td>
            <td>${escapeHtml(invoice.status)}</td>
            <td>${escapeHtml(invoice.dueDate ? formatDate(invoice.dueDate) : '')}</td>
            <td class="amount">${escapeHtml(formatCurrency(invoice.totalAmount))}</td>
          </tr>
        `)
        .join('');
      const reportHtml = `
        <!doctype html>
        <html>
          <head>
            <title>Terry's Auto Service Tax Report</title>
            <style>
              * { box-sizing: border-box; }
              body {
                color: #111827;
                font-family: Arial, sans-serif;
                line-height: 1.45;
                margin: 0;
                padding: 32px;
              }
              .header {
                border-bottom: 2px solid #111827;
                margin-bottom: 24px;
                padding-bottom: 16px;
              }
              h1 {
                font-size: 28px;
                margin: 0 0 6px;
              }
              h2 {
                border-bottom: 1px solid #d1d5db;
                font-size: 18px;
                margin: 28px 0 12px;
                padding-bottom: 6px;
              }
              p { margin: 0; }
              .meta { color: #4b5563; }
              .summary {
                display: grid;
                gap: 12px;
                grid-template-columns: repeat(3, 1fr);
                margin: 24px 0;
              }
              .summary-card {
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 14px;
              }
              .label {
                color: #4b5563;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: .04em;
                text-transform: uppercase;
              }
              .value {
                font-size: 22px;
                font-weight: 800;
                margin-top: 6px;
              }
              table {
                border-collapse: collapse;
                margin-bottom: 20px;
                width: 100%;
              }
              th, td {
                border-bottom: 1px solid #e5e7eb;
                font-size: 12px;
                padding: 8px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background: #f3f4f6;
                font-size: 11px;
                letter-spacing: .03em;
                text-transform: uppercase;
              }
              .amount { text-align: right; white-space: nowrap; }
              .note {
                color: #4b5563;
                font-size: 12px;
                margin-top: 24px;
              }
              @media print {
                body { padding: 20px; }
                .summary { grid-template-columns: repeat(3, 1fr); }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Terry's Auto Service Tax Report</h1>
              <p class="meta">Generated ${escapeHtml(generatedDate)}</p>
            </div>

            <div class="summary">
              <div class="summary-card">
                <p class="label">Total Expenses</p>
                <p class="value">${escapeHtml(formatCurrency(totalExpenses))}</p>
              </div>
              <div class="summary-card">
                <p class="label">Paid Invoice Revenue</p>
                <p class="value">${escapeHtml(formatCurrency(paidRevenue))}</p>
              </div>
              <div class="summary-card">
                <p class="label">Net Before Adjustments</p>
                <p class="value">${escapeHtml(formatCurrency(paidRevenue - totalExpenses))}</p>
              </div>
            </div>

            <h2>Expense Totals by Category</h2>
            <table>
              <thead><tr><th>Category</th><th class="amount">Total</th></tr></thead>
              <tbody>${categoryRows || '<tr><td colspan="2">No expenses recorded.</td></tr>'}</tbody>
            </table>

            <h2>Expenses</h2>
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th class="amount">Amount</th></tr></thead>
              <tbody>${expenseRows || '<tr><td colspan="4">No expenses recorded.</td></tr>'}</tbody>
            </table>

            <h2>Invoices</h2>
            <table>
              <thead><tr><th>Invoice #</th><th>Customer</th><th>Status</th><th>Due Date</th><th class="amount">Total</th></tr></thead>
              <tbody>${invoiceRows || '<tr><td colspan="5">No invoices recorded.</td></tr>'}</tbody>
            </table>

            <p class="note">Prepared from records stored in Terry's Auto Service dashboard. Review with a tax professional before filing.</p>
          </body>
        </html>
      `;
      const reportWindow = window.open('', '_blank');

      if (!reportWindow) {
        setError('Could not open the tax report. Please allow popups for this site and try again.');
        return;
      }

      reportWindow.document.open();
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
      reportWindow.focus();
      reportWindow.print();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not create tax report');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Expenses</h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={printTaxReport}
            disabled={reportLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <Printer size={20} />
            <span>{reportLoading ? 'Preparing...' : 'Print Tax Report'}</span>
          </button>
          <button
            type="button"
            onClick={exportTaxCsv}
            disabled={exportLoading}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download size={20} />
            <span>{exportLoading ? 'Exporting...' : 'Download CSV'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>Add Expense</span>
          </button>
        </div>
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
                  <button
                    type="button"
                    onClick={() => setExpenseToDelete(expense)}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
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

      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Delete expense</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">Are you sure?</h2>
            <p className="mt-2 text-gray-600">
              This removes the expense record from Terry's business expenses. This cannot be undone.
            </p>

            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-950">{expenseToDelete.description}</p>
              <p className="mt-1 text-sm text-gray-600">
                {expenseToDelete.category} · {formatCurrency(expenseToDelete.amount)} · {formatDate(expenseToDelete.date)}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                disabled={deleteLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Expense
              </button>
              <button
                type="button"
                onClick={deleteExpense}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
