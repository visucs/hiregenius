const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');
const aiMlClient = require('../../../src/modules/candidates/aiMlClient.service');
const { atsRateLimiter } = require('../../../src/middleware/rateLimiter');
const ApiError = require('../../../src/utils/ApiError');

function makeToken({ userId = 301, email = 'candidate@hiregenius.ai', role = 'CANDIDATE' } = {}) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('ATS Resume Checker Service Integration', () => {
  const candidate1Token = makeToken({ userId: 301, email: 'candidate1@hiregenius.ai', role: 'CANDIDATE' });
  const candidate2Token = makeToken({ userId: 302, email: 'candidate2@hiregenius.ai', role: 'CANDIDATE' });
  const recruiter1Token = makeToken({ userId: 101, email: 'recruiter1@hiregenius.ai', role: 'RECRUITER' });
  const recruiter2Token = makeToken({ userId: 202, email: 'recruiter2@hiregenius.ai', role: 'RECRUITER' });

  const TEST_USER_IDS = [101, 202, 301, 302];
  let dummyResumeFile;

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

    dummyResumeFile = path.resolve(__dirname, 'dummy_test_resume.pdf');
    fs.writeFileSync(dummyResumeFile, '%PDF-1.4 test resume content with skills and experience');
  });

  beforeEach(async () => {
    if (atsRateLimiter && atsRateLimiter.reset) {
      atsRateLimiter.reset();
    }
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    try {
      if (fs.existsSync(dummyResumeFile)) {
        fs.unlinkSync(dummyResumeFile);
      }
    } catch {
      // ignore
    }
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').whereIn('id', TEST_USER_IDS).del();
    await db.destroy();
  });

  const sampleGeneralAtsResult = {
    candidate_id: '1',
    job_id: null,
    overall_score: 82.5,
    match_strength: 'Good Match',
    mode: 'general',
    score_breakdown: { sections: 45.0, length: 22.5, format: 15.0 },
    detected_sections: { Experience: true, Education: true, Skills: true, Projects: true },
    format_signals: { has_bullets: true, has_dates: true, quantified_impact: true, action_verbs: true },
    keyword_analysis: null,
    category_prediction: {
      predicted_category: 'Python Developer',
      match_strength: 'High',
      low_confidence: false,
    },
    suggestions: ['Add more quantified metrics to your bullet points.'],
    parsability: { page_count: 1, text_density: 350.2, has_text_layer: true },
    created_at: new Date().toISOString(),
  };

  const sampleJobAtsResult = {
    ...sampleGeneralAtsResult,
    job_id: '10',
    mode: 'job_specific',
    overall_score: 87.0,
    score_breakdown: { keywords: 52.0, sections: 18.0, length: 8.5, format: 8.5 },
    keyword_analysis: {
      match_percentage: 85.0,
      matched_keywords: ['Python', 'FastAPI'],
      missing_keywords: ['Docker'],
      extracted_jd_keywords: ['Python', 'FastAPI', 'Docker'],
    },
  };

  describe('1. POST /api/candidates/me/ats-check (General ATS Check)', () => {
    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app).post('/api/candidates/me/ats-check');
      expect(res.status).toBe(401);
    });

    test('should reject request when role is not CANDIDATE (403)', async () => {
      const res = await request(app)
        .post('/api/candidates/me/ats-check')
        .set('Authorization', `Bearer ${recruiter1Token}`);
      expect(res.status).toBe(403);
    });

    test('should return 400 when candidate has no stored resume and no file is uploaded', async () => {
      const res = await request(app)
        .post('/api/candidates/me/ats-check')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Upload your resume first/i);
    });

    test('should succeed with attached file without replacing stored profile resume', async () => {
      // Candidate has an existing stored resume
      const [cand] = await db('candidates').insert({
        user_id: 301,
        resume_path: 'uploads/resumes/original_resume.pdf',
        resume_original_name: 'original_resume.pdf',
      }).returning('*');

      const spy = jest.spyOn(aiMlClient, 'checkGeneralAts').mockResolvedValue(sampleGeneralAtsResult);

      const res = await request(app)
        .post('/api/candidates/me/ats-check')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .attach('resume', Buffer.from('%PDF-1.4 transient resume content'), 'transient.pdf');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(200);
      expect(res.body.data.overall_score).toBe(82.5);
      expect(res.body.data.mode).toBe('general');
      expect(spy).toHaveBeenCalled();

      // Verify that candidate profile resume path was NOT replaced
      const candInDb = await db('candidates').where('id', cand.id || 1).first();
      expect(candInDb.resume_path).toBe('uploads/resumes/original_resume.pdf');
    });

    test('should succeed using stored resume when no file is uploaded', async () => {
      // Store dummy resume in relative path
      const relativePath = 'uploads/resumes/stored_test_resume.pdf';
      const fullDir = path.resolve(__dirname, '../../../uploads/resumes');
      if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
      const fullPath = path.resolve(fullDir, 'stored_test_resume.pdf');
      fs.writeFileSync(fullPath, '%PDF-1.4 stored resume content');

      await db('candidates').insert({
        user_id: 301,
        resume_path: relativePath,
        resume_original_name: 'stored_test_resume.pdf',
      });

      const spy = jest.spyOn(aiMlClient, 'checkGeneralAts').mockResolvedValue(sampleGeneralAtsResult);

      const res = await request(app)
        .post('/api/candidates/me/ats-check')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.overall_score).toBe(82.5);
      expect(spy).toHaveBeenCalled();

      // Clean up file
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });

    test('should pass through 422 ScannedDocumentError with error_type and parsability details', async () => {
      const err = new ApiError(422, 'Uploaded resume appears to be an image-only scan with no extractable text layer.', {
        error_type: 'ScannedDocumentError',
        parsability: { page_count: 1, text_density: 0.0, has_text_layer: false },
      });
      jest.spyOn(aiMlClient, 'checkGeneralAts').mockRejectedValue(err);

      const res = await request(app)
        .post('/api/candidates/me/ats-check')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .attach('resume', Buffer.from('%PDF-1.4 scanned document without text layer'), 'scanned.pdf');

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/image-only scan/i);
      expect(res.body.details.error_type).toBe('ScannedDocumentError');
      expect(res.body.details.parsability.has_text_layer).toBe(false);
    });

    test('should return 503 when AI service is unavailable or times out', async () => {
      const err = new ApiError(503, 'Resume analysis service is temporarily unavailable. Please try again shortly.', {
        error_type: 'ServiceUnavailable',
      });
      jest.spyOn(aiMlClient, 'checkGeneralAts').mockRejectedValue(err);

      const res = await request(app)
        .post('/api/candidates/me/ats-check')
        .set('Authorization', `Bearer ${candidate1Token}`)
        .attach('resume', Buffer.from('%PDF-1.4 resume'), 'cv.pdf');

      expect(res.status).toBe(503);
      expect(res.body.message).toMatch(/temporarily unavailable/i);
    });
  });

  describe('2. POST /api/jobs/:jobId/ats-check (Job-Specific ATS Check)', () => {
    let openJobId;
    let closedJobId;

    beforeEach(async () => {
      const [j1] = await db('jobs').insert({
        recruiter_id: 101,
        title: 'Senior Python Engineer',
        company: 'Cloud Corp',
        skills: JSON.stringify(['Python', 'FastAPI', 'Docker', 'PostgreSQL']),
        experience: '5+ years backend software engineering',
        description: 'Design and deploy scalable asynchronous REST APIs and microservices in Python.',
        status: 'OPEN',
      }).returning('id');
      openJobId = typeof j1 === 'object' ? j1.id : j1;

      const [j2] = await db('jobs').insert({
        recruiter_id: 101,
        title: 'Closed Position',
        company: 'Cloud Corp',
        skills: JSON.stringify(['Python']),
        experience: '2 years',
        description: 'Position is now closed for all candidates.',
        status: 'CLOSED',
      }).returning('id');
      closedJobId = typeof j2 === 'object' ? j2.id : j2;
    });

    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app).post(`/api/jobs/${openJobId}/ats-check`);
      expect(res.status).toBe(401);
    });

    test('should reject request when role is not CANDIDATE (403)', async () => {
      const res = await request(app)
        .post(`/api/jobs/${openJobId}/ats-check`)
        .set('Authorization', `Bearer ${recruiter1Token}`);
      expect(res.status).toBe(403);
    });

    test('should return 404 when job does not exist', async () => {
      const res = await request(app)
        .post('/api/jobs/99999/ats-check')
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Job not found/i);
    });

    test('should return 400 when job status is CLOSED', async () => {
      const res = await request(app)
        .post(`/api/jobs/${closedJobId}/ats-check`)
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Job is not open/i);
    });

    test('should return 400 when candidate has no stored resume and no file is attached', async () => {
      const res = await request(app)
        .post(`/api/jobs/${openJobId}/ats-check`)
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Upload your resume first/i);
    });

    test('should succeed when candidate uploads resume for open job', async () => {
      const spy = jest.spyOn(aiMlClient, 'checkJobAts').mockResolvedValue(sampleJobAtsResult);

      const res = await request(app)
        .post(`/api/jobs/${openJobId}/ats-check`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .attach('resume', Buffer.from('%PDF-1.4 python developer resume'), 'python_dev.pdf');

      expect(res.status).toBe(200);
      expect(res.body.data.mode).toBe('job_specific');
      expect(res.body.data.keyword_analysis.matched_keywords).toEqual(['Python', 'FastAPI']);
      expect(spy).toHaveBeenCalled();
    });

    test('should succeed using candidate stored resume when no file is attached', async () => {
      await db('candidates').insert({
        user_id: 301,
        resume_path: 'uploads/resumes/existing_resume.pdf',
        resume_original_name: 'existing_resume.pdf',
      });

      const spy = jest.spyOn(aiMlClient, 'checkJobAts').mockResolvedValue(sampleJobAtsResult);

      const res = await request(app)
        .post(`/api/jobs/${openJobId}/ats-check`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.overall_score).toBe(87.0);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('3. GET /api/candidates/me/ats (Retrieve Candidate ATS Result)', () => {
    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app).get('/api/candidates/me/ats');
      expect(res.status).toBe(401);
    });

    test('should reject request when role is not CANDIDATE (403)', async () => {
      const res = await request(app)
        .get('/api/candidates/me/ats')
        .set('Authorization', `Bearer ${recruiter1Token}`);
      expect(res.status).toBe(403);
    });

    test('should return 404 when candidate has no profile or stored ATS result', async () => {
      const res = await request(app)
        .get('/api/candidates/me/ats')
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/No ATS evaluation found/i);
    });

    test('should return 200 with candidate own ATS result', async () => {
      await db('candidates').insert({
        user_id: 301,
        resume_path: 'uploads/resumes/c1.pdf',
        resume_original_name: 'c1.pdf',
      });

      jest.spyOn(aiMlClient, 'getCandidateAts').mockResolvedValue(sampleGeneralAtsResult);

      const res = await request(app)
        .get('/api/candidates/me/ats')
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.overall_score).toBe(82.5);
      expect(res.body.data.category_prediction.predicted_category).toBe('Python Developer');
    });

    test('candidate cannot access another candidate ATS data', async () => {
      // Candidate 1 has a profile
      await db('candidates').insert({
        user_id: 301,
        resume_path: 'uploads/resumes/c1.pdf',
        resume_original_name: 'c1.pdf',
      });
      // Candidate 2 has no profile
      const res = await request(app)
        .get('/api/candidates/me/ats')
        .set('Authorization', `Bearer ${candidate2Token}`);

      // Candidate 2 cannot get Candidate 1's data (strictly bound to JWT userId)
      expect(res.status).toBe(404);
    });
  });

  describe('4. GET /api/jobs/:jobId/applications/:applicationId/ats (Recruiter Ownership)', () => {
    let job1Id;
    let job2Id;
    let candidateId;
    let application1Id;
    let application2Id;

    beforeEach(async () => {
      // Recruiter 1 owns Job 1
      const [j1] = await db('jobs').insert({
        recruiter_id: 101,
        title: 'Backend Engineer',
        company: 'Alpha Inc',
        skills: JSON.stringify(['Node.js', 'PostgreSQL']),
        experience: '3+ years',
        description: 'Build backend APIs with high throughput and reliable database schemas.',
        status: 'OPEN',
      }).returning('id');
      job1Id = typeof j1 === 'object' ? j1.id : j1;

      // Recruiter 2 owns Job 2
      const [j2] = await db('jobs').insert({
        recruiter_id: 202,
        title: 'Frontend Engineer',
        company: 'Beta Inc',
        skills: JSON.stringify(['React', 'TypeScript']),
        experience: '3+ years',
        description: 'Build responsive web apps with modern React and Tailwind CSS.',
        status: 'OPEN',
      }).returning('id');
      job2Id = typeof j2 === 'object' ? j2.id : j2;

      // Candidate profile
      const [c] = await db('candidates').insert({
        user_id: 301,
        resume_path: 'uploads/resumes/test_candidate.pdf',
        resume_original_name: 'test_candidate.pdf',
      }).returning('id');
      candidateId = typeof c === 'object' ? c.id : c;

      // Application 1 to Job 1 (owned by Recruiter 1)
      const [app1] = await db('applications').insert({
        job_id: job1Id,
        candidate_id: candidateId,
        status: 'APPLIED',
      }).returning('id');
      application1Id = typeof app1 === 'object' ? app1.id : app1;

      // Application 2 to Job 2 (owned by Recruiter 2)
      const [app2] = await db('applications').insert({
        job_id: job2Id,
        candidate_id: candidateId,
        status: 'APPLIED',
      }).returning('id');
      application2Id = typeof app2 === 'object' ? app2.id : app2;
    });

    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app).get(`/api/jobs/${job1Id}/applications/${application1Id}/ats`);
      expect(res.status).toBe(401);
    });

    test('should reject request when role is CANDIDATE (403)', async () => {
      const res = await request(app)
        .get(`/api/jobs/${job1Id}/applications/${application1Id}/ats`)
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(res.status).toBe(403);
    });

    test('should return 404 when application does not exist', async () => {
      const res = await request(app)
        .get(`/api/jobs/${job1Id}/applications/99999/ats`)
        .set('Authorization', `Bearer ${recruiter1Token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Application not found/i);
    });

    test('should return 404 when application does not belong to specified job', async () => {
      // application2 belongs to job2, requesting against job1
      const res = await request(app)
        .get(`/api/jobs/${job1Id}/applications/${application2Id}/ats`)
        .set('Authorization', `Bearer ${recruiter1Token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Application not found for this job/i);
    });

    test('should enforce recruiter ownership: Recruiter 2 cannot view applicant ATS on Recruiter 1 job (403)', async () => {
      const res = await request(app)
        .get(`/api/jobs/${job1Id}/applications/${application1Id}/ats`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    test('should succeed when owner recruiter views applicant ATS evaluation (200)', async () => {
      const spy = jest.spyOn(aiMlClient, 'checkJobAts').mockResolvedValue(sampleJobAtsResult);

      const res = await request(app)
        .get(`/api/jobs/${job1Id}/applications/${application1Id}/ats`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.mode).toBe('job_specific');
      expect(res.body.data.overall_score).toBe(87.0);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('5. Rate Limiting (10 requests/minute per user)', () => {
    test('should allow 10 requests and return 429 on the 11th request', async () => {
      await db('candidates').insert({
        user_id: 301,
        resume_path: 'uploads/resumes/rate_limit_test.pdf',
        resume_original_name: 'rate_limit_test.pdf',
      });

      jest.spyOn(aiMlClient, 'getCandidateAts').mockResolvedValue(sampleGeneralAtsResult);

      // Unique token for rate-limit isolation
      const rateLimitUserToken = makeToken({ userId: 399, email: 'ratelimit@hiregenius.ai', role: 'CANDIDATE' });
      await db('users').insert({
        id: 399,
        name: 'Rate Limit Tester',
        email: 'ratelimit@hiregenius.ai',
        role: 'CANDIDATE',
        password: 'hash',
      });
      await db('candidates').insert({
        user_id: 399,
        resume_path: 'uploads/resumes/c399.pdf',
        resume_original_name: 'c399.pdf',
      });

      // 10 requests should succeed
      for (let i = 1; i <= 10; i++) {
        const res = await request(app)
          .get('/api/candidates/me/ats')
          .set('Authorization', `Bearer ${rateLimitUserToken}`);
        expect(res.status).toBe(200);
        expect(res.headers['ratelimit-limit']).toBe('10');
      }

      // 11th request should be rate-limited with 429
      const blockedRes = await request(app)
        .get('/api/candidates/me/ats')
        .set('Authorization', `Bearer ${rateLimitUserToken}`);

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.message).toMatch(/Rate limit exceeded/i);
      expect(blockedRes.headers['retry-after']).toBeDefined();
      expect(blockedRes.headers['ratelimit-remaining']).toBe('0');
    });
  });
});
