import React from 'react';
import { Mail } from 'lucide-react';
import { api, formatDate } from '../lib/api';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  createdAt: string;
}

const MessagesPage: React.FC = () => {
  const [messages, setMessages] = React.useState<ContactMessage[]>([]);
  const [error, setError] = React.useState('');

  const loadMessages = React.useCallback(async () => {
    try {
      const response = await api.get('/contact');
      setMessages(response.data.messages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load messages');
    }
  }, []);

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const updateStatus = async (id: string, status: ContactMessage['status']) => {
    try {
      await api.patch(`/contact/${id}`, { status });
      await loadMessages();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update message');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">Review service questions and appointment requests from the website.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((item) => (
            <article key={item._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-950">{item.subject}</h2>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {item.name} · {item.email}{item.phone ? ` · ${item.phone}` : ''}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(item.createdAt)}</p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => updateStatus(item._id, e.target.value as ContactMessage['status'])}
                  className="border border-gray-300 rounded px-3 py-2 capitalize"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{item.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
