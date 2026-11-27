const jwt = require('jsonwebtoken');
const env = require('../../../config/env');
const ApiError = require('../../../utils/ApiError');
const stepUpService = require('./stepUp.service');

/**
 * Middleware factory to enforce single-use step-up authorization on sensitive admin actions.
 *
 * @param {string} expectedActionType - Action identifier ('PUT_CREDENTIAL', 'DELETE_CREDENTIAL', 'ACTIVATE_CONFIG', 'ROLLBACK_CONFIG')
 * @returns {Function} Express middleware
 */
function requireStepUp(expectedActionType) {
  return async (req, res, next) => {
    try {
      const stepUpToken = req.headers['x-step-up-token'];

      if (!stepUpToken || typeof stepUpToken !== 'string') {
        const err = ApiError.unauthorized(
          'Step-up verification required. Please provide a valid X-Step-Up-Token header.'
        );
        err.code = 'STEP_UP_REQUIRED';
        return next(err);
      }

      // 1. Verify JWT signature, audience, and algorithm
      let decoded;
      try {
        decoded = jwt.verify(stepUpToken.trim(), env.JWT_SIGNING_KEY, {
          algorithms: ['HS256'],
          audience: 'hiregenius-admin-console',
        });
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return next(ApiError.unauthorized('Step-up token has expired. Re-authenticate to continue.'));
        }
        return next(ApiError.unauthorized('Invalid or tampered step-up token.'));
      }

      // 2. Token confusion and purpose guards
      if (decoded.typ !== 'step-up+jwt') {
        return next(ApiError.unauthorized("Token confusion detected: invalid token type (expected 'step-up+jwt')."));
      }

      if (decoded.purpose !== 'ai_config_write') {
        return next(ApiError.unauthorized("Token confusion detected: invalid purpose claim (expected 'ai_config_write')."));
      }

      if (decoded.action_type !== expectedActionType) {
        const err = ApiError.forbidden(
          `Step-up token is scoped for '${decoded.action_type}', but action requires '${expectedActionType}'.`
        );
        err.code = 'STEP_UP_ACTION_MISMATCH';
        return next(err);
      }

      if (!req.user || Number(decoded.sub) !== Number(req.user.userId)) {
        return next(ApiError.unauthorized('Step-up token does not match the authenticated administrator.'));
      }

      if (!decoded.jti) {
        return next(ApiError.unauthorized('Step-up token missing unique token identifier (jti).'));
      }

      // 3. Atomic single-use consumption in MySQL
      await stepUpService.consumeToken(decoded.jti, req.user.userId, expectedActionType);

      req.stepUp = decoded;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  requireStepUp,
};
