import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const authUrl = originalRequest?.url || '';
    const isSessionRequest = [
      '/auth/login',
      '/auth/logout',
      '/auth/register',
      '/auth/refresh-token',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/resend-verification',
      '/auth/verify-email',
    ].some((path) => authUrl.includes(path));

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isSessionRequest) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await api.post('/auth/refresh-token');

        if (refreshResponse.data.user) {
          localStorage.setItem('user', JSON.stringify(refreshResponse.data.user));
        }

        return api(originalRequest);
      } catch {
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    } else if (error.response?.status === 401 && !isSessionRequest) {
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
