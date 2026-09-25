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

describe('Candidates Module - Resume Upload & Access Enforcement', () => {
  const candidateToken = makeToken({ userId: 301, email: 'candidate1@hiregenius.ai', role: 'CANDIDATE' });
  const candidateWithoutResumeToken = makeToken({ userId: 302, email: 'candidate2@hiregenius.ai', role: 'CANDIDATE' });
  const recruiter1Token = makeToken({ userId: 101, email: 'recruiter1@hiregenius.ai', role: 'RECRUITER' });
  const recruiter2Token = makeToken({ userId: 202, email: 'recruiter2@hiregenius.ai', role: 'RECRUITER' });

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

    await db('users').insert([
      { id: 101, name: 'Alice Recruiter', email: 'recruiter1@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 202, name: 'Bob Recruiter', email: 'recruiter2@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 301, name: 'Charlie Candidate', email: 'candidate1@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
      { id: 302, name: 'David Candidate', email: 'candidate2@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
    ]);
  });

  afterAll(async () => {
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').whereIn('id', TEST_USER_IDS).del();
    await db.destroy();
  });

  describe('POST /api/candidates/me/resume', () => {
    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app)
        .post('/api/candidates/me/resume')
        .attach('resume', Buffer.from('%PDF-1.4 test resume content'), 'resume.pdf');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe(401);
      expect(res.body.message).toMatch(/Authorization header missing/i);
    });

    test('should reject request when role is not CANDIDATE (403)', async () => {
      const res = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .attach('resume', Buffer.from('%PDF-1.4 test resume content'), 'resume.pdf');

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(403);
      expect(res.body.message).toMatch(/Requires role CANDIDATE/i);
    });

    test('should reject request when no file is uploaded (400)', async () => {
      const res = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
      expect(res.body.message).toMatch(/Resume file is required/i);
    });

    test('should reject unsupported file types with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', Buffer.from('console.log("malicious")'), 'exploit.js');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
      expect(res.body.message).toMatch(/File must be a PDF or DOCX/i);
    });

    test('should reject oversized files (> 5MB) with 400 Bad Request', async () => {
      const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024); // 5MB + 1KB
      const res = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', oversizedBuffer, 'oversized.pdf');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds 5MB/i);
    });

    test('should accept valid PDF and create candidate profile (201)', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 sample valid resume data');
      const res = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', pdfBuffer, 'john_doe_resume.pdf');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(Number(res.body.data.user_id)).toBe(301);
      expect(res.body.data.resume_original_name).toBe('john_doe_resume.pdf');
      expect(res.body.data.resume_path).toBeDefined();
    });

    test('should accept valid DOCX and update existing candidate profile (200)', async () => {
      // First upload creates row
      const pdfBuffer = Buffer.from('%PDF-1.4 initial resume');
      await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', pdfBuffer, 'initial.pdf');

      // Second upload updates row
      const docxBuffer = Buffer.from('PK\x03\x04 fake docx binary data');
      const res = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', docxBuffer, 'updated_cv.docx');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(200);
      expect(Number(res.body.data.user_id)).toBe(301);
      expect(res.body.data.resume_original_name).toBe('updated_cv.docx');

      // Verify DB contains exactly 1 row for this candidate
      const countRes = await db('candidates').where('user_id', 301).count('id as count');
      const totalRows = Number(countRes[0].count);
      expect(totalRows).toBe(1);
    });
  });

  describe('GET /api/candidates/me', () => {
    test('should return 404 if candidate has not uploaded a resume yet', async () => {
      const res = await request(app)
        .get('/api/candidates/me')
        .set('Authorization', `Bearer ${candidateWithoutResumeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(404);
      expect(res.body.message).toMatch(/Candidate profile not found/i);
    });

    test('should return profile and resume info when candidate has uploaded a resume', async () => {
      await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', Buffer.from('%PDF-1.4 resume content'), 'my_resume.pdf');

      const res = await request(app)
        .get('/api/candidates/me')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(200);
      expect(Number(res.body.data.user_id)).toBe(301);
      expect(res.body.data.resume_original_name).toBe('my_resume.pdf');
    });
  });

  describe('GET /api/candidates/:id (Recruiter Ownership Guard)', () => {
    test('should return 403 when recruiter has NO application link to candidate', async () => {
      // Create candidate
      const uploadRes = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', Buffer.from('%PDF-1.4 resume content'), 'candidate_resume.pdf');

      const candidateId = uploadRes.body.data.id;

      // Recruiter 1 tries to view candidate who has not applied to any of Recruiter 1's jobs
      const res = await request(app)
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    test('should return 200 when candidate has applied to one of THIS recruiter jobs', async () => {
      // 1. Recruiter 1 creates a job
      const [jobId] = await db('jobs').insert({
        recruiter_id: 101,
        title: 'Backend Specialist',
        company: 'Cloud Corp',
        skills: JSON.stringify(['Node.js']),
        description: 'Great job',
        status: 'OPEN',
        is_deleted: false,
      });

      // 2. Candidate uploads resume
      const uploadRes = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', Buffer.from('%PDF-1.4 resume content'), 'candidate_resume.pdf');

      const candidateId = uploadRes.body.data.id;

      // 3. Candidate applies to Recruiter 1's job
      await db('applications').insert({
        job_id: jobId,
        candidate_id: candidateId,
        status: 'APPLIED',
      });

      // 4. Recruiter 1 views candidate -> 200 OK
      const res1 = await request(app)
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe(200);
      expect(res1.body.data.id).toBe(candidateId);
      expect(res1.body.data.resume_original_name).toBe('candidate_resume.pdf');
      expect(res1.body.data.candidate_name).toBe('Charlie Candidate');
      expect(res1.body.data.candidate_email).toBe('candidate1@hiregenius.ai');

      // 5. Recruiter 2 (different recruiter) tries to view candidate -> 403 Forbidden!
      const res2 = await request(app)
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res2.status).toBe(403);
      expect(res2.body.status).toBe(403);
    });

    test('should return 404 when candidate does not exist', async () => {
      const res = await request(app)
        .get('/api/candidates/999999')
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(404);
      expect(res.body.message).toMatch(/Candidate not found/i);
    });
  });
});
