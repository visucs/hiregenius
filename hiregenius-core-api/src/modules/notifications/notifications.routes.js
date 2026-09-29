const express = require('express');
const notificationsController = require('./notifications.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const {
  getNotificationsQuerySchema,
  notificationIdParamSchema,
  validate,
} = require('./notifications.validation');

const router = express.Router();

/**
 * Notifications Routes (mounted at /api/notifications)
 * Any authenticated role (RECRUITER, CANDIDATE, ADMIN)
 */

// GET /api/notifications & /api/notifications/mine - View logged-in user notifications
router.get(
  '/',
  verifyJwt,
  requireRole('RECRUITER', 'CANDIDATE', 'ADMIN'),
  validate(getNotificationsQuerySchema, 'query'),
  (req, res, next) => notificationsController.getMyNotifications(req, res, next),
);

router.get(
  '/mine',
  verifyJwt,
  requireRole('RECRUITER', 'CANDIDATE', 'ADMIN'),
  validate(getNotificationsQuerySchema, 'query'),
  (req, res, next) => notificationsController.getMyNotifications(req, res, next),
);

// PATCH /api/notifications/read-all - Mark all user notifications as read
// Defined before /:id/read to prevent route shadowing
router.patch(
  '/read-all',
  verifyJwt,
  requireRole('RECRUITER', 'CANDIDATE', 'ADMIN'),
  (req, res, next) => notificationsController.markAllAsRead(req, res, next),
);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch(
  '/:id/read',
  verifyJwt,
  requireRole('RECRUITER', 'CANDIDATE', 'ADMIN'),
  validate(notificationIdParamSchema, 'params'),
  (req, res, next) => notificationsController.markAsRead(req, res, next),
);

module.exports = router;
