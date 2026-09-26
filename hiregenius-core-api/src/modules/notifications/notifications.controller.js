const notificationsService = require('./notifications.service');
const ApiResponse = require('../../utils/ApiResponse');

class NotificationsController {
  async getMyNotifications(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const result = await notificationsService.getMyNotifications(userId, req.query);
      return ApiResponse.success(res, result, 'Notifications retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const updated = await notificationsService.markAsRead(req.params.id, userId);
      return ApiResponse.success(res, updated, 'Notification marked as read');
    } catch (err) {
      return next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const result = await notificationsService.markAllAsRead(userId);
      return ApiResponse.success(res, result, 'All notifications marked as read');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new NotificationsController();
