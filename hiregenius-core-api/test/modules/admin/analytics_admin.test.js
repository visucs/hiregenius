const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');

function makeToken({ userId, email, role }) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('Admin Analytics Extensions (Trend & Top Skills)', () => {
  const adminToken = makeToken({ userId: 401, email: 'admin@hiregenius.ai', role: 'ADMIN' });
  const recruiterToken = makeToken({ userId: 101, email: 'recruiter@hiregenius.ai', role: 'RECRUITER' });

  beforeAll(async () => {
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await db('notifications').del();
    await db('interviews').del();
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();

    // Create jobs with skills
    await db('jobs').insert([
      {
        id: 1,
        recruiter_id: 101,
        title: 'Full Stack Engineer',
        description: 'Full stack development role',
        company: 'TechCorp',
        status: 'OPEN',
        skills: JSON.stringify(['React', 'Node.js', 'PostgreSQL']),
        is_deleted: false,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      },
      {
        id: 2,
        recruiter_id: 101,
        title: 'Frontend Developer',
        description: 'Frontend development role',
        company: 'TechCorp',
        status: 'OPEN',
        skills: JSON.stringify(['React', 'TypeScript', 'TailwindCSS']),
        is_deleted: false,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      },
      {
        id: 3,
        recruiter_id: 101,
        title: 'Legacy Python Dev',
        description: 'Python legacy role',
        company: 'TechCorp',
        status: 'CLOSED', // Not OPEN
        skills: JSON.stringify(['Python', 'Django']),
        is_deleted: false,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      },
    ]);

    // Create candidate
    await db('candidates').insert({
      id: 1,
      user_id: 301,
      resume_path: 'uploads/resumes/c1.pdf',
    });

    // Create applications
    await db('applications').insert([
      {
        id: 1,
        job_id: 1,
        candidate_id: 1,
        status: 'HIRED',
        applied_at: db.fn.now(),
        updated_at: db.fn.now(),
      },
      {
        id: 2,
        job_id: 2,
        candidate_id: 1,
        status: 'APPLIED',
        applied_at: db.fn.now(),
        updated_at: db.fn.now(),
      },
    ]);
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('GET /api/analytics/admin/trend', () => {
    it('rejects non-admin role with 403', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/trend')
        .set('Authorization', `Bearer ${recruiterToken}`);
      expect(res.status).toBe(403);
    });

    it('returns monthly hiring trend array with applications and hires', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/trend?months=6')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(6);

      const currentMonth = res.body.data[res.body.data.length - 1];
      expect(currentMonth.applications).toBe(2);
      expect(currentMonth.hires).toBe(1);
    });
  });

  describe('GET /api/analytics/admin/top-skills', () => {
    it('returns aggregated top skills from open jobs', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/top-skills')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalOpenJobs).toBe(2);
      expect(Array.isArray(res.body.data.topSkills)).toBe(true);

      const reactSkill = res.body.data.topSkills.find((s) => s.skill === 'React');
      expect(reactSkill).toBeDefined();
      expect(reactSkill.count).toBe(2);
      expect(reactSkill.percentage).toBe(100);

      // Python was in a CLOSED job, should not be included
      const pythonSkill = res.body.data.topSkills.find((s) => s.skill === 'Python');
      expect(pythonSkill).toBeUndefined();
    });
  });
});
