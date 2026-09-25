const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * JWT Verification Middleware
 * Validates HS256 tokens locally against JWT_SIGNING_KEY.
 * Never calls external network services for verification.
 * Attaches req.user = { userId, email, role } on success.
 * Missing, expired, or tampered tokens return 401 Unauthorized, never 500.
 */
function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(ApiError.unauthorized('Authorization header missing'));
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return next(ApiError.unauthorized('Authorization header format must be Bearer <token>'));
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SIGNING_KEY, {
      algorithms: ['HS256'],
    });

    if (!decoded.userId) {
      return next(ApiError.unauthorized('Token payload missing userId'));
    }

    req.user = {
      userId: Number(decoded.userId),
      email: decoded.sub || decoded.email || null,
      role: decoded.role || null,
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired'));
    }
    return next(ApiError.unauthorized('Invalid or tampered token'));
  }
}

module.exports = verifyJwt;
