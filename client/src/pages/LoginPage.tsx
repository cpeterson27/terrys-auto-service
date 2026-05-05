import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  React.useEffect(() => {
    const state = location.state as { message?: string } | null;

    if (state?.message) {
      setMessage(state.message);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, {
        ...(mode === 'signup' ? { name, phone } : {}),
        email,
        password,
      });

      if (mode === 'signup') {
        setMessage(response.data.message || 'Account created. Please check your email to verify your account.');
        setPassword('');
        setMode('login');
        return;
      }

      const { user, accessToken } = response.data;
      login(user, accessToken);
      navigate(user.role === 'admin' ? '/dashboard' : '/portal');
    } catch (err: any) {
      setError(err.response?.data?.error || `${mode === 'login' ? 'Login' : 'Signup'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((currentMode) => (currentMode === 'login' ? 'signup' : 'login'));
    setError('');
    setMessage('');
  };

  const resendVerification = async () => {
    setError('');
    setMessage('');
    setResendLoading(true);

    try {
      const response = await api.post('/auth/resend-verification', { email });
      setMessage(response.data.message || 'Verification email sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Terry's Auto Service</h1>
        <h2 className="text-xl font-semibold text-center mb-6 text-gray-700">
          {mode === 'login' ? 'Login' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Phone</label>
                <input
                  name="tel"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                  autoComplete="tel"
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
        {mode === 'login' && (
          <button
            type="button"
            onClick={resendVerification}
            disabled={resendLoading || !email}
            className="mt-3 w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend verification email'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
