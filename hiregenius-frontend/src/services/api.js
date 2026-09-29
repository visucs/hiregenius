import axios from 'axios';
import store from '../store/store';
import { logout } from '../features/auth/authSlice';

/**
 * Configured Axios instance.
 * Base URL comes from env var — never hardcoded.
 * Interceptor attaches "Authorization: Bearer <token>" to every request.
 * 401 responses auto-logout the user.
 */
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';
const authBaseURL = rawBaseURL.endsWith('/api')
  ? rawBaseURL
  : `${rawBaseURL.replace(/\/+$/, '')}/api`;

const rawCoreURL = import.meta.env.VITE_CORE_API_URL || '/api';
const coreBaseURL = rawCoreURL.endsWith('/api')
  ? rawCoreURL
  : `${rawCoreURL.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: authBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach JWT, route Core API endpoints, and ensure 30s timeout for cold starts
api.interceptors.request.use(
  (config) => {
    // Route jobs, candidates, applications, interviews, notifications, and analytics endpoints to Core API
    const isCoreRequest = config.url && (
      config.url.startsWith('/jobs') || config.url.startsWith('jobs') ||
      config.url.startsWith('/candidates') || config.url.startsWith('candidates') ||
      config.url.startsWith('/applications') || config.url.startsWith('applications') ||
      config.url.startsWith('/interviews') || config.url.startsWith('interviews') ||
      config.url.startsWith('/notifications') || config.url.startsWith('notifications') ||
      config.url.startsWith('/recruiters') || config.url.startsWith('recruiters') ||
      config.url.startsWith('/analytics') || config.url.startsWith('analytics') ||
      config.url.startsWith('/admin/settings') || config.url.startsWith('admin/settings') ||
      config.url.startsWith('/admin/health') || config.url.startsWith('admin/health') ||
      ((['get', 'delete'].includes(config.method?.toLowerCase())) && /^\/?admin\/users\/\d+/.test(config.url))
    );
    if (isCoreRequest) {
      config.baseURL = coreBaseURL;
    } else {
      config.baseURL = authBaseURL;
    }

    // Ensure all auth-related requests have at least 30000ms timeout
    const isAuthRequest = config.url && (
      config.url.includes('/auth/login') ||
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/google-login') ||
      config.url.includes('/auth/forgot-password') ||
      config.url.includes('/auth/reset-password') ||
      config.url.includes('/auth/verify-email') ||
      config.url.includes('/auth/verify-email-otp') ||
      config.url.includes('/auth/resend-otp') ||
      config.url.includes('/auth/resend-verification')
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
