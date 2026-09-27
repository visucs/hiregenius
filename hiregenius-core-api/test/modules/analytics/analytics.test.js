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

describe('Analytics Module - Multi-Role Scoping, Isolation & Aggregations', () => {
  const recruiterAToken = makeToken({ userId: 101, email: 'recruiterA@hiregenius.ai', role: 'RECRUITER' });
  const recruiterBToken = makeToken({ userId: 202, email: 'recruiterB@hiregenius.ai', role: 'RECRUITER' });
  const candidate1Token = makeToken({ userId: 301, email: 'candidate1@hiregenius.ai', role: 'CANDIDATE' });
  const candidate2Token = makeToken({ userId: 302, email: 'candidate2@hiregenius.ai', role: 'CANDIDATE' });
  const adminToken = makeToken({ userId: 401, email: 'admin@hiregenius.ai', role: 'ADMIN' });

  beforeAll(async () => {
    await db.migrate.latest();

    // Ensure users table exists for test joins
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
      await db.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('name');
        t.string('email').unique();
        t.string('role');
        t.string('password').nullable();
        t.boolean('email_verified').defaultTo(true);
      });
    }
  });

  beforeEach(async () => {
    // Clear data in dependency order
    await db('notifications').del();
    await db('interviews').del();
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').del();

    // Seed test users
    await db('users').insert([
      { id: 101, name: 'Recruiter Alpha', email: 'recruiterA@hiregenius.ai', role: 'RECRUITER', password: 'hash_secret_1', email_verified: true },
      { id: 202, name: 'Recruiter Beta', email: 'recruiterB@hiregenius.ai', role: 'RECRUITER', password: 'hash_secret_2', email_verified: true },
      { id: 301, name: 'Candidate One', email: 'candidate1@hiregenius.ai', role: 'CANDIDATE', password: 'hash_secret_3', email_verified: true },
      { id: 302, name: 'Candidate Two', email: 'candidate2@hiregenius.ai', role: 'CANDIDATE', password: 'hash_secret_4', email_verified: true },
      { id: 401, name: 'Admin Master', email: 'admin@hiregenius.ai', role: 'ADMIN', password: 'hash_secret_admin', email_verified: true },
    ]);

    // Seed candidate records
    await db('candidates').insert([
      { id: 1, user_id: 301, resume_path: 'uploads/resumes/c1.pdf', resume_original_name: 'c1.pdf' },
      { id: 2, user_id: 302, resume_path: 'uploads/resumes/c2.pdf', resume_original_name: 'c2.pdf' },
    ]);

    // Seed jobs:
    // Recruiter A owns Job 1 (OPEN) and Job 2 (CLOSED)
    // Recruiter B owns Job 3 (OPEN)
    await db('jobs').insert([
      { id: 1, recruiter_id: 101, title: 'Senior Frontend Dev', company: 'Alpha Inc', skills: JSON.stringify(['React', 'TypeScript']), description: 'Frontend engineer job description', status: 'OPEN', is_deleted: false },
      { id: 2, recruiter_id: 101, title: 'Lead Backend Dev', company: 'Alpha Inc', skills: JSON.stringify(['Node.js', 'PostgreSQL']), description: 'Backend engineer job description', status: 'CLOSED', is_deleted: false },
      { id: 3, recruiter_id: 202, title: 'Fullstack Dev', company: 'Beta Labs', skills: JSON.stringify(['Vue', 'Python']), description: 'Fullstack engineer job description', status: 'OPEN', is_deleted: false },
    ]);

    // Seed applications:
    // Job 1 (A): Candidate 1 (INTERVIEW), Candidate 2 (APPLIED)
    // Job 2 (A): Candidate 1 (SHORTLISTED)
    // Job 3 (B): Candidate 2 (APPLIED)
    await db('applications').insert([
      { id: 1, job_id: 1, candidate_id: 1, status: 'INTERVIEW' },
      { id: 2, job_id: 1, candidate_id: 2, status: 'APPLIED' },
      { id: 3, job_id: 2, candidate_id: 1, status: 'SHORTLISTED' },
      { id: 4, job_id: 3, candidate_id: 2, status: 'APPLIED' },
    ]);

    // Seed interviews:
    // App 1 (Job 1, A, Cand 1): SCHEDULED
    // App 3 (Job 2, A, Cand 1): COMPLETED
    await db('interviews').insert([
      {
        id: 1,
        application_id: 1,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        status: 'SCHEDULED',
        created_by: 101,
      },
      {
        id: 2,
        application_id: 3,
        scheduled_at: new Date(Date.now() - 86400000).toISOString(),
        meeting_link: 'https://meet.google.com/xyz-uvwx-rst',
        status: 'COMPLETED',
        created_by: 101,
      },
    ]);
  });

  afterAll(async () => {
    await db('notifications').del();
    await db('interviews').del();
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').del();
    await db.destroy();
  });

  // ═════════════════════════════════════════════════════════════════
  // PART 1: RECRUITER-SCOPED ANALYTICS
  // ═════════════════════════════════════════════════════════════════
  describe('GET /api/analytics/recruiter/summary', () => {
    test('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/analytics/recruiter/summary');
      expect(res.status).toBe(401);
    });

    test('should reject non-RECRUITER role (CANDIDATE) with 403', async () => {
      const res = await request(app)
        .get('/api/analytics/recruiter/summary')
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(res.status).toBe(403);
    });

    test('should return Recruiter A summary with strict isolation (no Recruiter B data)', async () => {
      const res = await request(app)
        .get('/api/analytics/recruiter/summary')
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();

      const data = res.body.data;
      // Recruiter A owns 2 jobs: 1 OPEN, 1 CLOSED
      expect(data.totalJobs).toBe(2);
      expect(data.openJobs).toBe(1);
      expect(data.closedJobs).toBe(1);

      // Recruiter A has 3 applications: 2 for Job 1, 1 for Job 2
      expect(data.totalApplications).toBe(3);
      expect(data.totalInterviewsScheduled).toBe(1);

      // Status breakdown
      expect(data.applicationsByStatus).toEqual({
        APPLIED: 1,
        SCREENING: 0,
        INTERVIEW: 1,
        SHORTLISTED: 1,
        REJECTED: 0,
        HIRED: 0,
      });

      // Both allTime and recent are clearly labeled separately
      expect(data.allTime).toBeDefined();
      expect(data.recent).toBeDefined();
      expect(data.allTime.totalJobs).toBe(2);
      expect(data.recent.days).toBe(30);
    });

    test('should return Recruiter B summary reflecting only Recruiter B data (proving isolation)', async () => {
      const res = await request(app)
        .get('/api/analytics/recruiter/summary')
        .set('Authorization', `Bearer ${recruiterBToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Recruiter B owns only 1 job (Job 3: OPEN)
      expect(data.totalJobs).toBe(1);
      expect(data.openJobs).toBe(1);
      expect(data.closedJobs).toBe(0);

      // Recruiter B has 1 application and 0 scheduled interviews
      expect(data.totalApplications).toBe(1);
      expect(data.totalInterviewsScheduled).toBe(0);
      expect(data.applicationsByStatus).toEqual({
        APPLIED: 1,
        SCREENING: 0,
        INTERVIEW: 0,
        SHORTLISTED: 0,
        REJECTED: 0,
        HIRED: 0,
      });
    });

    test('should accept ?days=14 and return recent window labeled alongside all-time', async () => {
      const res = await request(app)
        .get('/api/analytics/recruiter/summary?days=14')
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.days).toBe(14);
      expect(data.recent.days).toBe(14);
      expect(data.allTime).toBeDefined();
      expect(data.allTime.totalJobs).toBe(2);
    });

    test('should return 400 Bad Request for invalid ?days= values (negative or non-numeric)', async () => {
      const resNegative = await request(app)
        .get('/api/analytics/recruiter/summary?days=-5')
        .set('Authorization', `Bearer ${recruiterAToken}`);
      expect(resNegative.status).toBe(400);

      const resString = await request(app)
        .get('/api/analytics/recruiter/summary?days=abc')
        .set('Authorization', `Bearer ${recruiterAToken}`);
      expect(resString.status).toBe(400);

      const resZero = await request(app)
        .get('/api/analytics/recruiter/summary?days=0')
        .set('Authorization', `Bearer ${recruiterAToken}`);
      expect(resZero.status).toBe(400);
    });
  });

  describe('GET /api/analytics/recruiter/jobs-breakdown', () => {
    test('should return jobs breakdown ordered by applicationCount DESC for recruiter only', async () => {
      const res = await request(app)
        .get('/api/analytics/recruiter/jobs-breakdown')
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);

      // Job 1 has 2 applications and 1 interview
      const job1 = res.body.data[0];
      expect(job1.jobId).toBe(1);
      expect(job1.title).toBe('Senior Frontend Dev');
      expect(job1.status).toBe('OPEN');
      expect(job1.applicationCount).toBe(2);
      expect(job1.interviewCount).toBe(1);

      // Job 2 has 1 application and 1 interview
      const job2 = res.body.data[1];
      expect(job2.jobId).toBe(2);
      expect(job2.title).toBe('Lead Backend Dev');
      expect(job2.status).toBe('CLOSED');
      expect(job2.applicationCount).toBe(1);
      expect(job2.interviewCount).toBe(1);
    });

    test('should return only Recruiter B jobs for Recruiter B', async () => {
      const res = await request(app)
        .get('/api/analytics/recruiter/jobs-breakdown')
        .set('Authorization', `Bearer ${recruiterBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].jobId).toBe(3);
      expect(res.body.data[0].applicationCount).toBe(1);
      expect(res.body.data[0].interviewCount).toBe(0);
    });
  });

  describe('GET /api/analytics/recruiter/trend', () => {
    test('should return 30-day continuous trend with zero-filled gaps', async () => {
      const res = await request(app)
        .get('/api/analytics/recruiter/trend?days=30')
        .set('Authorization', `Bearer ${recruiterAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(30);

      // Confirm each entry has date and numeric count
      for (const entry of res.body.data) {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('count');
        expect(typeof entry.date).toBe('string');
        expect(typeof entry.count).toBe('number');
      }

      // Today's entry should reflect today's created applications (3 for recruiter A)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayEntry = res.body.data.find((e) => e.date === todayStr);
      expect(todayEntry).toBeDefined();
      expect(todayEntry.count).toBe(3);

      // An arbitrary older day in the window should be zero-filled, not missing
      const pastEntry = res.body.data[0];
      expect(pastEntry.count).toBe(0);
    });

    test('should return 400 Bad Request for invalid ?days= parameter', async () => {
      const res = await request(app)
        .get('/api/analytics/recruiter/trend?days=-1')
        .set('Authorization', `Bearer ${recruiterAToken}`);
      expect(res.status).toBe(400);

      const resAlpha = await request(app)
        .get('/api/analytics/recruiter/trend?days=abc')
        .set('Authorization', `Bearer ${recruiterAToken}`);
      expect(resAlpha.status).toBe(400);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // PART 2: CANDIDATE-SCOPED ANALYTICS
  // ═════════════════════════════════════════════════════════════════
  describe('GET /api/analytics/candidate/summary', () => {
    test('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/analytics/candidate/summary');
      expect(res.status).toBe(401);
    });

    test('should reject RECRUITER role with 403', async () => {
      const res = await request(app)
        .get('/api/analytics/candidate/summary')
        .set('Authorization', `Bearer ${recruiterAToken}`);
      expect(res.status).toBe(403);
    });

    test('should return Candidate 1 summary with own application counts only', async () => {
      const res = await request(app)
        .get('/api/analytics/candidate/summary')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Candidate 1 applied to Job 1 (INTERVIEW) and Job 2 (SHORTLISTED)
      expect(data.totalApplications).toBe(2);
      expect(data.applicationsByStatus).toEqual({
        APPLIED: 0,
        SCREENING: 0,
        INTERVIEW: 1,
        SHORTLISTED: 1,
        REJECTED: 0,
        HIRED: 0,
      });

      // Interview 1 is SCHEDULED, Interview 2 is COMPLETED
      expect(data.totalInterviewsScheduled).toBe(1);
      expect(data.totalInterviewsCompleted).toBe(1);
    });

    test('should return Candidate 2 summary strictly isolated from Candidate 1', async () => {
      const res = await request(app)
        .get('/api/analytics/candidate/summary')
        .set('Authorization', `Bearer ${candidate2Token}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Candidate 2 applied to Job 1 (APPLIED) and Job 3 (APPLIED)
      expect(data.totalApplications).toBe(2);
      expect(data.applicationsByStatus).toEqual({
        APPLIED: 2,
        SCREENING: 0,
        INTERVIEW: 0,
        SHORTLISTED: 0,
        REJECTED: 0,
        HIRED: 0,
      });
      expect(data.totalInterviewsScheduled).toBe(0);
      expect(data.totalInterviewsCompleted).toBe(0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // PART 3: ADMIN PLATFORM-WIDE ANALYTICS
  // ═════════════════════════════════════════════════════════════════
  describe('GET /api/analytics/admin/summary', () => {
    test('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/analytics/admin/summary');
      expect(res.status).toBe(401);
    });

    test('should reject non-ADMIN role with 403 (RECRUITER and CANDIDATE)', async () => {
      const resRecruiter = await request(app)
        .get('/api/analytics/admin/summary')
        .set('Authorization', `Bearer ${recruiterAToken}`);
      expect(resRecruiter.status).toBe(403);

      const resCandidate = await request(app)
        .get('/api/analytics/admin/summary')
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(resCandidate.status).toBe(403);
    });

    test('should return combined platform-wide summary matching all recruiters and candidates', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      // Combined jobs: 2 from Recruiter A + 1 from Recruiter B = 3
      expect(data.totalJobs).toBe(3);

      // Combined applications: 3 for A + 1 for B = 4
      expect(data.totalApplications).toBe(4);

      // Combined interviews: 2
      expect(data.totalInterviews).toBe(2);

      // Users breakdown by role
      expect(data.totalUsers.recruiters).toBe(2);
      expect(data.totalUsers.candidates).toBe(2);
      expect(data.totalUsers.admins).toBe(1);
      expect(data.totalUsers.total).toBe(5);

      // Combined applicationsByStatus
      expect(data.applicationsByStatus).toEqual({
        APPLIED: 2,
        SCREENING: 0,
        INTERVIEW: 1,
        SHORTLISTED: 1,
        REJECTED: 0,
        HIRED: 0,
      });
    });
  });

  describe('GET /api/analytics/admin/top-recruiters', () => {
    test('should reject non-ADMIN role with 403', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/top-recruiters')
        .set('Authorization', `Bearer ${recruiterAToken}`);
      expect(res.status).toBe(403);
    });

    test('should rank recruiters primarily by total applications received and return safe fields only', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/top-recruiters')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const recruiters = res.body.data;
      expect(recruiters.length).toBeGreaterThanOrEqual(2);

      // Recruiter A (3 applications, 2 jobs) must rank before Recruiter B (1 application, 1 job)
      expect(recruiters[0].recruiterId).toBe(101);
      expect(recruiters[0].name).toBe('Recruiter Alpha');
      expect(recruiters[0].email).toBe('recruiterA@hiregenius.ai');
      expect(recruiters[0].applicationsCount).toBe(3);
      expect(recruiters[0].jobsCount).toBe(2);

      expect(recruiters[1].recruiterId).toBe(202);
      expect(recruiters[1].name).toBe('Recruiter Beta');
      expect(recruiters[1].email).toBe('recruiterB@hiregenius.ai');
      expect(recruiters[1].applicationsCount).toBe(1);
      expect(recruiters[1].jobsCount).toBe(1);

      // Security check: confirm password or hash is NEVER exposed
      for (const r of recruiters) {
        expect(r).not.toHaveProperty('password');
        expect(r).not.toHaveProperty('password_hash');
        expect(r).not.toHaveProperty('passwordHash');
        expect(JSON.stringify(r)).not.toMatch(/hash_secret/);
      }
    });

    test('should support ?sortBy=jobs ranking', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/top-recruiters?sortBy=jobs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].jobsCount).toBeGreaterThanOrEqual(res.body.data[1].jobsCount);
    });
  });
});
