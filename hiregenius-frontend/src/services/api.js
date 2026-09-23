import axios from 'axios';
import store from '../store/store';
import { logout } from '../features/auth/authSlice';

/**
 * Configured Axios instance.
 * Base URL comes from env var — never hardcoded.
 * Interceptor attaches "Authorization: Bearer <token>" to every request.
 * 401 responses auto-logout the user.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',

  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach JWT and ensure auth requests have 30s timeout for cold starts
api.interceptors.request.use(
  (config) => {
    // Ensure all auth-related requests have at least 30000ms timeout
    const isAuthRequest = config.url && (
      config.url.includes('/auth/login') ||
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/google-login') ||
      config.url.includes('/auth/forgot-password') ||
      config.url.includes('/auth/reset-password')
    );
    if (isAuthRequest && (!config.timeout || config.timeout < 30000)) {
      config.timeout = 30000;
    }

    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
