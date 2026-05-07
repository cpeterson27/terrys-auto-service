import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

const BLOCKED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'test.com',
  'invalid.com',
  'fake.com',
  'email.com',
]);

const getEmailValidationError = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const [localPart, domain] = normalizedEmail.split('@');

  if (!emailPattern.test(normalizedEmail)) {
    return 'Please enter a valid email address.';
  }

  if (!localPart || localPart.length < 2 || !domain || BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return 'Please enter a valid email address you can access — we’ll use it to send important updates.';
  }

  return '';
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'verifyHelp'>(
    () => (searchParams.get('token') ? 'reset' : 'login')
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (mode === 'signup') {
      const emailValidationError = getEmailValidationError(email);

      if (emailValidationError) {
        setError(emailValidationError);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'forgot') {
        const response = await api.post('/auth/forgot-password', { email });
        setMessage(response.data.message || 'If an account exists for that email, a password reset link has been sent.');
        return;
      }

      if (mode === 'verifyHelp') {
        const response = await api.post('/auth/resend-verification', { email });
        setMessage(response.data.message || 'Verification email sent. Please check your inbox.');
        return;
      }

      if (mode === 'reset') {
        const response = await api.post('/auth/reset-password', {
          token: searchParams.get('token'),
          password,
        });
        const { user } = response.data;
        login(user);
        setMessage(response.data.message || 'Password updated. Redirecting...');
        setTimeout(() => navigate('/'), 900);
        return;
      }

      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, {
        ...(mode === 'signup' ? { name, phone, marketingOptIn } : {}),
        email,
        password,
      });

      if (mode === 'signup') {
        setMessage(response.data.message || 'Account created. Please check your email to verify your account.');
        setPassword('');
        setMode('verifyHelp');
        return;
      }

      const { user } = response.data;
      login(user);
      navigate('/');
    } catch (err: any) {
      const fallbackError = mode === 'login'
        ? 'Login failed'
        : mode === 'signup'
          ? 'Signup failed'
          : mode === 'forgot'
            ? 'Could not send reset email'
            : mode === 'verifyHelp'
              ? 'Could not send verification email'
              : 'Could not reset password';

      setError(err.response?.data?.error || fallbackError);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((currentMode) => (currentMode === 'login' ? 'signup' : 'login'));
    setError('');
    setMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Terry's Auto Service</h1>
        <h2 className="text-xl font-semibold text-center mb-6 text-gray-700">
          {mode === 'signup'
            ? 'Create Account'
            : mode === 'forgot'
              ? 'Reset Password'
              : mode === 'reset'
                ? 'Choose New Password'
                : mode === 'verifyHelp'
                  ? 'Verify Your Email'
                  : 'Login'}
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
                <label className="block text-gray-700 font-medium mb-2">Cell Phone</label>
                <input
                  name="tel"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Best number for Terry to reach you"
                  autoComplete="tel"
                  required
                />
              </div>
            </>
          )}

          {mode !== 'reset' && (
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
            {mode === 'signup' && (
              <p className="mt-2 text-sm text-gray-500">
                Use an email you can open. We will send a verification link before the account can log in.
              </p>
            )}
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
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
          )}

          {mode === 'signup' && (
            <label className="mb-6 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(event) => setMarketingOptIn(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>Yes, I want to receive deals, service reminders, and special offers from Terry's Auto Service.</span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login'
                : mode === 'signup'
                  ? 'Create Account'
                  : mode === 'forgot'
                    ? 'Send Reset Link'
                    : mode === 'verifyHelp'
                      ? 'Send Verification Email'
                      : 'Update Password'}
          </button>
        </form>

        {mode === 'login' || mode === 'signup' ? (
          <button
            type="button"
            onClick={toggleMode}
            className="mt-4 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setMessage('');
            }}
            className="mt-4 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to login
          </button>
        )}
        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError('');
              setMessage('');
            }}
            className="mt-3 w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Forgot your password?
          </button>
        )}
        {mode === 'signup' && (
          <button
            type="button"
            onClick={() => {
              setMode('verifyHelp');
              setError('');
              setMessage('');
            }}
            className="mt-3 w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Need a new verification email?
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
