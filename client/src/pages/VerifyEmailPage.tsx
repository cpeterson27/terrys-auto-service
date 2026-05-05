import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('Verifying your email...');

  React.useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('This verification link is missing a token.');
        return;
      }

      try {
        const response = await api.get('/auth/verify-email', { params: { token } });
        setStatus('success');
        setMessage(response.data.message || 'Your email has been verified. You can now log in.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'This verification link is invalid or expired.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mb-5 flex justify-center">
          {status === 'success' ? (
            <CheckCircle className="text-green-600" size={48} />
          ) : status === 'error' ? (
            <XCircle className="text-red-600" size={48} />
          ) : (
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-950">Email Verification</h1>
        <p className="mt-3 text-gray-600">{message}</p>
        <Link
          to="/login"
          className="mt-6 inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
