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

describe('Admin User Permanent Deletion Module (DELETE /api/admin/users/:id)', () => {
  const adminToken = makeToken({ userId: 401, email: 'admin@hiregenius.ai', role: 'ADMIN' });
  const otherAdminToken = makeToken({ userId: 402, email: 'otheradmin@hiregenius.ai', role: 'ADMIN' });
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
    if (await db.schema.hasTable('notifications')) await db('notifications').del();
    if (await db.schema.hasTable('interviews')) await db('interviews').del();
    if (await db.schema.hasTable('applications')) await db('applications').del();
    if (await db.schema.hasTable('candidates')) await db('candidates').del();
    if (await db.schema.hasTable('jobs')) await db('jobs').del();
    if (await db.schema.hasTable('recruiter_notification_preferences')) await db('recruiter_notification_preferences').del();
    if (await db.schema.hasTable('email_otps')) await db('email_otps').del();

    const hasUsers = await db.schema.hasTable('users');
    if (hasUsers) {
      await db('users').whereIn('id', [401, 402, 101, 301, 555]).del();
      await db('users').insert([
        { id: 401, name: 'Admin Master', email: 'admin@hiregenius.ai', role: 'ADMIN', password: 'hash' },
        { id: 402, name: 'Admin Secondary', email: 'otheradmin@hiregenius.ai', role: 'ADMIN', password: 'hash' },
        { id: 101, name: 'Recruiter Bob', email: 'recruiter@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
        { id: 301, name: 'Candidate Alice', email: 'candidate@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
      ]);
    }
  });

  afterAll(async () => {
    if (await db.schema.hasTable('notifications')) await db('notifications').del();
    if (await db.schema.hasTable('interviews')) await db('interviews').del();
    if (await db.schema.hasTable('applications')) await db('applications').del();
    if (await db.schema.hasTable('candidates')) await db('candidates').del();
    if (await db.schema.hasTable('jobs')) await db('jobs').del();
    if (await db.schema.hasTable('users')) await db('users').whereIn('id', [401, 402, 101, 301, 555]).del();
    await db.destroy();
  });

  it('rejects unauthenticated request with 401', async () => {
    const res = await request(app).delete('/api/admin/users/101');
    expect(res.status).toBe(401);
  });

  it('rejects non-ADMIN role with 403', async () => {
    const res = await request(app)
      .delete('/api/admin/users/101')
      .set('Authorization', `Bearer ${recruiterToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects self-deletion with 400', async () => {
    const res = await request(app)
      .delete('/api/admin/users/401')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot delete your own administrator account/i);
  });

  it('rejects deleting another administrator account with 400', async () => {
    const res = await request(app)
      .delete('/api/admin/users/402')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/administrator accounts cannot be deleted/i);
  });

  it('returns 404 if target user does not exist', async () => {
    const res = await request(app)
      .delete('/api/admin/users/99999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('blocks deletion of recruiter if they have active (OPEN) jobs', async () => {
    await db('jobs').insert({
      id: 901,
      recruiter_id: 101,
      title: 'Active Job',
      description: 'Test job description',
      company: 'TestCorp',
      status: 'OPEN',
      skills: JSON.stringify(['JavaScript']),
      is_deleted: false,
    });

    const res = await request(app)
      .delete('/api/admin/users/101')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/active job postings/i);

    // Verify user was NOT deleted
    const userInDb = await db('users').where({ id: 101 }).first();
    expect(userInDb).toBeDefined();
  });

  it('blocks deletion of recruiter if their closed jobs have unresolved candidate applications', async () => {
    await db('jobs').insert({
      id: 902,
      recruiter_id: 101,
      title: 'Closed Job with Active Candidate',
      description: 'Test job description',
      company: 'TestCorp',
      status: 'CLOSED',
      skills: JSON.stringify(['JavaScript']),
      is_deleted: false,
    });

    await db('candidates').insert({
      id: 201,
      user_id: 301,
    });

    await db('applications').insert({
      id: 701,
      job_id: 902,
      candidate_id: 201,
      status: 'INTERVIEW',
    });

    const res = await request(app)
      .delete('/api/admin/users/101')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/applications in progress/i);
  });

  it('successfully deletes recruiter when jobs are closed and applications resolved', async () => {
    await db('jobs').insert({
      id: 903,
      recruiter_id: 101,
      title: 'Resolved Job',
      description: 'Test job description',
      company: 'TestCorp',
      status: 'CLOSED',
      skills: JSON.stringify(['JavaScript']),
      is_deleted: false,
    });

    await db('candidates').insert({
      id: 202,
      user_id: 301,
    });

    await db('applications').insert({
      id: 702,
      job_id: 903,
      candidate_id: 202,
      status: 'REJECTED',
    });

    const res = await request(app)
      .delete('/api/admin/users/101')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/permanently deleted/i);

    // Verify database cascade
    const user = await db('users').where({ id: 101 }).first();
    expect(user).toBeUndefined();

    const jobs = await db('jobs').where({ recruiter_id: 101 });
    expect(jobs).toHaveLength(0);

    const apps = await db('applications').where({ job_id: 903 });
    expect(apps).toHaveLength(0);
  });

  it('blocks deletion of candidate if they have active (in-progress) applications', async () => {
    await db('jobs').insert({
      id: 904,
      recruiter_id: 101,
      title: 'Some Job',
      description: 'Test job description',
      company: 'TestCorp',
      status: 'OPEN',
      skills: JSON.stringify(['Go']),
      is_deleted: false,
    });

    await db('candidates').insert({
      id: 203,
      user_id: 301,
    });

    await db('applications').insert({
      id: 703,
      job_id: 904,
      candidate_id: 203,
      status: 'APPLIED',
    });

    const res = await request(app)
      .delete('/api/admin/users/301')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/active applications in progress/i);

    // Verify candidate was NOT deleted
    const userInDb = await db('users').where({ id: 301 }).first();
    expect(userInDb).toBeDefined();
  });

  it('successfully deletes candidate when applications are terminal (HIRED/REJECTED)', async () => {
    await db('jobs').insert({
      id: 905,
      recruiter_id: 101,
      title: 'Some Job',
      description: 'Test job description',
      company: 'TestCorp',
      status: 'OPEN',
      skills: JSON.stringify(['Go']),
      is_deleted: false,
    });

    await db('candidates').insert({
      id: 204,
      user_id: 301,
    });

    await db('applications').insert({
      id: 704,
      job_id: 905,
      candidate_id: 204,
      status: 'HIRED',
    });

    const res = await request(app)
      .delete('/api/admin/users/301')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/permanently deleted/i);

    // Verify candidate and user removed
    const user = await db('users').where({ id: 301 }).first();
    expect(user).toBeUndefined();

    const candidate = await db('candidates').where({ user_id: 301 }).first();
    expect(candidate).toBeUndefined();

    const apps = await db('applications').where({ id: 704 });
    expect(apps).toHaveLength(0);
  });
});
