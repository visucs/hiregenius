import api from './api';

/**
 * Auth API calls — all route through Spring Boot.
 * React never calls any DB or AI service directly (Rules.md §1).
 */

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
};
