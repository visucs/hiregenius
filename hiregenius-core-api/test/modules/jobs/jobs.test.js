const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');

function makeToken({ userId = 101, email = 'recruiter1@hiregenius.ai', role = 'RECRUITER' } = {}) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('Jobs Module - End-to-End & Ownership Enforcement', () => {
  const recruiter1Token = makeToken({ userId: 101, email: 'recruiter1@hiregenius.ai', role: 'RECRUITER' });
  const recruiter2Token = makeToken({ userId: 202, email: 'recruiter2@hiregenius.ai', role: 'RECRUITER' });
  const candidateToken = makeToken({ userId: 303, email: 'candidate@hiregenius.ai', role: 'CANDIDATE' });

  beforeAll(async () => {
    // Ensure migrations are run on the test DB
    await db.migrate.latest();
  });

  beforeEach(async () => {
    // Clean jobs table before each test run
    await db('jobs').del();
  });

  afterAll(async () => {
    // Clean up connections
    await db('jobs').del();
    await db.destroy();
  });

  describe('POST /api/jobs', () => {
    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Senior Backend Engineer',
          company: 'Acme Corp',
          skills: ['Node.js', 'MySQL'],
          description: 'Build robust enterprise APIs',
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
      expect(res.body.message).toMatch(/Authorization header missing/i);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.path).toBe('/api/jobs');
    });

    test('should reject request when role is not RECRUITER (403)', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          title: 'Senior Backend Engineer',
          company: 'Acme Corp',
          skills: ['Node.js', 'MySQL'],
          description: 'Build robust enterprise APIs',
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(403);
      expect(res.body.message).toMatch(/Requires role RECRUITER/i);
    });

    test('should create job and enforce recruiter_id strictly from JWT (201)', async () => {
      const jobPayload = {
        title: 'Full Stack Architect',
        company: 'HireGenius Tech',
        skills: ['React', 'Node.js', 'MySQL', 'Docker'],
        salary: '$120k - $150k',
        experience: '5+ years',
        location: 'Remote, US',
        description: 'Lead the next generation AI recruiting platform development.',
        recruiter_id: 9999, // Attacker tries to impersonate another recruiter
      };

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send(jobPayload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe(jobPayload.title);
      // recruiter_id must match the JWT user ID (101), NEVER 9999
      expect(Number(res.body.data.recruiter_id)).toBe(101);
      expect(res.body.data.skills).toEqual(jobPayload.skills);
      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.is_deleted).toBe(false);
    });

    test('should reject invalid payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'AB', // too short
          skills: [], // empty
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.path).toBe('/api/jobs');
    });
  });

  describe('GET /api/jobs (Public)', () => {
    test('should list OPEN jobs and NEVER return CLOSED or deleted jobs', async () => {
      // Create one OPEN job
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Frontend Developer',
          company: 'Tech Innovators',
          skills: ['React', 'TypeScript'],
          description: 'Frontend specialist for React applications.',
          status: 'OPEN',
        });

      // Create one CLOSED job
      const closedRes = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Archived Dev Position',
          company: 'Old Corp',
          skills: ['Java'],
          description: 'Internal legacy migration project.',
        });
      await request(app)
        .patch(`/api/jobs/${closedRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ status: 'CLOSED' });

      // Create one DELETED job
      const deleteRes = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Deleted Position',
          company: 'Ghost Corp',
          skills: ['Python'],
          description: 'Position to be deleted immediately.',
        });
      await request(app)
        .delete(`/api/jobs/${deleteRes.body.data.id}`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      // Public GET
      const res = await request(app).get('/api/jobs');

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.jobs).toHaveLength(1);
      expect(res.body.data.jobs[0].title).toBe('Frontend Developer');
      expect(res.body.data.jobs[0].status).toBe('OPEN');
    });

    test('should support search filters by title, company, and location', async () => {
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'DevOps Lead',
          company: 'Cloud Scale Inc',
          location: 'San Francisco, CA',
          skills: ['AWS', 'Kubernetes'],
          description: 'Lead DevOps infrastructure initiatives.',
        });

      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Data Scientist',
          company: 'AI Works',
          location: 'New York, NY',
          skills: ['Python', 'PyTorch'],
          description: 'NLP and deep learning modeling.',
        });

      const resTitle = await request(app).get('/api/jobs?title=DevOps');
      expect(resTitle.body.data.total).toBe(1);
      expect(resTitle.body.data.jobs[0].title).toBe('DevOps Lead');

      const resLoc = await request(app).get('/api/jobs?location=New York');
      expect(resLoc.body.data.total).toBe(1);
      expect(resLoc.body.data.jobs[0].title).toBe('Data Scientist');
    });
  });

  describe('GET /api/jobs/mine (Recruiter)', () => {
    test('should return only the jobs owned by authenticated recruiter (including CLOSED)', async () => {
      // Recruiter 1 creates job 1 (OPEN)
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Recruiter 1 Open Job',
          company: 'Recruiter 1 Co',
          skills: ['Go'],
          description: 'Job 1 description goes here.',
        });

      // Recruiter 1 creates job 2 and closes it
      const r1Closed = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Recruiter 1 Closed Job',
          company: 'Recruiter 1 Co',
          skills: ['Rust'],
          description: 'Job 2 description goes here.',
        });
      await request(app)
        .patch(`/api/jobs/${r1Closed.body.data.id}/status`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ status: 'CLOSED' });

      // Recruiter 2 creates job 3
      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({
          title: 'Recruiter 2 Job',
          company: 'Recruiter 2 Co',
          skills: ['Java'],
          description: 'Job 3 description goes here.',
        });

      // Recruiter 1 requests /mine
      const res = await request(app)
        .get('/api/jobs/mine')
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
      const titles = res.body.data.jobs.map((j) => j.title);
      expect(titles).toContain('Recruiter 1 Open Job');
      expect(titles).toContain('Recruiter 1 Closed Job');
      expect(titles).not.toContain('Recruiter 2 Job');
    });
  });

  describe('GET /api/jobs/:id (Public)', () => {
    test('should return full details of an existing job', async () => {
      const created = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Mobile Engineer',
          company: 'App Studio',
          skills: ['React Native', 'Swift'],
          salary: '$100k',
          description: 'Native and cross-platform mobile apps.',
        });

      const res = await request(app).get(`/api/jobs/${created.body.data.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(created.body.data.id);
      expect(res.body.data.title).toBe('Mobile Engineer');
    });

    test('should return 404 if job does not exist', async () => {
      const res = await request(app).get('/api/jobs/99999');
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('PUT /api/jobs/:id (Ownership Enforcement)', () => {
    test('should allow owner recruiter to update job (200)', async () => {
      const created = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Junior QA Tester',
          company: 'Quality Inc',
          skills: ['Jest', 'Cypress'],
          description: 'Write end to end test suites.',
        });

      const res = await request(app)
        .put(`/api/jobs/${created.body.data.id}`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Senior QA Automation Lead',
          salary: '$110k',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Senior QA Automation Lead');
      expect(res.body.data.salary).toBe('$110k');
    });

    test('should reject update with 403 Forbidden when called by a DIFFERENT recruiter', async () => {
      // Recruiter 1 creates job
      const created = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Protected Job',
          company: 'Recruiter 1 Org',
          skills: ['Python'],
          description: 'Confidential project job description.',
        });

      // Recruiter 2 tries to update Recruiter 1's job
      const res = await request(app)
        .put(`/api/jobs/${created.body.data.id}`)
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({
          title: 'Malicious Hijack Title',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/permission/i);

      // Verify DB was NOT modified
      const check = await request(app).get(`/api/jobs/${created.body.data.id}`);
      expect(check.body.data.title).toBe('Protected Job');
    });
  });

  describe('PATCH /api/jobs/:id/status (Ownership & Toggle)', () => {
    test('should toggle status to CLOSED for owner recruiter', async () => {
      const created = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Active Hiring Role',
          company: 'Hiring Fast',
          skills: ['Kotlin'],
          description: 'Fast-paced environment looking for Kotlin devs.',
        });

      const res = await request(app)
        .patch(`/api/jobs/${created.body.data.id}/status`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ status: 'CLOSED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CLOSED');
    });

    test('should reject status toggle with 403 Forbidden for non-owner recruiter', async () => {
      const created = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Another Protected Job',
          company: 'Alpha Inc',
          skills: ['Go'],
          description: 'Description for alpha inc project.',
        });

      const res = await request(app)
        .patch(`/api/jobs/${created.body.data.id}/status`)
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({ status: 'CLOSED' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/permission/i);
    });
  });

  describe('DELETE /api/jobs/:id (Ownership & Soft-Delete)', () => {
    test('should soft-delete job when requested by owner recruiter (200)', async () => {
      const created = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Job To Soft Delete',
          company: 'Beta Inc',
          skills: ['Elixir'],
          description: 'Experimental project job posting.',
        });

      const res = await request(app)
        .delete(`/api/jobs/${created.body.data.id}`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      // Verify it returns 404 on public GET /api/jobs/:id
      const checkPublic = await request(app).get(`/api/jobs/${created.body.data.id}`);
      expect(checkPublic.status).toBe(404);

      // Verify it is not listed in public /api/jobs
      const listPublic = await request(app).get('/api/jobs');
      const found = listPublic.body.data.jobs.find((j) => j.id === created.body.data.id);
      expect(found).toBeUndefined();

      // Verify it is not listed in recruiter /api/jobs/mine
      const listMine = await request(app)
        .get('/api/jobs/mine')
        .set('Authorization', `Bearer ${recruiter1Token}`);
      const foundMine = listMine.body.data.jobs.find((j) => j.id === created.body.data.id);
      expect(foundMine).toBeUndefined();

      // Verify in raw DB that record still exists with is_deleted = 1 (soft delete)
      const rawRow = await db('jobs').where('id', created.body.data.id).first();
      expect(rawRow).toBeDefined();
      expect(Boolean(rawRow.is_deleted)).toBe(true);
    });

    test('should reject delete with 403 Forbidden for non-owner recruiter', async () => {
      const created = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          title: 'Recruiter 1 Job Never Delete',
          company: 'Secure Org',
          skills: ['Rust'],
          description: 'Cannot be deleted by another recruiter.',
        });

      const res = await request(app)
        .delete(`/api/jobs/${created.body.data.id}`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/permission/i);

      // Verify job is still alive and not deleted
      const check = await request(app).get(`/api/jobs/${created.body.data.id}`);
      expect(check.status).toBe(200);
      expect(check.body.data.title).toBe('Recruiter 1 Job Never Delete');
    });
  });
});
