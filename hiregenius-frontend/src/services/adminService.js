import api from './api';

/**
 * Admin Service
 * Handles platform management, user administration, system health, and global analytics.
 * Endpoints are routed transparently:
 * - /admin/users -> Spring Boot Auth Service (:8080)
 * - /admin/settings, /admin/health, /analytics/admin/* -> Node.js Core API (:4000)
 */
export const adminService = {
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  approveRecruiter: (id) => api.patch(`/admin/users/${id}/approve`),
  updateUserPrivileges: (id, payload) => api.patch(`/admin/users/${id}/privileges`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Platform Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (payload) => api.patch('/admin/settings', payload),

  // Platform System Health
  getHealth: () => api.get('/admin/health'),

  // Platform Analytics
  getSummary: () => api.get('/analytics/admin/summary'),
  getTrend: (params) => api.get('/analytics/admin/trend', { params }),
  getTopSkills: (params) => api.get('/analytics/admin/top-skills', { params }),
  getTopRecruiters: (params) => api.get('/analytics/admin/top-recruiters', { params }),
};

export default adminService;
