const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');
const { atsRateLimiter } = require('../../../src/middleware/rateLimiter');
const aiMlClient = require('../../../src/modules/candidates/aiMlClient.service');
const ApiError = require('../../../src/utils/ApiError');

function makeToken(payload) {
  return jwt.sign(payload, env.JWT_SIGNING_KEY || 'test-secret', {
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

function fmtDate(d = new Date()) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

describe('ATS v2 Scans API & Persistence (POST /api/ats/scan, GET /mine, GET /:id)', () => {
  const candidate1Token = makeToken({ userId: 501, email: 'cand1@hiregenius.ai', role: 'CANDIDATE' });
  const candidate2Token = makeToken({ userId: 502, email: 'cand2@hiregenius.ai', role: 'CANDIDATE' });
  const recruiter1Token = makeToken({ userId: 601, email: 'recruiter1@hiregenius.ai', role: 'RECRUITER' });
  const adminToken = makeToken({ userId: 701, email: 'admin@hiregenius.ai', role: 'ADMIN' });

  const validPdfHeader = Buffer.from('%PDF-1.5 Valid PDF Content For ATS Evaluation\nSome text layer with experience.');
  const validDocxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x54, 0x65, 0x73, 0x74]); // PK\x03\x04
  const spoofedPdf = Buffer.from('Plain text file masquerading as pdf without header');

  const mockV2ScanResult = {
    overallScore: 84.5,
    grade: 'Strong Match',
    scoringVersion: 'ats-v2-untuned',
    mode: 'GENERAL',
    categories: {
      Keywords: { score: 28, max: 35 },
      Experience: { score: 20, max: 25 },
      Parsability: { score: 22, max: 25 },
    },
    criticalIssues: [],
    suggestions: [],
    extractedTextPreview: 'A'.repeat(2000), // longer than 1500 to verify truncation
  };

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
    if (atsRateLimiter && atsRateLimiter.reset) {
      atsRateLimiter.reset();
    }
    await db('ats_scans').del();
    await db('applications').del();
    await db('jobs').del();
    await db('candidates').del();
    await db('users').del();

    // Seed test users
    await db('users').insert([
      { id: 501, name: 'Candidate One', email: 'cand1@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
      { id: 502, name: 'Candidate Two', email: 'cand2@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
      { id: 601, name: 'Recruiter One', email: 'recruiter1@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 701, name: 'Admin One', email: 'admin@hiregenius.ai', role: 'ADMIN', password: 'hash' },
      { id: 999, name: 'Guest User', email: 'guest@hiregenius.ai', role: 'GUEST', password: 'hash' },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Authentication and Authorization', () => {
    test('rejects unauthenticated request (401)', async () => {
      const res = await request(app).post('/api/ats/scan');
      expect(res.status).toBe(401);
    });

    test('rejects unsupported role (403)', async () => {
      const guestToken = makeToken({ userId: 999, email: 'guest@hiregenius.ai', role: 'GUEST' });
      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${guestToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. File Signature & Validation Gates', () => {
    test('rejects spoofed PDF file with bad magic bytes (400)', async () => {
      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'GENERAL')
        .attach('resume', spoofedPdf, 'fake.pdf');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/binary content does not match PDF format/i);
    });

    test('rejects unsupported file extensions e.g. .txt (400)', async () => {
      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'GENERAL')
        .attach('resume', Buffer.from('plain text'), 'resume.txt');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Only PDF .* and Word/i);
    });

    test('rejects when candidate has no stored resume and no file uploaded (400)', async () => {
      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'GENERAL');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Upload your resume first/i);
    });

    test('returns 409 when stored resume record exists in MySQL but file missing from disk', async () => {
      await db('candidates').insert({
        user_id: 501,
        resume_path: 'uploads/resumes/non_existent_ghost_file.pdf',
        resume_original_name: 'ghost.pdf',
      });

      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'GENERAL');

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/Resume file not found, please re-upload/i);
    });
  });

  describe('3. Job Mode Validations', () => {
    test('rejects JOB mode without jobId or jobDescription (400)', async () => {
      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'JOB')
        .attach('resume', validPdfHeader, 'cv.pdf');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Either jobId or jobDescription is required/i);
    });

    test('rejects pasted jobDescription shorter than 30 characters (400)', async () => {
      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'JOB')
        .field('jobDescription', 'Too short JD')
        .attach('resume', validPdfHeader, 'cv.pdf');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/minimum 30 characters/i);
    });

    test('rejects pasted jobDescription longer than 10,000 characters (400)', async () => {
      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'JOB')
        .field('jobDescription', 'X'.repeat(10001))
        .attach('resume', validPdfHeader, 'cv.pdf');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/maximum length of 10,000 characters/i);
    });

    test('rejects when jobId does not exist (404)', async () => {
      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'JOB')
        .field('jobId', '99999')
        .attach('resume', validPdfHeader, 'cv.pdf');

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Job with ID 99999 not found/i);
    });

    test('rejects when job posting is CLOSED (400)', async () => {
      const [closedJob] = await db('jobs').insert({
        recruiter_id: 601,
        title: 'Closed Position',
        company: 'HireGenius',
        skills: JSON.stringify(['Node.js']),
        experience: '3 years',
        description: 'Position is closed and no longer accepting applications.',
        status: 'CLOSED',
      }).returning('id');
      const closedId = typeof closedJob === 'object' ? closedJob.id : closedJob;

      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'JOB')
        .field('jobId', closedId)
        .attach('resume', validPdfHeader, 'cv.pdf');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/job posting is closed/i);
    });
  });

  describe('4. Successful Scans, Privacy Truncation, and Persistence', () => {
    test('successfully scans uploaded resume (draft) in GENERAL mode, returning remaining quota', async () => {
      const scanSpy = jest.spyOn(aiMlClient, 'scanAts').mockResolvedValue(mockV2ScanResult);

      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'GENERAL')
        .attach('resume', validPdfHeader, 'draft_resume.pdf');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallScore).toBe(84.5);
      expect(res.body.data.scoringVersion).toBe('ats-v2-untuned');
      expect(res.body.data.remaining).toBe(9); // 10 - 1 = 9
      expect(res.body.data.limit).toBe(10);
      expect(res.body.data.resetAt).toBeDefined();

      // Verify row persisted in ats_scans
      const saved = await db('ats_scans').where({ id: res.body.data.scanId }).first();
      expect(saved).toBeDefined();
      expect(saved.candidate_user_id).toBe(501);
      expect(saved.triggered_by_user_id).toBe(501);
      expect(saved.source).toBe('UPLOAD');
      expect(saved.scoring_version).toBe('ats-v2-untuned');

      // Verify Privacy rule: extractedTextPreview is truncated to <= 1500 chars
      const resultObj = JSON.parse(saved.result_json);
      expect(resultObj.extractedTextPreview.length).toBeLessThanOrEqual(1500);
      expect(resultObj.raw_text).toBeUndefined();

      // Verify draft resume was NOT saved to candidate profile
      const cand = await db('candidates').where({ user_id: 501 }).first();
      expect(cand.resume_path).toBeNull();
    });

    test('successfully scans open job with DOCX upload', async () => {
      const [openJob] = await db('jobs').insert({
        recruiter_id: 601,
        title: 'Backend Engineer',
        company: 'HireGenius',
        skills: JSON.stringify(['Node.js', 'PostgreSQL']),
        experience: '4+ years',
        description: 'Design robust microservices and maintain APIs.',
        status: 'OPEN',
      }).returning('id');
      const jobId = typeof openJob === 'object' ? openJob.id : openJob;

      const scanSpy = jest.spyOn(aiMlClient, 'scanAts').mockResolvedValue({
        ...mockV2ScanResult,
        mode: 'JOB',
        overallScore: 91.0,
      });

      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'JOB')
        .field('jobId', jobId)
        .attach('resume', validDocxHeader, 'resume.docx');

      expect(res.status).toBe(200);
      expect(res.body.data.overallScore).toBe(91.0);
      expect(res.body.data.mode).toBe('JOB');

      expect(scanSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'JOB',
          jobTitle: 'Backend Engineer',
          originalFilename: 'resume.docx',
        })
      );
    });
  });

  describe('5. Error Handling & Quota Protection', () => {
    test('AI service failure returns 503 and does NOT consume quota or persist row', async () => {
      jest.spyOn(aiMlClient, 'scanAts').mockRejectedValue(
        new ApiError(503, 'AI ML Service is currently unavailable.')
      );

      const res = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'GENERAL')
        .attach('resume', validPdfHeader, 'test.pdf');

      expect(res.status).toBe(503);

      // Verify ZERO rows in ats_scans and quota was NOT consumed
      const count = await db('ats_scans').count('* as count').first();
      expect(parseInt(count.count, 10)).toBe(0);
    });

    test('Rolling 24h limit enforcement: 10 candidate scans allowed, 11th blocked with 429', async () => {
      jest.spyOn(aiMlClient, 'scanAts').mockResolvedValue(mockV2ScanResult);

      // Seed 10 scans for candidate 501 created within the last hour
      for (let i = 0; i < 10; i++) {
        await db('ats_scans').insert({
          candidate_user_id: 501,
          triggered_by_user_id: 501,
          triggered_by_role: 'CANDIDATE',
          mode: 'GENERAL',
          source: 'UPLOAD',
          overall_score: 80,
          scoring_version: 'ats-v2-untuned',
          result_json: JSON.stringify(mockV2ScanResult),
          created_at: fmtDate(new Date(Date.now() - (10 - i) * 60000)), // staggered in the last 10 minutes
        });
      }

      const blockedRes = await request(app)
        .post('/api/ats/scan')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .field('mode', 'GENERAL')
        .attach('resume', validPdfHeader, 'eleventh.pdf');

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.message).toMatch(/Daily ATS scan quota reached/i);
      expect(blockedRes.body.details.remaining).toBe(0);
      expect(blockedRes.body.details.resetAt).toBeDefined();
    });

    test('Legacy endpoint /api/candidates/me/ats-check shares the 24h rolling quota', async () => {
      // Seed 10 scans
      for (let i = 0; i < 10; i++) {
        await db('ats_scans').insert({
          candidate_user_id: 501,
          triggered_by_user_id: 501,
          triggered_by_role: 'CANDIDATE',
          mode: 'GENERAL',
          source: 'UPLOAD',
          overall_score: 80,
          scoring_version: 'ats-v2-untuned',
          result_json: JSON.stringify(mockV2ScanResult),
          created_at: fmtDate(new Date(Date.now() - 60000)),
        });
      }

      const res = await request(app)
        .post('/api/candidates/me/ats-check')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .attach('resume', validPdfHeader, 'eleventh.pdf');

      expect(res.status).toBe(429);
      expect(res.body.message).toMatch(/Daily ATS scan quota reached/i);
    });
  });

  describe('6. Scan History and Recruiter Isolation (GET /mine)', () => {
    test('Candidate history includes only candidate-triggered scans and excludes recruiter scans', async () => {
      // 1. Candidate's own scan
      await db('ats_scans').insert({
        candidate_user_id: 501,
        triggered_by_user_id: 501,
        triggered_by_role: 'CANDIDATE',
        mode: 'GENERAL',
        source: 'UPLOAD',
        overall_score: 85.0,
        scoring_version: 'ats-v2-untuned',
        result_json: JSON.stringify(mockV2ScanResult),
        created_at: fmtDate(new Date(Date.now() - 3600000)),
      });

      // 2. Recruiter scan ON the same candidate 501
      await db('ats_scans').insert({
        candidate_user_id: 501,
        triggered_by_user_id: 601,
        triggered_by_role: 'RECRUITER',
        mode: 'JOB',
        source: 'PROFILE',
        overall_score: 72.0,
        scoring_version: 'ats-v2-untuned',
        result_json: JSON.stringify(mockV2ScanResult),
        created_at: fmtDate(new Date(Date.now() - 1800000)),
      });

      // 3. Candidate 502's own scan
      await db('ats_scans').insert({
        candidate_user_id: 502,
        triggered_by_user_id: 502,
        triggered_by_role: 'CANDIDATE',
        mode: 'GENERAL',
        source: 'UPLOAD',
        overall_score: 90.0,
        scoring_version: 'ats-v2-untuned',
        result_json: JSON.stringify(mockV2ScanResult),
        created_at: fmtDate(),
      });

      const res = await request(app)
        .get('/api/ats/scans/mine')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.total).toBe(1);
      expect(res.body.data.scans).toHaveLength(1);
      expect(res.body.data.scans[0].overall_score).toBe(85.0);
      expect(res.body.data.scans[0].triggered_by_role).toBe('CANDIDATE');
    });
  });

  describe('7. Scan Detail and Ownership Enforcement (GET /:id)', () => {
    let cand1ScanId;

    beforeEach(async () => {
      const [id] = await db('ats_scans').insert({
        candidate_user_id: 501,
        triggered_by_user_id: 501,
        triggered_by_role: 'CANDIDATE',
        mode: 'GENERAL',
        source: 'UPLOAD',
        overall_score: 88.0,
        scoring_version: 'ats-v2-untuned',
        result_json: JSON.stringify(mockV2ScanResult),
        created_at: fmtDate(),
      });
      cand1ScanId = id;
    });

    test('Candidate 1 can view their own scan (200)', async () => {
      const res = await request(app)
        .get(`/api/ats/scans/${cand1ScanId}`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(cand1ScanId);
      expect(res.body.data.overall_score).toBe(88.0);
    });

    test('Candidate 2 CANNOT view Candidate 1 scan (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/ats/scans/${cand1ScanId}`)
        .set('Authorization', `Bearer ${candidate2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not have permission/i);
    });

    test('Admin can view any scan (200)', async () => {
      const res = await request(app)
        .get(`/api/ats/scans/${cand1ScanId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(cand1ScanId);
    });

    test('returns 404 for non-existent scan ID', async () => {
      const res = await request(app)
        .get('/api/ats/scans/999999')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/ATS scan not found/i);
    });
  });
});
