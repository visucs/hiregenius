const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');
const aiMlClient = require('../../../src/modules/candidates/aiMlClient.service');
const { rankingRateLimiter } = require('../../../src/middleware/rateLimiter');
const ApiError = require('../../../src/utils/ApiError');

function makeToken({ userId = 301, email = 'candidate@hiregenius.ai', role = 'CANDIDATE' } = {}) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('Candidate Ranking (RAG) Module - Phase 8 Integration Tests', () => {
  const recruiter1Token = makeToken({ userId: 101, email: 'recruiter1@hiregenius.ai', role: 'RECRUITER' });
  const recruiter2Token = makeToken({ userId: 202, email: 'recruiter2@hiregenius.ai', role: 'RECRUITER' });
  const candidate1Token = makeToken({ userId: 301, email: 'candidate1@hiregenius.ai', role: 'CANDIDATE' });

  let job1Id;
  let job2Id;
  let candidate1Id;
  let candidate2Id;
  let candidate3Id;

  const mockAiRankingResponse = {
    job_id: '1',
    job_title: 'Full Stack Engineer',
    scoring_version: 'rag-v1-untuned',
    weights: { semantic: 0.40, skills: 0.35, experience: 0.15, education: 0.10 },
    semantic_unavailable: false,
    total_applicants: 2,
    ranked_count: 1,
    unrankable_count: 1,
    embedding_calls_count: 3,
    rankings: [
      {
        rank: 1,
        candidate_id: '1',
        score: 87.5,
        components: {
          semantic_score: 85.0,
          skills_score: 90.0,
          experience_score: 85.0,
          education_score: 90.0,
          semantic_weight: 0.40,
          skills_weight: 0.35,
          experience_weight: 0.15,
          education_weight: 0.10,
        },
        matched_skills: ['React', 'Node.js', 'PostgreSQL'],
        missing_skills: ['Docker'],
        candidate_years: 4.5,
        required_years: 3.0,
        degree_matched: true,
        explanation: {
          summary: 'Candidate shows strong alignment with Node.js and React full-stack requirements.',
          strengths: ['Extensive experience building Node.js REST APIs', 'Production experience with React and state management'],
          gaps: ['Container orchestration / Docker not highlighted'],
          recommendation: 'STRONG_MATCH',
          chunk_citations: ['cand_1_exp_0', 'cand_1_skills_0'],
        },
        chunk_ids_evaluated: ['cand_1_exp_0', 'cand_1_skills_0'],
      },
    ],
    not_rankable: [
      {
        candidate_id: '2',
        rankable: false,
        reason: 'Resume parsing failed or no structured resume text available',
      },
    ],
    disclaimer: 'Advisory ranking: weights are UNTUNED. Ranking does not automate hiring decisions or auto-reject applicants.',
  };

  beforeAll(async () => {
    await db.migrate.latest();

    // Ensure users table exists in test DB
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
      await db.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('name');
        t.string('email').unique();
        t.string('role');
        t.boolean('email_verified').defaultTo(true);
        t.boolean('admin_approved').defaultTo(true);
        t.boolean('can_post_jobs').defaultTo(true);
        t.boolean('can_apply_to_jobs').defaultTo(true);
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    // Seed users
    await db('users').insert([
      { id: 101, name: 'Recruiter Alpha', email: 'recruiter1@hiregenius.ai', role: 'RECRUITER' },
      { id: 202, name: 'Recruiter Beta', email: 'recruiter2@hiregenius.ai', role: 'RECRUITER' },
      { id: 301, name: 'Candidate Alice', email: 'candidate1@hiregenius.ai', role: 'CANDIDATE' },
      { id: 302, name: 'Candidate Bob', email: 'candidate2@hiregenius.ai', role: 'CANDIDATE' },
      { id: 303, name: 'Candidate Charlie', email: 'candidate3@hiregenius.ai', role: 'CANDIDATE' },
    ]);

    // Seed candidates
    const [c1] = await db('candidates').insert({
      user_id: 301,
      resume_path: 'uploads/resumes/alice.pdf',
      resume_original_name: 'alice.pdf',
    });
    candidate1Id = c1;

    const [c2] = await db('candidates').insert({
      user_id: 302,
      resume_path: 'uploads/resumes/bob.pdf',
      resume_original_name: 'bob.pdf',
    });
    candidate2Id = c2;

    const [c3] = await db('candidates').insert({
      user_id: 303,
      resume_path: 'uploads/resumes/charlie.pdf',
      resume_original_name: 'charlie.pdf',
    });
    candidate3Id = c3;

    // Seed jobs
    const [j1] = await db('jobs').insert({
      recruiter_id: 101,
      title: 'Full Stack Engineer',
      company: 'TechCorp',
      skills: JSON.stringify(['React', 'Node.js', 'PostgreSQL']),
      experience: '3+ years',
      location: 'Remote',
      description: 'Looking for a Senior Full Stack Engineer with strong React and Node.js skills.',
      status: 'OPEN',
      is_deleted: false,
    });
    job1Id = j1;

    const [j2] = await db('jobs').insert({
      recruiter_id: 202,
      title: 'DevOps Engineer',
      company: 'CloudCorp',
      skills: JSON.stringify(['AWS', 'Kubernetes']),
      description: 'Looking for a DevOps Engineer with Kubernetes expertise.',
      status: 'OPEN',
      is_deleted: false,
    });
    job2Id = j2;

    // Seed applications for Job 1
    await db('applications').insert({
      job_id: job1Id,
      candidate_id: candidate1Id,
      status: 'APPLIED',
      applied_at: new Date('2026-11-20T10:00:00Z'),
      updated_at: new Date('2026-11-20T10:00:00Z'),
    });

    await db('applications').insert({
      job_id: job1Id,
      candidate_id: candidate2Id,
      status: 'APPLIED',
      applied_at: new Date('2026-11-20T11:00:00Z'),
      updated_at: new Date('2026-11-20T11:00:00Z'),
    });
  });

  afterAll(async () => {
    await db('job_ranking_items').del();
    await db('job_rankings').del();
    await db('applications').del();
    await db('jobs').del();
    await db('candidates').del();
    await db('users').del();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    rankingRateLimiter.reset();
  });

  describe('Recruiter Ownership & Privacy Isolation Rules', () => {
    test('recruiter B cannot rank recruiter A\'s job (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/permission/i);
    });

    test('recruiter B cannot read recruiter A\'s ranking snapshot (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(403);
    });

    test('recruiter B cannot read recruiter A\'s ranking history (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/jobs/${job1Id}/ranking/history`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(403);
    });

    test('a candidate gets 403 Forbidden on all ranking endpoints', async () => {
      const postRes = await request(app)
        .post(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(postRes.status).toBe(403);

      const getRes = await request(app)
        .get(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(getRes.status).toBe(403);

      const histRes = await request(app)
        .get(`/api/jobs/${job1Id}/ranking/history`)
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(histRes.status).toBe(403);
    });

    test('unauthenticated request gets 401 Unauthorized', async () => {
      const res = await request(app).get(`/api/jobs/${job1Id}/ranking`);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/jobs/:jobId/ranking (Snapshot Creation & Integrity)', () => {
    test('creates ranking snapshot atomically with both ranked and unrankable applicants', async () => {
      const rankSpy = jest.spyOn(aiMlClient, 'rankApplicants').mockResolvedValue({
        ...mockAiRankingResponse,
        rankings: [
          {
            ...mockAiRankingResponse.rankings[0],
            candidate_id: String(candidate1Id),
          },
        ],
        not_rankable: [
          {
            ...mockAiRankingResponse.not_rankable[0],
            candidate_id: String(candidate2Id),
          },
        ],
      });

      const res = await request(app)
        .post(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(rankSpy).toHaveBeenCalledTimes(1);

      // Verify privacy rule: strictly passed candidate1Id and candidate2Id
      expect(rankSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: job1Id,
          candidateIds: [String(candidate1Id), String(candidate2Id)],
        })
      );

      const ranking = res.body.data.ranking;
      expect(ranking).toBeDefined();
      expect(ranking.job_id).toBe(job1Id);
      expect(ranking.applicant_count).toBe(2);
      expect(ranking.ranked_count).toBe(1);
      expect(ranking.unrankable_count).toBe(1);
      expect(ranking.rankings).toHaveLength(1);
      expect(ranking.not_rankable).toHaveLength(1);

      // Check ranked candidate details
      const rankedAlice = ranking.rankings[0];
      expect(rankedAlice.candidate_id).toBe(candidate1Id);
      expect(rankedAlice.rank).toBe(1);
      expect(rankedAlice.score).toBe(87.5);
      expect(rankedAlice.explanation.summary).toBeDefined();
      expect(rankedAlice.candidate_name).toBe('Candidate Alice');

      // Check unrankable candidate details
      const unrankableBob = ranking.not_rankable[0];
      expect(unrankableBob.candidate_id).toBe(candidate2Id);
      expect(unrankableBob.rankable).toBe(0); // or false
      expect(unrankableBob.reason).toMatch(/resume/i);

      // Verify DB persistence
      const dbRanking = await db('job_rankings').where('id', ranking.id).first();
      expect(dbRanking).toBeDefined();
      const dbItems = await db('job_ranking_items').where('ranking_id', ranking.id);
      expect(dbItems).toHaveLength(2);
    });

    test('never stores partial snapshot if an error occurs during transaction', async () => {
      jest.spyOn(aiMlClient, 'rankApplicants').mockResolvedValue(mockAiRankingResponse);

      const countBefore = await db('job_rankings').count('id as count').first();

      const rankingsRepository = require('../../../src/modules/rankings/rankings.repository');
      const createSnapshotSpy = jest.spyOn(rankingsRepository, 'createSnapshot').mockImplementationOnce(async ({ rankingData }) => {
        return await db.transaction(async (trx) => {
          await trx('job_rankings').insert(rankingData);
          throw new Error('Simulated atomic transaction failure');
        });
      });

      const res = await request(app)
        .post(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(500);

      createSnapshotSpy.mockRestore();

      // Ensure no dangling job_rankings row was created (transaction rolled back)
      const countAfter = await db('job_rankings').count('id as count').first();
      expect(Number(countAfter.count)).toBe(Number(countBefore.count));
    });
  });

  describe('GET /api/jobs/:jobId/ranking (Latest Snapshot & Staleness Flag)', () => {
    test('returns latest snapshot with is_stale: false when no applications have changed', async () => {
      const res = await request(app)
        .get(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.ranking).not.toBeNull();
      expect(res.body.data.is_stale).toBe(false);
      expect(res.body.data.new_applicants_count).toBe(0);
    });

    test('flags snapshot as stale when a new applicant applies after snapshot creation', async () => {
      // Simulate Candidate 3 applying in the future
      await db('applications').insert({
        job_id: job1Id,
        candidate_id: candidate3Id,
        status: 'APPLIED',
        applied_at: new Date(Date.now() + 10000), // future timestamp
        updated_at: new Date(Date.now() + 10000),
      });

      const res = await request(app)
        .get(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_stale).toBe(true);
      expect(res.body.data.new_applicants_count).toBe(1);
    });

    test('flags snapshot as stale when an applicant candidate re-uploads their resume', async () => {
      // Update Alice's candidate record updated_at to future
      await db('candidates').where('id', candidate1Id).update({
        updated_at: new Date(Date.now() + 20000),
      });

      const res = await request(app)
        .get(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_stale).toBe(true);
    });

    test('returns null ranking for job with no rankings yet', async () => {
      const res = await request(app)
        .get(`/api/jobs/${job2Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.ranking).toBeNull();
      expect(res.body.data.is_stale).toBe(false);
    });
  });

  describe('Rate Limiting on POST /api/jobs/:jobId/ranking', () => {
    test('enforces rate limit and returns 429 when threshold exceeded', async () => {
      jest.spyOn(aiMlClient, 'rankApplicants').mockResolvedValue(mockAiRankingResponse);

      // Hit rate limit (configured limit: 10)
      for (let i = 0; i < 10; i++) {
        const okRes = await request(app)
          .post(`/api/jobs/${job1Id}/ranking`)
          .set('Authorization', `Bearer ${recruiter1Token}`);
        expect(okRes.status).toBe(201);
      }

      // 11th request should be rejected with 429
      const rateLimitedRes = await request(app)
        .post(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.headers['retry-after']).toBeDefined();
      expect(rateLimitedRes.body.message).toMatch(/rate limit/i);
    });
  });

  describe('Resilience & Failure Mapping (503 and 504)', () => {
    test('maps AI service offline / connection drop to 503', async () => {
      jest.spyOn(aiMlClient, 'rankApplicants').mockRejectedValue(
        new ApiError(503, 'Candidate ranking service is temporarily unavailable')
      );

      const res = await request(app)
        .post(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(503);
      expect(res.body.message).toMatch(/temporarily unavailable/i);
    });

    test('maps AI service timeout to 504 Gateway Timeout', async () => {
      jest.spyOn(aiMlClient, 'rankApplicants').mockRejectedValue(
        new ApiError(504, 'Candidate ranking request timed out')
      );

      const res = await request(app)
        .post(`/api/jobs/${job1Id}/ranking`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(504);
      expect(res.body.message).toMatch(/timed out/i);
    });
  });

  describe('GET /api/jobs/:jobId/ranking/history', () => {
    test('returns paginated ranking snapshot history for job owner', async () => {
      const res = await request(app)
        .get(`/api/jobs/${job1Id}/ranking/history?page=1&limit=5`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
    });
  });
});
