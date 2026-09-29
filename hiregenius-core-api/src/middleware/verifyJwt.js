const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const db = require('../config/db');

/**
 * JWT Verification Middleware
 * Validates HS256 tokens locally against JWT_SIGNING_KEY.
 * Queries the database in real-time to ensure the account is still active (is_active)
 * and attaches fresh user permissions/flags to prevent stale JWT privilege escalation.
 * Missing, expired, or tampered tokens return 401 Unauthorized.
 * Deactivated accounts immediately return 403 Forbidden.
 */
async function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(ApiError.unauthorized('Authorization header missing'));
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return next(ApiError.unauthorized('Authorization header format must be Bearer <token>'));
  }

  const token = parts[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SIGNING_KEY, {
      algorithms: ['HS256'],
    });

    if (!decoded.userId) {
      return next(ApiError.unauthorized('Token payload missing userId'));
    }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired'));
    }
    return next(ApiError.unauthorized('Invalid or tampered token'));
  }

  // Real-time lookup of live user status to prevent stale JWT bypass
  try {
    const user = await db('users').where({ id: Number(decoded.userId) }).first();
    if (!user) {
      return next(ApiError.unauthorized('User not found'));
    }

    if (user.is_active === 0 || user.is_active === false) {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact support.'));
    }

    req.user = {
      userId: Number(decoded.userId),
      email: user.email || decoded.sub || decoded.email || null,
      role: user.role || decoded.role || null,
      is_active: user.is_active === 1 || user.is_active === true,
      email_verified: user.email_verified === 1 || user.email_verified === true,
      admin_approved: user.admin_approved === 1 || user.admin_approved === true,
      can_post_jobs: user.can_post_jobs === 1 || user.can_post_jobs === true,
      can_apply_to_jobs: user.can_apply_to_jobs === 1 || user.can_apply_to_jobs === true,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = verifyJwt;
