import api from './api';

/**
 * Service for Core API Notifications endpoints (Phase 4).
 * Interacts with /api/notifications.
 * Bearer JWT is attached automatically by the api Axios client.
 */
export const notificationsService = {
  /**
   * Get notifications for authenticated user
   * GET /api/notifications/mine
   * @param {{ is_read?: boolean, unreadOnly?: boolean, page?: number, limit?: number }} params
   */
  getMyNotifications: async (params = {}) => {
    const res = await api.get('/notifications/mine', { params });
    return res.data;
  },

  /**
   * Mark a single notification as read
   * PATCH /api/notifications/:id/read
   * @param {number|string} id
   */
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark all unread notifications as read
   * PATCH /api/notifications/read-all
   */
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

export default notificationsService;
