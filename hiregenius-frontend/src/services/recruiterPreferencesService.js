import api from './api';

/**
 * Service for Recruiter Preferences endpoints.
 * Interacts with Core API (/api/recruiters/me/notification-preferences).
 * Bearer JWT is attached automatically by the api Axios client.
 */
export const recruiterPreferencesService = {
  /**
   * Get notification preferences for the authenticated recruiter
   * GET /api/recruiters/me/notification-preferences
   */
  getPreferences: async () => {
    const res = await api.get('/recruiters/me/notification-preferences');
    return res.data;
  },

  /**
   * Update notification preferences for the authenticated recruiter
   * PATCH /api/recruiters/me/notification-preferences
   * @param {{ notify_on_new_application?: boolean, job_alert_dispatch_enabled?: boolean }} updates
   */
  updatePreferences: async (updates) => {
    const res = await api.patch('/recruiters/me/notification-preferences', updates);
    return res.data;
  },
};

export default recruiterPreferencesService;
