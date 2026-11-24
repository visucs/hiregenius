const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../../config/db');
const env = require('../../../config/env');
const ApiError = require('../../../utils/ApiError');

const ALLOWED_STEP_UP_ACTIONS = [
  'PUT_CREDENTIAL',
  'DELETE_CREDENTIAL',
  'ACTIVATE_CONFIG',
  'ROLLBACK_CONFIG',
];

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const STEP_UP_TOKEN_TTL_SECONDS = 300; // 5 minutes

function parseDbDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') {
    if (/^\d+$/.test(val)) return new Date(Number(val));
    return new Date(val);
  }
  return new Date(val);
}

class StepUpService {
  /**
   * Verify an administrator's local password and issue an action-bound, single-use step-up token.
   *
   * @param {number|string} adminUserId - Authenticated admin's user ID
   * @param {string} password - Raw password submitted for step-up verification
   * @param {string} actionType - Target sensitive action (e.g. PUT_CREDENTIAL)
   * @returns {Promise<{ status: string, step_up_token: string, expires_in_seconds: number, action_type: string }>}
   */
  async verifyPasswordAndIssueToken(adminUserId, password, actionType) {
    if (!actionType || !ALLOWED_STEP_UP_ACTIONS.includes(actionType)) {
      throw ApiError.badRequest(
        `Invalid action_type. Must be one of: ${ALLOWED_STEP_UP_ACTIONS.join(', ')}`
      );
    }

    if (!password || typeof password !== 'string') {
      throw ApiError.badRequest('Password is required for step-up verification.');
    }

    const userId = Number(adminUserId);

    // 1. Check targeted lockout for step-up endpoint
    const lockout = await db('admin_step_up_lockouts').where({ admin_id: userId }).first();
    const now = new Date();

    if (lockout && lockout.locked_until) {
      const lockedDate = parseDbDate(lockout.locked_until);
      if (lockedDate && lockedDate > now) {
        const remainingSecs = Math.ceil((lockedDate - now) / 1000);
        const err = ApiError.tooManyRequests(
          `Too many failed step-up attempts. Locked out for ${Math.ceil(remainingSecs / 60)} more minute(s).`
        );
        err.code = 'STEP_UP_LOCKED_OUT';
        throw err;
      }
    }

    // 2. Fetch admin user record
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      throw ApiError.unauthorized('Administrator user not found.');
    }

    // 3. Fail-Closed: Google OAuth-only accounts have no local password hash
    if (!user.password) {
      const err = ApiError.forbidden(
        'Admin operations require local password verification. Accounts registered exclusively via Google OAuth cannot authorize step-up actions.'
      );
      err.code = 'LOCAL_CREDENTIALS_REQUIRED';
      throw err;
    }

    // 4. Verify password with BCrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed attempts
      const currentAttempts = (lockout ? lockout.failed_attempts : 0) + 1;
      const willLock = currentAttempts >= MAX_FAILED_ATTEMPTS;
      const lockedUntil = willLock ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

      if (lockout) {
        await db('admin_step_up_lockouts').where({ admin_id: userId }).update({
          failed_attempts: willLock ? 0 : currentAttempts,
          locked_until: lockedUntil,
          updated_at: db.fn.now(),
        });
      } else {
        await db('admin_step_up_lockouts').insert({
          admin_id: userId,
          failed_attempts: willLock ? 0 : currentAttempts,
          locked_until: lockedUntil,
          updated_at: db.fn.now(),
        });
      }

      if (willLock) {
        const err = ApiError.tooManyRequests(
          'Too many failed step-up attempts. You are locked out of admin sensitive operations for 15 minutes.'
        );
        err.code = 'STEP_UP_LOCKED_OUT';
        throw err;
      }

      const remaining = MAX_FAILED_ATTEMPTS - currentAttempts;
      throw ApiError.unauthorized(
        `Invalid administrator password. ${remaining} attempt(s) remaining before temporary lockout.`
      );
    }

    // 5. Success: Reset lockout counters
    if (lockout) {
      await db('admin_step_up_lockouts').where({ admin_id: userId }).update({
        failed_attempts: 0,
        locked_until: null,
        updated_at: db.fn.now(),
      });
    }

    // 6. Generate unique token ID (jti) and sign short-lived step-up JWT
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + STEP_UP_TOKEN_TTL_SECONDS * 1000);

    const stepUpToken = jwt.sign(
      {
        typ: 'step-up+jwt',
        aud: 'hiregenius-admin-console',
        purpose: 'ai_config_write',
        action_type: actionType,
        jti,
      },
      env.JWT_SIGNING_KEY,
      {
        algorithm: 'HS256',
        expiresIn: `${STEP_UP_TOKEN_TTL_SECONDS}s`,
        subject: String(userId),
      }
    );

    // 7. Persist single-use jti in MySQL
    await db('admin_step_up_tokens').insert({
      jti,
      admin_id: userId,
      action_type: actionType,
      expires_at: expiresAt.toISOString(),
      consumed_at: null,
    });

    return {
      status: 'SUCCESS',
      step_up_token: stepUpToken,
      expires_in_seconds: STEP_UP_TOKEN_TTL_SECONDS,
      action_type: actionType,
    };
  }

  /**
   * Consume and invalidate a step-up token atomically.
   *
   * @param {string} jti - Unique token ID
   * @param {number} adminId - Authenticated admin ID
   * @param {string} actionType - Required action type
   * @returns {Promise<boolean>} True if successfully consumed; throws ApiError otherwise
   */
  async consumeToken(jti, adminId, actionType) {
    return await db.transaction(async (trx) => {
      const record = await trx('admin_step_up_tokens')
        .where({ jti })
        .forUpdate()
        .first();

      if (!record) {
        throw ApiError.unauthorized('Invalid step-up token (jti not recognized).');
      }

      if (Number(record.admin_id) !== Number(adminId)) {
        throw ApiError.unauthorized('Step-up token does not belong to the acting administrator.');
      }

      if (record.action_type !== actionType) {
        throw ApiError.forbidden(
          `Step-up token was authorized for action '${record.action_type}', but attempted on '${actionType}'.`
        );
      }

      if (record.consumed_at !== null) {
        const err = ApiError.unauthorized('Step-up token has already been consumed (single-use replay detected).');
        err.code = 'STEP_UP_TOKEN_ALREADY_USED';
        throw err;
      }

      const expiresAt = parseDbDate(record.expires_at);
      if (expiresAt && expiresAt < new Date()) {
        throw ApiError.unauthorized('Step-up token has expired.');
      }

      // Mark token as consumed
      const rowsUpdated = await trx('admin_step_up_tokens')
        .where({ jti, consumed_at: null })
        .update({ consumed_at: new Date().toISOString() });

      if (rowsUpdated === 0) {
        throw ApiError.unauthorized('Step-up token concurrent consumption conflict.');
      }

      return true;
    });
  }
}

module.exports = new StepUpService();
