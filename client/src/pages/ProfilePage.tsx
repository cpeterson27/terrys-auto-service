import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
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
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteLoading, setDeleteLoading] = React.useState(false);

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

  const deleteProfile = async () => {
    setError('');
    setMessage('');
    setDeleteLoading(true);

    try {
      const response = await api.delete('/auth/profile', { data: { password: deletePassword } });
      logout();
      navigate('/login', {
        state: { message: response.data.message || 'Your profile has been deleted.' },
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not delete profile');
      setDeleteLoading(false);
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

      {user?.role === 'customer' && (
        <div className="mt-8 rounded-lg border border-red-200 bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-950">Delete Profile</h2>
          <p className="mt-2 text-gray-600">
            Delete your customer login and remove your personal contact details from the account. Terry's business records may still keep invoice and appointment history.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-5 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Delete My Profile
          </button>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Delete profile</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">This cannot be undone</h2>
            <p className="mt-2 text-gray-600">
              Enter your password to confirm. Your customer login will be deleted and you will be logged out.
            </p>
            <label className="mt-5 block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2"
                autoComplete="current-password"
              />
            </label>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword('');
                }}
                disabled={deleteLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Profile
              </button>
              <button
                type="button"
                onClick={deleteProfile}
                disabled={deleteLoading || !deletePassword}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
