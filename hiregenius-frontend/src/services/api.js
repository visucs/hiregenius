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
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
