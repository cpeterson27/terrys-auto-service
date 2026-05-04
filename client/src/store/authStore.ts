import { create } from 'zustand';

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'admin' | 'customer';
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
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
  localStorage.removeItem('token');
  return null;
};

const storedUser = getStoredUser();

export const useAuthStore = create<AuthStore>((set) => ({
  user: storedUser,
  token: storedUser ? localStorage.getItem('token') : null,

  login: (user: AuthUser, token: string) => {
    if (!isAuthUser(user)) {
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  setUser: (user: AuthUser) => set({ user }),
}));
