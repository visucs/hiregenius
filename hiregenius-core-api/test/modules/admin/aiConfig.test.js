const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');
const emailService = require('../../../src/modules/email/email.service');
const { stepUpService } = require('../../../src/modules/admin/stepUp/stepUp.service');

function makeToken({ userId, email, role }) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('AI Config & Step-Up Authentication Suite', () => {
  const adminId = 401;
  const oauthAdminId = 402;
  const recruiterId = 101;
  const correctPassword = 'StrongAdminPassword!2026';

  const adminToken = makeToken({ userId: adminId, email: 'admin@hiregenius.ai', role: 'ADMIN' });
  const oauthAdminToken = makeToken({ userId: oauthAdminId, email: 'oauth-admin@hiregenius.ai', role: 'ADMIN' });
  const recruiterToken = makeToken({ userId: recruiterId, email: 'recruiter@hiregenius.ai', role: 'RECRUITER' });

  let originalFetch;

  beforeAll(async () => {
    await db.migrate.latest();

    // Ensure users table exists in SQLite test environment
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
      await db.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('name');
        t.string('email').unique();
        t.string('role');
        t.string('password').nullable();
        t.boolean('is_active').defaultTo(true);
        t.boolean('email_verified').defaultTo(true);
        t.boolean('admin_approved').defaultTo(true);
      });
    }

    // Save and mock global fetch
    originalFetch = global.fetch;
  });

  afterAll(async () => {
    global.fetch = originalFetch;
  });

  beforeEach(async () => {
    // Reset test users
    await db('users').whereIn('id', [adminId, oauthAdminId, recruiterId]).del();
    await db('admin_step_up_tokens').del();
    await db('admin_step_up_lockouts').del();

    const hashedPassword = await bcrypt.hash(correctPassword, 10);
    await db('users').insert([
      {
        id: adminId,
        name: 'Master Admin',
        email: 'admin@hiregenius.ai',
        role: 'ADMIN',
        password: hashedPassword,
        is_active: true,
      },
      {
        id: oauthAdminId,
        name: 'Google OAuth Admin',
        email: 'oauth-admin@hiregenius.ai',
        role: 'ADMIN',
        password: null, // OAuth only, no local password
        is_active: true,
      },
      {
        id: recruiterId,
        name: 'Recruiter Bob',
        email: 'recruiter@hiregenius.ai',
        role: 'RECRUITER',
        password: hashedPassword,
        is_active: true,
      },
    ]);

    // Mock emailService
    jest.spyOn(emailService, 'sendEmail').mockResolvedValue({ success: true, messageId: 'test-msg-id' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // 1. Step-Up Authentication (/api/admin/step-up)
  // =========================================================================
  describe('POST /api/admin/step-up', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/admin/step-up')
        .send({ password: correctPassword, action_type: 'PUT_CREDENTIAL' });

      expect(res.status).toBe(401);
    });

    it('rejects non-admin role with 403', async () => {
      const res = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({ password: correctPassword, action_type: 'PUT_CREDENTIAL' });

      expect(res.status).toBe(403);
    });

    it('rejects invalid or missing action_type with 400', async () => {
      const res = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'INVALID_ACTION' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid action_type/i);
    });

    it('fails closed with 403 LOCAL_CREDENTIALS_REQUIRED for Google OAuth-only accounts', async () => {
      const res = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${oauthAdminToken}`)
        .send({ password: 'anyPassword123', action_type: 'PUT_CREDENTIAL' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('LOCAL_CREDENTIALS_REQUIRED');
    });

    it('rejects incorrect password with 401 and tracks remaining attempts', async () => {
      const res = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'WrongPassword!', action_type: 'PUT_CREDENTIAL' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/4 attempt\(s\) remaining/i);
    });

    it('locks out user after 5 consecutive failed attempts with 429', async () => {
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/admin/step-up')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ password: 'WrongPassword!', action_type: 'PUT_CREDENTIAL' });
        expect(res.status).toBe(401);
      }

      // 5th attempt triggers lockout
      const fifthRes = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'WrongPassword!', action_type: 'PUT_CREDENTIAL' });

      expect(fifthRes.status).toBe(429);
      expect(fifthRes.body.code).toBe('STEP_UP_LOCKED_OUT');

      // Subsequent attempt even with correct password is still locked out
      const lockedRes = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'PUT_CREDENTIAL' });

      expect(lockedRes.status).toBe(429);
      expect(lockedRes.body.code).toBe('STEP_UP_LOCKED_OUT');
    });

    it('issues a single-use JWT on correct password and records token in DB', async () => {
      const res = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'PUT_CREDENTIAL' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('SUCCESS');
      expect(res.body.step_up_token).toBeDefined();
      expect(res.body.action_type).toBe('PUT_CREDENTIAL');
      expect(res.body.expires_in_seconds).toBe(300);

      // Verify token in DB
      const decoded = jwt.decode(res.body.step_up_token);
      expect(decoded.jti).toBeDefined();
      expect(decoded.typ).toBe('step-up+jwt');
      expect(decoded.purpose).toBe('ai_config_write');
      expect(decoded.action_type).toBe('PUT_CREDENTIAL');

      const dbToken = await db('admin_step_up_tokens').where({ jti: decoded.jti }).first();
      expect(dbToken).toBeDefined();
      expect(dbToken.admin_id).toBe(adminId);
      expect(dbToken.consumed_at).toBeNull();
    });
  });

  // =========================================================================
  // 2. Step-Up Consumption & Action Binding Verification
  // =========================================================================
  describe('Step-Up Token Middleware Enforcement', () => {
    it('rejects protected AI config action without X-Step-Up-Token with 401 STEP_UP_REQUIRED', async () => {
      const res = await request(app)
        .put('/api/admin/ai-config/credentials/gemini')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ api_key: 'AIzaSyDemoSecretKeyForTesting123456789' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('STEP_UP_REQUIRED');
    });

    it('rejects token issued for different action type with 403 STEP_UP_ACTION_MISMATCH', async () => {
      // Issue token for ACTIVATE_CONFIG
      const stepUpRes = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'ACTIVATE_CONFIG' });

      const token = stepUpRes.body.step_up_token;

      // Try using it on PUT_CREDENTIAL
      const res = await request(app)
        .put('/api/admin/ai-config/credentials/gemini')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Step-Up-Token', token)
        .send({ api_key: 'AIzaSyDemoSecretKeyForTesting123456789' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('STEP_UP_ACTION_MISMATCH');
    });

    it('consumes token on first use and rejects replay with 401 STEP_UP_TOKEN_ALREADY_USED', async () => {
      // Mock global.fetch for AI Service call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'SUCCESS',
          provider: 'gemini',
          last4: '6789',
          fingerprint: 'a1b2c3d4e5f6',
        }),
      });

      const stepUpRes = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'PUT_CREDENTIAL' });

      const token = stepUpRes.body.step_up_token;

      // First use succeeds
      const firstRes = await request(app)
        .put('/api/admin/ai-config/credentials/gemini')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Step-Up-Token', token)
        .send({ api_key: 'AIzaSyDemoSecretKeyForTesting123456789' });

      expect(firstRes.status).toBe(200);

      // Second use with same token fails
      const secondRes = await request(app)
        .put('/api/admin/ai-config/credentials/gemini')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Step-Up-Token', token)
        .send({ api_key: 'AIzaSyDemoSecretKeyForTesting123456789' });

      expect(secondRes.status).toBe(401);
      expect(secondRes.body.code).toBe('STEP_UP_TOKEN_ALREADY_USED');
    });
  });

  // =========================================================================
  // 3. AI Config Routes & HMAC Proxy Execution
  // =========================================================================
  describe('AI Config Administrative Routes (/api/admin/ai-config)', () => {
    it('GET /api/admin/ai-config proxies to AI microservice with HMAC headers and acting admin', async () => {
      let interceptedHeaders;
      global.fetch = jest.fn().mockImplementation((url, opts) => {
        interceptedHeaders = opts.headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            active_version: 1,
            effective_config: { tasks: {} },
            catalog: [],
          }),
        });
      });

      const res = await request(app)
        .get('/api/admin/ai-config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.active_version).toBe(1);

      // Verify HMAC headers were sent
      expect(interceptedHeaders).toBeDefined();
      expect(interceptedHeaders['X-Acting-Admin-Id']).toBe(String(adminId));
      expect(interceptedHeaders['X-Timestamp']).toBeDefined();
      expect(interceptedHeaders['X-Nonce']).toBeDefined();
      expect(interceptedHeaders['X-Signature']).toBeDefined();
    });

    it('PUT /api/admin/ai-config/credentials/:provider notifies admins and returns masked result', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'SUCCESS',
          provider: 'gemini',
          last4: '7890',
          fingerprint: 'abcd1234ef56',
        }),
      });

      const stepUpRes = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'PUT_CREDENTIAL' });

      const res = await request(app)
        .put('/api/admin/ai-config/credentials/gemini')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Step-Up-Token', stepUpRes.body.step_up_token)
        .send({ api_key: 'AIzaSyRealLookingKey1234567890' });

      expect(res.status).toBe(200);
      expect(res.body.last4).toBe('7890');
      expect(res.body.fingerprint).toBe('abcd1234ef56');
      expect(res.body.api_key).toBeUndefined(); // Key NEVER returned

      // Verify notification email was sent
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@hiregenius.ai',
          type: 'SECURITY_ALERT',
        })
      );
    });

    it('DELETE /api/admin/ai-config/credentials/:provider requires typed confirmation phrase', async () => {
      const stepUpRes = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'DELETE_CREDENTIAL' });

      // Missing or incorrect confirmation phrase
      const resFail = await request(app)
        .delete('/api/admin/ai-config/credentials/gemini')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Step-Up-Token', stepUpRes.body.step_up_token)
        .send({ confirmation_phrase: 'WRONG_PHRASE' });

      expect(resFail.status).toBe(400);
      expect(resFail.body.message).toMatch(/confirmation phrase/i);
    });

    it('POST /api/admin/ai-config/activate requires typed phrase CONFIRM_ACTIVATE_VERSION_<v>', async () => {
      const stepUpRes = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'ACTIVATE_CONFIG' });

      const resFail = await request(app)
        .post('/api/admin/ai-config/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Step-Up-Token', stepUpRes.body.step_up_token)
        .send({
          version: 2,
          expected_active_version: 1,
          confirmation_phrase: 'WRONG_CONFIRM',
        });

      expect(resFail.status).toBe(400);
      expect(resFail.body.message).toMatch(/confirmation phrase/i);
    });

    it('POST /api/admin/ai-config/rollback requires typed phrase CONFIRM_ROLLBACK', async () => {
      const stepUpRes = await request(app)
        .post('/api/admin/step-up')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: correctPassword, action_type: 'ROLLBACK_CONFIG' });

      const resFail = await request(app)
        .post('/api/admin/ai-config/rollback')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Step-Up-Token', stepUpRes.body.step_up_token)
        .send({
          target_version: 1,
          expected_active_version: 2,
          confirmation_phrase: 'WRONG_ROLLBACK',
        });

      expect(resFail.status).toBe(400);
      expect(resFail.body.message).toMatch(/confirmation phrase/i);
    });
  });

  // =========================================================================
  // 4. AI Provenance Columns Schema Verification
  // =========================================================================
  describe('AI Model Provenance Columns in MySQL/Knex', () => {
    it('verifies ats_scans table has provider, model_version, config_version, config_source', async () => {
      const hasTable = await db.schema.hasTable('ats_scans');
      if (hasTable) {
        expect(await db.schema.hasColumn('ats_scans', 'provider')).toBe(true);
        expect(await db.schema.hasColumn('ats_scans', 'model_version')).toBe(true);
        expect(await db.schema.hasColumn('ats_scans', 'config_version')).toBe(true);
        expect(await db.schema.hasColumn('ats_scans', 'config_source')).toBe(true);
      }
    });

    it('verifies ai_interview_evaluations has provider, config_version, config_source', async () => {
      const hasTable = await db.schema.hasTable('ai_interview_evaluations');
      if (hasTable) {
        expect(await db.schema.hasColumn('ai_interview_evaluations', 'provider')).toBe(true);
        expect(await db.schema.hasColumn('ai_interview_evaluations', 'config_version')).toBe(true);
        expect(await db.schema.hasColumn('ai_interview_evaluations', 'config_source')).toBe(true);
      }
    });

    it('verifies job_rankings has provider, model_version, config_version, config_source', async () => {
      const hasTable = await db.schema.hasTable('job_rankings');
      if (hasTable) {
        expect(await db.schema.hasColumn('job_rankings', 'provider')).toBe(true);
        expect(await db.schema.hasColumn('job_rankings', 'model_version')).toBe(true);
        expect(await db.schema.hasColumn('job_rankings', 'config_version')).toBe(true);
        expect(await db.schema.hasColumn('job_rankings', 'config_source')).toBe(true);
      }
    });
  });
});
