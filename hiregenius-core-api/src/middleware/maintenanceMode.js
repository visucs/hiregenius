const settingsService = require('../modules/admin/settings/settings.service');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Maintenance Mode Middleware
 * When enabled in platform_settings:
 * - Allows /health, /api-docs*, /swagger*, and /api/admin/*
 * - Allows authenticated ADMIN requests
 * - Blocks all other requests with 503 Service Unavailable
 */
async function maintenanceMode(req, res, next) {
  // Always bypass health checks, docs, and admin endpoints
  if (
    req.path === '/health' ||
    req.path === '/api/health' ||
    req.path.startsWith('/swagger') ||
    req.path.startsWith('/api-docs') ||
    req.path.startsWith('/api/admin')
  ) {
    return next();
  }

  try {
    const settings = await settingsService.getSettings();
    if (!settings || !settings.maintenanceModeEnabled) {
      return next();
    }

    // Maintenance mode is ON — check if requester is ADMIN
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.trim().startsWith('Bearer ')) {
      const token = authHeader.trim().split(' ')[1];
      try {
        const decoded = jwt.verify(token, env.JWT_SIGNING_KEY, { algorithms: ['HS256'] });
        if (decoded && decoded.role === 'ADMIN') {
          return next();
        }
      } catch {
        // Token invalid/expired - proceed to block
      }
    }

    return res.status(503).json({
      status: 503,
      message: 'Platform is currently undergoing maintenance. Please try again later.',
    });
  } catch {
    // If settings check fails (e.g. during migrations/tests), do not crash
    return next();
  }
}

module.exports = maintenanceMode;
