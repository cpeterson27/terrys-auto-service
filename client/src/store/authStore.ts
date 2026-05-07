import { create } from 'zustand';
import { api } from '../lib/api';

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'admin' | 'customer';
  emailVerified?: boolean;
}

interface AuthStore {
  user: AuthUser | null;
  sessionLoading: boolean;
  hydrateSession: () => Promise<void>;
  login: (user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Partial<AuthUser>;
  return Boolean(user.userId && user.email && (user.role === 'admin' || user.role === 'customer'));
};

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    if (isAuthUser(parsedUser)) {
      return parsedUser;
    }
  } catch {
    // Fall through and clear invalid persisted auth below.
  }

  localStorage.removeItem('user');
  return null;
};

const storedUser = getStoredUser();

export const useAuthStore = create<AuthStore>((set) => ({
  user: storedUser,
  sessionLoading: true,

  hydrateSession: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      const user = response.data.user;

      if (isAuthUser(user)) {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, sessionLoading: false });
        return;
      }
    } catch {
      localStorage.removeItem('user');
    }

    set({ user: null, sessionLoading: false });
  },

  login: (user: AuthUser) => {
    if (!isAuthUser(user)) {
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));
    set({ user, sessionLoading: false });
  },

  logout: () => {
    api.post('/auth/logout').catch(() => {
      // Local logout should still complete if the network request fails.
    });
    localStorage.removeItem('user');
    set({ user: null, sessionLoading: false });
  },

  setUser: (user: AuthUser) => {
    if (!isAuthUser(user)) {
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
