const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');
const settingsService = require('../../../src/modules/admin/settings/settings.service');

function makeToken({ userId, email, role }) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('Admin Settings & Maintenance Mode Module', () => {
  const adminToken = makeToken({ userId: 401, email: 'admin@hiregenius.ai', role: 'ADMIN' });
  const recruiterToken = makeToken({ userId: 101, email: 'recruiter@hiregenius.ai', role: 'RECRUITER' });

  beforeAll(async () => {
    await db.migrate.latest();
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
      await db.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('name');
        t.string('email').unique();
        t.string('role');
        t.string('password').nullable();
        t.boolean('email_verified').defaultTo(true);
        t.boolean('admin_approved').defaultTo(true);
        t.boolean('can_post_jobs').defaultTo(true);
        t.boolean('can_apply_to_jobs').defaultTo(true);
      });
    }
  });

  beforeEach(async () => {
    const hasUsers = await db.schema.hasTable('users');
    if (hasUsers) {
      await db('users').whereIn('id', [401, 101]).del();
      await db('users').insert([
        { id: 401, name: 'Admin User', email: 'admin@hiregenius.ai', role: 'ADMIN', password: 'hash' },
        { id: 101, name: 'Recruiter User', email: 'recruiter@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      ]);
    }

    // Reset settings to default
    await settingsService.updateSettings({
      platformName: 'HireGenius AI',
      supportEmail: 'support@hiregenius.ai',
      maxJobsPerRecruiter: 50,
      maxCandidatesPerJob: 500,
      aiResumeScreeningEnabled: false,
      aiInterviewEnabled: false,
      openRegistrationEnabled: true,
      maintenanceModeEnabled: false,
    });
  });

  afterAll(async () => {
    await settingsService.updateSettings({ maintenanceModeEnabled: false });
    const hasUsers = await db.schema.hasTable('users');
    if (hasUsers) {
      await db('users').whereIn('id', [401, 101]).del();
    }
    await db.destroy();
  });

  describe('GET /api/admin/settings', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/admin/settings');
      expect(res.status).toBe(401);
    });

    it('rejects non-admin role with 403', async () => {
      const res = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${recruiterToken}`);
      expect(res.status).toBe(403);
    });

    it('returns platform settings for ADMIN', async () => {
      const res = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.platformName).toBe('HireGenius AI');
      expect(res.body.data.supportEmail).toBe('support@hiregenius.ai');
      expect(res.body.data.maxJobsPerRecruiter).toBe(50);
      expect(res.body.data.openRegistrationEnabled).toBe(true);
      expect(res.body.data.maintenanceModeEnabled).toBe(false);
    });
  });

  describe('PATCH /api/admin/settings', () => {
    it('updates platform settings successfully', async () => {
      const res = await request(app)
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          platformName: 'HireGenius Pro',
          maxJobsPerRecruiter: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.platformName).toBe('HireGenius Pro');
      expect(res.body.data.maxJobsPerRecruiter).toBe(10);
    });

    it('rejects invalid email address', async () => {
      const res = await request(app)
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supportEmail: 'not-an-email',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Maintenance Mode Guard', () => {
    it('returns 503 for non-admin requests when maintenance mode is ON', async () => {
      await settingsService.updateSettings({ maintenanceModeEnabled: true });

      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(503);
      expect(res.body.message).toMatch(/maintenance/i);
    });

    it('allows ADMIN requests through even when maintenance mode is ON', async () => {
      await settingsService.updateSettings({ maintenanceModeEnabled: true });

      const res = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('allows public /health check even when maintenance mode is ON', async () => {
      await settingsService.updateSettings({ maintenanceModeEnabled: true });

      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });
  });

  describe('Admin Health Endpoint', () => {
    it('returns health status for ADMIN', async () => {
      const res = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.components.database.status).toBe('UP');
      expect(res.body.data.components.aiResumeScreening.status).toBe('NOT_AVAILABLE');
    });
  });
});
