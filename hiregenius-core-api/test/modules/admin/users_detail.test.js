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

describe('Admin User Detail View Module (GET /api/admin/users/:id)', () => {
  const adminToken = makeToken({ userId: 401, email: 'admin@hiregenius.ai', role: 'ADMIN' });
  const recruiterToken = makeToken({ userId: 101, email: 'recruiter@hiregenius.ai', role: 'RECRUITER' });
  const candidateToken = makeToken({ userId: 301, email: 'candidate@hiregenius.ai', role: 'CANDIDATE' });

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
        t.boolean('is_active').defaultTo(true);
        t.boolean('email_verified').defaultTo(true);
        t.boolean('admin_approved').defaultTo(true);
        t.boolean('can_post_jobs').defaultTo(true);
        t.boolean('can_apply_to_jobs').defaultTo(true);
      });
    }
  });

  beforeEach(async () => {
    await db('notifications').del();
    await db('interviews').del();
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();

    const hasUsers = await db.schema.hasTable('users');
    if (hasUsers) {
      await db('users').whereIn('id', [401, 101, 301]).del();
      await db('users').insert([
        { id: 401, name: 'Admin Master', email: 'admin@hiregenius.ai', role: 'ADMIN', password: 'hash' },
        { id: 101, name: 'Recruiter Bob', email: 'recruiter@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
        { id: 301, name: 'Candidate Alice', email: 'candidate@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
      ]);
    }

    // Seed a job for recruiter
    const [jobId] = await db('jobs').insert({
      id: 901,
      recruiter_id: 101,
      title: 'Staff Platform Engineer',
      description: 'Building developer platform',
      company: 'CloudWorks',
      status: 'OPEN',
      skills: JSON.stringify(['Kubernetes', 'Go']),
      is_deleted: false,
    });

    // Seed candidate profile & application
    await db('candidates').insert({
      user_id: 301,
      resume_path: 'uploads/alice_resume.pdf',
      resume_original_name: 'Alice_Resume.pdf',
    });

    await db('applications').insert({
      job_id: jobId,
      candidate_id: 301,
      status: 'APPLIED',
    });
  });

  afterAll(async () => {
    await db('notifications').del();
    await db('interviews').del();
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').whereIn('id', [401, 101, 301]).del();
    await db.destroy();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/users/101');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin role with 403', async () => {
    const res = await request(app)
      .get('/api/admin/users/101')
      .set('Authorization', `Bearer ${recruiterToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 if user does not exist', async () => {
    const res = await request(app)
      .get('/api/admin/users/99999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('returns recruiter details with job count, application count, and recent jobs', async () => {
    const res = await request(app)
      .get('/api/admin/users/101')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(200);
    expect(res.body.data.id).toBe(101);
    expect(res.body.data.role).toBe('RECRUITER');
    expect(res.body.data.recruiterActivity).toBeDefined();
    expect(res.body.data.recruiterActivity.totalJobsPosted).toBe(1);
    expect(res.body.data.recruiterActivity.totalApplicationsReceived).toBe(1);
    expect(res.body.data.recruiterActivity.recentJobs).toHaveLength(1);
    expect(res.body.data.recruiterActivity.recentJobs[0].title).toBe('Staff Platform Engineer');
    expect(res.body.data.recruiterActivity.recentJobs[0].applicationCount).toBe(1);
  });

  it('returns candidate details with application count, recent applications, and resume status', async () => {
    const res = await request(app)
      .get('/api/admin/users/301')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(200);
    expect(res.body.data.id).toBe(301);
    expect(res.body.data.role).toBe('CANDIDATE');
    expect(res.body.data.candidateActivity).toBeDefined();
    expect(res.body.data.candidateActivity.totalApplicationsSubmitted).toBe(1);
    expect(res.body.data.candidateActivity.recentApplications).toHaveLength(1);
    expect(res.body.data.candidateActivity.recentApplications[0].jobTitle).toBe('Staff Platform Engineer');
    expect(res.body.data.candidateActivity.recentApplications[0].company).toBe('CloudWorks');
    expect(res.body.data.candidateActivity.resume.hasResume).toBe(true);
    expect(res.body.data.candidateActivity.resume.originalFilename).toBe('Alice_Resume.pdf');
  });
});
