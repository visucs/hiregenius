import api from './api';

/**
 * Auth API calls — all route through Spring Boot.
 * React never calls any DB or AI service directly (Rules.md §1).
 */

// TODO: replace with real POST /api/auth/google-login once the Auth Service's Google endpoint is built
export const mockGoogleLoginApiCall = async (payload) => {
  // Logs the payload shape to the console so it's visible during dev that the right data would be sent
  console.log('[Google Login Mock] Payload to /api/auth/google-login:', payload);

  // Simulate network round-trip delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Returns a fake AuthResponse matching the real contract shape
  return {
    token: `fake-jwt-google-${Math.random().toString(36).substring(2, 14)}`,
    role: payload.role || 'CANDIDATE',
  };
};

export const authService = {
  /**
   * POST /auth/login
   * @param {{ email: string, password: string }} credentials
   * @returns {{ token: string, user: object }}
   */
  login: (credentials) => api.post('/auth/login', credentials),

  /**
   * POST /auth/register
   * @param {{ name: string, email: string, password: string, role: string }} data
   */
  register: (data) => api.post('/auth/register', data),

  /**
   * POST /auth/forgot-password
   * @param {{ email: string }} data
   */
  forgotPassword: (data) => api.post('/auth/forgot-password', data),

  /**
   * Google OAuth Login/Registration
   * @param {{ idToken: string, role?: string }} payload
   */
  // TODO: replace with real POST /api/auth/google-login once the Auth Service's Google endpoint is built
  googleLogin: (payload) => mockGoogleLoginApiCall(payload),
};
