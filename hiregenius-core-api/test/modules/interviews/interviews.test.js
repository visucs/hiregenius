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

describe('Interviews Module - End-to-End & Ownership Enforcement', () => {
  const recruiter1Token = makeToken({ userId: 601, email: 'recruiter601@hiregenius.ai', role: 'RECRUITER' });
  const recruiter2Token = makeToken({ userId: 602, email: 'recruiter602@hiregenius.ai', role: 'RECRUITER' });
  const candidate1Token = makeToken({ userId: 701, email: 'candidate701@hiregenius.ai', role: 'CANDIDATE' });
  const candidate2Token = makeToken({ userId: 702, email: 'candidate702@hiregenius.ai', role: 'CANDIDATE' });

  let job1Id;
  let candidate1Id;
  let application1Id;

  const TEST_USER_IDS = [601, 602, 701, 702];

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
    await db('notifications').del();
    await db('interviews').del();
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').whereIn('id', TEST_USER_IDS).del();

    // 0. Seed test users
    await db('users').insert([
      { id: 601, name: 'Recruiter One', email: 'recruiter601@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 602, name: 'Recruiter Two', email: 'recruiter602@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 701, name: 'Candidate One', email: 'candidate701@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
      { id: 702, name: 'Candidate Two', email: 'candidate702@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
    ]);

    // 1. Create Job owned by Recruiter 1 (userId 601)
    const [j1] = await db('jobs').insert({
      recruiter_id: 601,
      title: 'Senior Node Developer',
      company: 'Antigravity Inc',
      skills: JSON.stringify(['Node.js', 'Express']),
      description: 'Exciting backend role',
      status: 'OPEN',
      is_deleted: false,
    });
    job1Id = j1;

    // 2. Create Candidate profile for Candidate 1 (userId 701)
    const [c1] = await db('candidates').insert({
      user_id: 701,
      resume_path: 'uploads/resumes/c701_resume.pdf',
      resume_original_name: 'resume.pdf',
    });
    candidate1Id = c1;

    // 3. Create Application for Candidate 1 on Job 1
    const [a1] = await db('applications').insert({
      job_id: job1Id,
      candidate_id: candidate1Id,
      status: 'APPLIED',
      applied_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
    application1Id = a1;
  });

  afterAll(async () => {
    await db('notifications').del();
    await db('interviews').del();
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').whereIn('id', TEST_USER_IDS).del();
    await db.destroy();
  });

  describe('POST /api/interviews', () => {
    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .send({
          applicationId: application1Id,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(res.status).toBe(401);
    });

    test('should reject request when role is not RECRUITER (403)', async () => {
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });
      expect(res.status).toBe(403);
    });

    test('should reject scheduling in the past with 400 Bad Request', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: pastDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be scheduled in the past/i);
    });

    test('should reject if application does not exist with 404', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: 99999,
          scheduledAt: futureDate,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Application not found/i);
    });

    test('should reject if recruiter does not own the job with 403 Forbidden', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      // Recruiter 2 does not own job 1
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: futureDate,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/permission/i);
    });

    test('should successfully schedule interview (201), update application status, and notify candidate', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: futureDate,
          meetingLink: 'https://meet.google.com/abc-defg-hij',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.application_id).toBe(application1Id);
      expect(res.body.data.status).toBe('SCHEDULED');
      expect(res.body.data.meeting_link).toBe('https://meet.google.com/abc-defg-hij');

      // Check application status was updated to INTERVIEW
      const appRecord = await db('applications').where('id', application1Id).first();
      expect(appRecord.status).toBe('INTERVIEW');

      // Check notification was sent to Candidate 1 (user_id 701)
      const notif = await db('notifications')
        .where({ user_id: 701, type: 'INTERVIEW_SCHEDULED' })
        .first();
      expect(notif).toBeDefined();
      expect(notif.message).toMatch(/Senior Node Developer/i);
      expect(notif.related_entity_id).toBe(res.body.data.id);
    });

    test('should reject scheduling duplicate interview for same application with 409 Conflict', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      // First schedule
      await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: futureDate,
        });

      // Second schedule attempt
      const resDuplicate = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: new Date(Date.now() + 172800000).toISOString(),
        });

      expect(resDuplicate.status).toBe(409);
      expect(resDuplicate.body.message).toMatch(/already been scheduled/i);
    });
  });

  describe('GET /api/interviews', () => {
    test('should return interviews belonging to the logged-in recruiter', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: futureDate,
        });

      const res = await request(app)
        .get('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.interviews).toHaveLength(1);
      expect(res.body.data.interviews[0].job_title).toBe('Senior Node Developer');
      expect(res.body.data.interviews[0].candidate_name).toBe('Candidate One');
    });

    test('should return empty list for recruiter with no interviews', async () => {
      const res = await request(app)
        .get('/api/interviews')
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.interviews).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });
  });

  describe('GET /api/interviews/:id', () => {
    let interviewId;

    beforeEach(async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: futureDate,
        });
      interviewId = res.body.data.id;
    });

    test('should allow owning recruiter to view interview (200)', async () => {
      const res = await request(app)
        .get(`/api/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(interviewId);
      expect(res.body.data.job_title).toBe('Senior Node Developer');
    });

    test('should allow candidate of the interview to view interview (200)', async () => {
      const res = await request(app)
        .get(`/api/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(interviewId);
    });

    test('should reject unrelated recruiter with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(403);
    });

    test('should reject unrelated candidate with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${candidate2Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/interviews/:id', () => {
    let interviewId;

    beforeEach(async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: futureDate,
        });
      interviewId = res.body.data.id;
    });

    test('should reject update from non-owner recruiter with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(403);
    });

    test('should update meetingLink and status, and notify candidate when CANCELLED', async () => {
      const res = await request(app)
        .patch(`/api/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          status: 'CANCELLED',
          meetingLink: 'https://meet.google.com/updated-link',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.meeting_link).toBe('https://meet.google.com/updated-link');

      // Check notification sent to Candidate 1 (user_id 701)
      const notif = await db('notifications')
        .where({ user_id: 701, type: 'INTERVIEW_CANCELLED' })
        .first();
      expect(notif).toBeDefined();
      expect(notif.message).toMatch(/cancelled/i);
    });
  });

  describe('GET /api/candidates/me/interviews', () => {
    test('should return interviews scheduled for the logged-in candidate', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      await request(app)
        .post('/api/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          scheduledAt: futureDate,
        });

      const res = await request(app)
        .get('/api/candidates/me/interviews')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].job_title).toBe('Senior Node Developer');
      expect(res.body.data[0].job_company).toBe('Antigravity Inc');
    });

    test('should reject if called with RECRUITER token (403)', async () => {
      const res = await request(app)
        .get('/api/candidates/me/interviews')
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(403);
    });
  });
});
