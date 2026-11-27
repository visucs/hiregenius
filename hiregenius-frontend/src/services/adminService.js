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
  verifyUserEmail: (id) => api.patch(`/admin/users/${id}/verify-email`),
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

  // Step-Up Authentication
  createStepUpToken: (payload) => api.post('/admin/step-up', payload),

  // AI Provider & Model Configuration
  getAIConfig: () => api.get('/admin/ai-config'),
  saveAICredential: (provider, apiKey, stepUpToken) =>
    api.put(`/admin/ai-config/credentials/${encodeURIComponent(provider)}`, { api_key: apiKey }, {
      headers: { 'X-Step-Up-Token': stepUpToken },
    }),
  deleteAICredential: (provider, confirmationPhrase, stepUpToken) =>
    api.delete(`/admin/ai-config/credentials/${encodeURIComponent(provider)}`, {
      data: { confirmation_phrase: confirmationPhrase },
      headers: { 'X-Step-Up-Token': stepUpToken },
    }),
  recheckAICredential: (provider) =>
    api.post(`/admin/ai-config/credentials/${encodeURIComponent(provider)}/recheck`),
  createAIDraft: (tasks, note) =>
    api.post('/admin/ai-config/drafts', { tasks, note }),
  testAIDraft: (version) =>
    api.post(`/admin/ai-config/drafts/${encodeURIComponent(version)}/test`),
  activateAIConfig: (payload, stepUpToken) =>
    api.post('/admin/ai-config/activate', payload, {
      headers: { 'X-Step-Up-Token': stepUpToken },
    }),
  rollbackAIConfig: (payload, stepUpToken) =>
    api.post('/admin/ai-config/rollback', payload, {
      headers: { 'X-Step-Up-Token': stepUpToken },
    }),
  getAIConfigHistory: (limit = 50) =>
    api.get('/admin/ai-config/history', { params: { limit } }),
};

export default adminService;
