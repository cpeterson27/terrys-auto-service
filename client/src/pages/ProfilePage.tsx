import React from 'react';
import { KeyRound, User } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [profileForm, setProfileForm] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [passwordLoading, setPasswordLoading] = React.useState(false);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        const freshUser = response.data.user;
        setUser(freshUser);
        setProfileForm({
          name: freshUser.name || '',
          email: freshUser.email || '',
          phone: freshUser.phone || '',
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Could not load profile');
      }
    };

    loadProfile();
  }, [setUser]);

  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setProfileLoading(true);

    try {
      const response = await api.patch('/auth/profile', profileForm);
      setUser(response.data.user);
      setMessage(response.data.message || 'Profile updated.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await api.patch('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage(response.data.message || 'Password updated.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account contact information and password.</p>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <form onSubmit={submitProfile} className="rounded-lg bg-white p-6 shadow">
          <div className="mb-5 flex items-center gap-3">
            <User className="text-blue-600" size={26} />
            <div>
              <h2 className="text-2xl font-bold text-gray-950">Account Details</h2>
              <p className="text-sm text-gray-600">Update the information used for appointments and invoices.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
              {user?.emailVerified === false && (
                <p className="mt-2 text-sm text-yellow-700">This email still needs to be verified.</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="mt-6 w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <form onSubmit={submitPassword} className="rounded-lg bg-white p-6 shadow">
          <div className="mb-5 flex items-center gap-3">
            <KeyRound className="text-blue-600" size={26} />
            <div>
              <h2 className="text-2xl font-bold text-gray-950">Password</h2>
              <p className="text-sm text-gray-600">Change your password using your current password.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="mt-6 w-full rounded-lg bg-gray-900 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
