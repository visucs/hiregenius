const ApiError = require('../utils/ApiError');

/**
 * Role-Based Access Guard Middleware Factory
 * Runs after verifyJwt middleware.
 * Returns 403 Forbidden if user role does not match required roles.
 *
 * @param  {...string} allowedRoles - One or more allowed roles (e.g., 'RECRUITER', 'ADMIN')
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Requires role ${allowedRoles.join(' or ')}. Current role: ${req.user.role}`,
        ),
      );
    }

    return next();
  };
}

module.exports = requireRole;
