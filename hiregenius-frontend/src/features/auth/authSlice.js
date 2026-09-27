import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'hg_token';
const USER_KEY = 'hg_user';

const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      localStorage.setItem(key, val);
    } catch {
      // ignore in restricted environments
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// Rehydrate from localStorage on page load
const initialState = {
  token: safeStorage.getItem(TOKEN_KEY) || null,
  user: (() => {
    try {
      const raw = safeStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })(),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { token, user, role } = action.payload;
      const resolvedRole = user?.role || role || 'CANDIDATE';
      const resolvedUser = user ? { ...user, role: resolvedRole } : { role: resolvedRole };
      state.token = token;
      state.user = resolvedUser;
      state.error = null;
      safeStorage.setItem(TOKEN_KEY, token);
      safeStorage.setItem(USER_KEY, JSON.stringify(resolvedUser));
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError(state) {
      state.error = null;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      state.isLoading = false;
      safeStorage.removeItem(TOKEN_KEY);
      safeStorage.removeItem(USER_KEY);
    },
  },
});

export const { setCredentials, setLoading, setError, clearError, logout } =
  authSlice.actions;

// Selectors
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
// Role is stored in user.role — set once at login, cleared on logout.
// Never decode JWT on every render.
export const selectUserRole = (state) => state.auth.user?.role ?? null;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
