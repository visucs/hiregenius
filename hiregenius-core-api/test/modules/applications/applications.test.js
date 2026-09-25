const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');

function makeToken({ userId = 301, email = 'candidate@hiregenius.ai', role = 'CANDIDATE' } = {}) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('Applications Module - End-to-End & Ownership Enforcement', () => {
  const recruiter1Token = makeToken({ userId: 101, email: 'recruiter1@hiregenius.ai', role: 'RECRUITER' });
  const recruiter2Token = makeToken({ userId: 202, email: 'recruiter2@hiregenius.ai', role: 'RECRUITER' });
  const candidate1Token = makeToken({ userId: 301, email: 'candidate1@hiregenius.ai', role: 'CANDIDATE' });
  const candidate2Token = makeToken({ userId: 302, email: 'candidate2@hiregenius.ai', role: 'CANDIDATE' });

  let openJobId;
  let closedJobId;
  let candidate1Id;

  const TEST_USER_IDS = [101, 202, 301, 302];

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
      });
    }
  });

  beforeEach(async () => {
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').whereIn('id', TEST_USER_IDS).del();

    // 0. Seed test users
    await db('users').insert([
      { id: 101, name: 'Alice Recruiter', email: 'recruiter1@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 202, name: 'Bob Recruiter', email: 'recruiter2@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 301, name: 'Charlie Candidate', email: 'candidate1@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
      { id: 302, name: 'David Candidate', email: 'candidate2@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
    ]);

    // 1. Create Open Job owned by Recruiter 1
    const [openId] = await db('jobs').insert({
      recruiter_id: 101,
      title: 'Full Stack Engineer',
      company: 'Tech Solutions',
      skills: JSON.stringify(['Node.js', 'React']),
      description: 'Exciting opportunity',
      status: 'OPEN',
      is_deleted: false,
    });
    openJobId = openId;

    // 2. Create Closed Job owned by Recruiter 1
    const [closedId] = await db('jobs').insert({
      recruiter_id: 101,
      title: 'Legacy Cobol Dev',
      company: 'Old Bank',
      skills: JSON.stringify(['Cobol']),
      description: 'Closed role',
      status: 'CLOSED',
      is_deleted: false,
    });
    closedJobId = closedId;

    // 3. Create Candidate 1 with resume
    const [c1Id] = await db('candidates').insert({
      user_id: 301,
      resume_path: 'uploads/resumes/c1_resume.pdf',
      resume_original_name: 'c1_resume.pdf',
    });
    candidate1Id = c1Id;
  });

  afterAll(async () => {
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').whereIn('id', TEST_USER_IDS).del();
    await db.destroy();
  });

  describe('POST /api/applications', () => {
    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send({ jobId: openJobId });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
    });

    test('should reject request when role is not CANDIDATE (403)', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ jobId: openJobId });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(403);
    });

    test('should reject when candidate has no resume on file (400)', async () => {
      // candidate 2 has no resume uploaded
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate2Token}`)
        .send({ jobId: openJobId });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
      expect(res.body.message).toMatch(/Upload your resume before applying/i);
    });

    test('should reject when job does not exist (404)', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: 999999 });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(404);
      expect(res.body.message).toMatch(/Job not found/i);
    });

    test('should reject when job is CLOSED (400)', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: closedJobId });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
      expect(res.body.message).toMatch(/no longer accepting applications/i);
    });

    test('should successfully apply to an open job (201)', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: openJobId });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(Number(res.body.data.job_id)).toBe(openJobId);
      expect(Number(res.body.data.candidate_id)).toBe(candidate1Id);
      expect(res.body.data.status).toBe('APPLIED');
    });

    test('should reject duplicate application attempt with 409 Conflict', async () => {
      // First application succeeds
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: openJobId });

      // Second attempt on the same job
      const res2 = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: openJobId });

      expect(res2.status).toBe(409);
      expect(res2.body.status).toBe(409);
      expect(res2.body.message).toMatch(/already applied/i);
    });

    test('should enforce DB-level unique constraint on (job_id, candidate_id)', async () => {
      // Direct raw DB insert
      await db('applications').insert({
        job_id: openJobId,
        candidate_id: candidate1Id,
        status: 'APPLIED',
      });

      // Attempting a second raw insert should throw a DB constraint violation
      let dbError = null;
      try {
        await db('applications').insert({
          job_id: openJobId,
          candidate_id: candidate1Id,
          status: 'APPLIED',
        });
      } catch (err) {
        dbError = err;
      }

      expect(dbError).not.toBeNull();
      expect(
        dbError.code === 'ER_DUP_ENTRY' ||
        dbError.code === 'SQLITE_CONSTRAINT' ||
        dbError.message.includes('UNIQUE constraint failed'),
      ).toBe(true);
    });
  });

  describe('GET /api/applications/mine (Candidate)', () => {
    test('should return candidate applications ordered newest first', async () => {
      // Apply to open job
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: openJobId });

      const res = await request(app)
        .get('/api/applications/mine')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].job_title).toBe('Full Stack Engineer');
      expect(res.body.data[0].job_company).toBe('Tech Solutions');
      expect(res.body.data[0].status).toBe('APPLIED');
      expect(res.body.data[0].recruiter_name).toBe('Alice Recruiter');
      expect(res.body.data[0].recruiter_email).toBe('recruiter1@hiregenius.ai');
    });

    test('should return empty array if candidate has no applications', async () => {
      const res = await request(app)
        .get('/api/applications/mine')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/jobs/:jobId/applications (Recruiter)', () => {
    test('should allow owning recruiter to view applications for their job (200)', async () => {
      // Candidate applies
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: openJobId });

      const res = await request(app)
        .get(`/api/jobs/${openJobId}/applications`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(Number(res.body.data[0].job_id)).toBe(openJobId);
      expect(res.body.data[0].resume_path).toBe('uploads/resumes/c1_resume.pdf');
      expect(res.body.data[0].candidate_name).toBe('Charlie Candidate');
      expect(res.body.data[0].candidate_email).toBe('candidate1@hiregenius.ai');
    });

    test('should return 403 Forbidden for a DIFFERENT recruiter with valid token', async () => {
      const res = await request(app)
        .get(`/api/jobs/${openJobId}/applications`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    test('should return 404 if job does not exist', async () => {
      const res = await request(app)
        .get('/api/jobs/999999/applications')
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(404);
    });
  });

  describe('PATCH /api/applications/:id/status (Recruiter)', () => {
    let application;

    beforeEach(async () => {
      const applyRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: openJobId });
      application = applyRes.body.data;
    });

    test('should allow owning recruiter to change status (200)', async () => {
      const res = await request(app)
        .patch(`/api/applications/${application.id}/status`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ status: 'SHORTLISTED' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(200);
      expect(res.body.data.status).toBe('SHORTLISTED');
    });

    test('should reject status change with 403 Forbidden for a DIFFERENT recruiter', async () => {
      const res = await request(app)
        .patch(`/api/applications/${application.id}/status`)
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({ status: 'SHORTLISTED' });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(403);
    });

    test('should reject invalid status string with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/applications/${application.id}/status`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ status: 'SUPER_SELECTED_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
      expect(res.body.message).toMatch(/Status must be one of/i);
    });
  });

  describe('GET /api/applications/:id (Dual Role Ownership)', () => {
    let application;

    beforeEach(async () => {
      const applyRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ jobId: openJobId });
      application = applyRes.body.data;
    });

    test('should allow applying candidate to view their own application (200)', async () => {
      const res = await request(app)
        .get(`/api/applications/${application.id}`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(200);
      expect(res.body.data.id).toBe(application.id);
      expect(res.body.data.candidate_name).toBe('Charlie Candidate');
      expect(res.body.data.candidate_email).toBe('candidate1@hiregenius.ai');
      expect(res.body.data.recruiter_name).toBe('Alice Recruiter');
      expect(res.body.data.recruiter_email).toBe('recruiter1@hiregenius.ai');
    });

    test('should forbid different candidate from viewing application (403)', async () => {
      const res = await request(app)
        .get(`/api/applications/${application.id}`)
        .set('Authorization', `Bearer ${candidate2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(403);
    });

    test('should allow owning recruiter to view application for their job (200)', async () => {
      const res = await request(app)
        .get(`/api/applications/${application.id}`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(200);
      expect(res.body.data.id).toBe(application.id);
    });

    test('should forbid different recruiter from viewing application (403)', async () => {
      const res = await request(app)
        .get(`/api/applications/${application.id}`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(403);
    });
  });
});
