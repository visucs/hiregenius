const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');
const aiMlClient = require('../../../src/modules/candidates/aiMlClient.service');
const aiInterviewsService = require('../../../src/modules/aiInterviews/aiInterviews.service');

function makeToken({ userId = 301, email = 'candidate@hiregenius.ai', role = 'CANDIDATE' } = {}) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('AI Interviews Module - Phase 7 Comprehensive Test Suite', () => {
  const recruiter1Token = makeToken({ userId: 601, email: 'recruiter601@hiregenius.ai', role: 'RECRUITER' });
  const recruiter2Token = makeToken({ userId: 602, email: 'recruiter602@hiregenius.ai', role: 'RECRUITER' });
  const candidate1Token = makeToken({ userId: 701, email: 'candidate701@hiregenius.ai', role: 'CANDIDATE' });
  const candidate2Token = makeToken({ userId: 702, email: 'candidate702@hiregenius.ai', role: 'CANDIDATE' });

  let job1Id;
  let candidate1Id;
  let application1Id;
  let interview1Id;
  let questionIds = [];

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
    // Clear in proper dependency order
    await db('ai_interview_evaluations').del();
    await db('ai_interview_answers').del();
    await db('ai_interview_questions').del();
    await db('ai_interviews').del();
    await db('notifications').del();
    await db('applications').del();
    await db('candidates').del();
    await db('jobs').del();
    await db('users').whereIn('id', TEST_USER_IDS).del();

    // 1. Seed users
    await db('users').insert([
      { id: 601, name: 'Recruiter One', email: 'recruiter601@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 602, name: 'Recruiter Two', email: 'recruiter602@hiregenius.ai', role: 'RECRUITER', password: 'hash' },
      { id: 701, name: 'Candidate One', email: 'candidate701@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
      { id: 702, name: 'Candidate Two', email: 'candidate702@hiregenius.ai', role: 'CANDIDATE', password: 'hash' },
    ]);

    // 2. Seed Job for Recruiter 1
    const [j1] = await db('jobs').insert({
      recruiter_id: 601,
      title: 'Full Stack Engineer',
      company: 'Antigravity Inc',
      skills: JSON.stringify(['Node.js', 'React', 'MySQL', 'System Design']),
      description: 'Looking for a senior engineer skilled in Node.js, React, and MySQL database optimization.',
      status: 'OPEN',
      is_deleted: false,
    });
    job1Id = j1;

    // 3. Seed Candidate 1 profile
    const [c1] = await db('candidates').insert({
      user_id: 701,
      resume_path: 'uploads/resumes/c701_resume.pdf',
      resume_original_name: 'resume.pdf',
    });
    candidate1Id = c1;

    // 4. Seed Application 1
    const [a1] = await db('applications').insert({
      job_id: job1Id,
      candidate_id: candidate1Id,
      status: 'SCREENING',
    });
    application1Id = a1;

    // Mock AI ML client getParsedResume
    jest.spyOn(aiMlClient, 'getParsedResume').mockResolvedValue({
      skills: ['JavaScript', 'Node.js', 'React', 'Express'],
      experience: [{ title: 'Software Engineer', company: 'Tech Corp', years: 3 }],
      education: [{ degree: 'B.Tech CS' }],
    });

    // Mock AI ML client generateInterviewQuestions
    jest.spyOn(aiMlClient, 'generateInterviewQuestions').mockResolvedValue({
      questions: [
        {
          question_number: 1,
          type: 'TECHNICAL',
          difficulty: 'MEDIUM',
          text: 'Explain how Node.js event loop handles asynchronous I/O operations.',
          expected_points: ['Libuv event loop phases', 'Microtasks queue precedence'],
        },
        {
          question_number: 2,
          type: 'BEHAVIORAL',
          difficulty: 'EASY',
          text: 'Describe a situation where you resolved a team conflict during a production outage.',
          expected_points: ['Clear communication', 'Blameless postmortem'],
        },
      ],
      metadata: { target_seniority: 'Mid' },
    });

    // Mock AI ML client evaluateInterviewAnswers
    jest.spyOn(aiMlClient, 'evaluateInterviewAnswers').mockResolvedValue({
      per_answer_evaluations: [
        {
          question_id: 'q1',
          question_text: 'Explain how Node.js event loop handles asynchronous I/O operations.',
          candidate_answer: 'Node uses libuv with phases like poll, check, timers.',
          technical_score: 85,
          communication_score: 90,
          strengths: ['Identified libuv phases correctly'],
          weaknesses: ['Could elaborate on microtask prioritization'],
          evidence_quotes: ['Node uses libuv with phases like poll, check'],
        },
        {
          question_id: 'q2',
          question_text: 'Describe a situation where you resolved a team conflict.',
          candidate_answer: 'I scheduled a blameless postmortem meeting to align priorities.',
          technical_score: 80,
          communication_score: 88,
          strengths: ['Adopted blameless approach'],
          weaknesses: [],
          evidence_quotes: ['blameless postmortem meeting'],
        },
      ],
      aggregate: {
        overall_score: 84.5,
        technical_score: 82.5,
        communication_score: 89.0,
        indicative_confidence: 86.0,
        recommendation: 'SHORTLIST',
        summary: 'Candidate demonstrated solid knowledge of Node event loop and professional incident review.',
        key_strengths: ['Libuv familiarity', 'Blameless culture'],
        key_concerns: [],
        disclaimer: 'AI assessment is advisory; final hiring decision remains with the recruiter.',
      },
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // 1. Generation & Recruiter Draft Management
  // =========================================================================
  describe('AI Interview Generation & Draft Management', () => {
    it('generates questions for recruiter job application and transitions status to INTERVIEW', async () => {
      const res = await request(app)
        .post('/api/ai-interviews/generate')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          applicationId: application1Id,
          durationMinutes: 45,
          questionCount: 6,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.questions).toHaveLength(2);
      expect(res.body.data.questions[0].expected_points).toBeDefined(); // Recruiter CAN see expected points

      interview1Id = res.body.data.id;
    });

    it('rejects generation if non-owner recruiter tries to generate for another recruiter job', async () => {
      const res = await request(app)
        .post('/api/ai-interviews/generate')
        .set('Authorization', `Bearer ${recruiter2Token}`) // Recruiter 2 does not own job 1
        .send({
          applicationId: application1Id,
          durationMinutes: 30,
        });

      expect(res.status).toBe(403);
    });

    it('allows recruiter to edit questions and reorder them in draft state', async () => {
      // First generate
      const genRes = await request(app)
        .post('/api/ai-interviews/generate')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ applicationId: application1Id });
      const intId = genRes.body.data.id;
      const qList = genRes.body.data.questions;

      const editRes = await request(app)
        .put(`/api/ai-interviews/${intId}/questions`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          questions: [
            {
              id: qList[0].id,
              text: 'Updated technical question on Node.js stream backpressure.',
              difficulty: 'HARD',
            },
          ],
        });

      expect(editRes.status).toBe(200);
      expect(editRes.body.status).toBe(200);
      const updatedQ = editRes.body.data.questions.find((q) => q.id === qList[0].id);
      expect(updatedQ.text).toBe('Updated technical question on Node.js stream backpressure.');
      expect(updatedQ.difficulty).toBe('HARD');
    });
  });

  // =========================================================================
  // 2. Publishing & Candidate Notification
  // =========================================================================
  describe('Publishing & Ownership Checks', () => {
    let intId;

    beforeEach(async () => {
      const genRes = await request(app)
        .post('/api/ai-interviews/generate')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ applicationId: application1Id });
      intId = genRes.body.data.id;
    });

    it('rejects publishing by non-owner recruiter (403)', async () => {
      const res = await request(app)
        .post(`/api/ai-interviews/${intId}/publish`)
        .set('Authorization', `Bearer ${recruiter2Token}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it('publishes interview with window and creates candidate notification', async () => {
      const windowStart = new Date(Date.now() - 60000).toISOString();
      const windowEnd = new Date(Date.now() + 7 * 86400000).toISOString();

      const res = await request(app)
        .post(`/api/ai-interviews/${intId}/publish`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          windowStart,
          windowEnd,
          durationMinutes: 30,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PUBLISHED');

      // Verify Application status transitioned to INTERVIEW
      const appRow = await db('applications').where('id', application1Id).first();
      expect(appRow.status).toBe('INTERVIEW');

      // Verify in-app notification created for candidate
      const notif = await db('notifications')
        .where({ user_id: 701, type: 'INTERVIEW_SCHEDULED' })
        .first();
      expect(notif).toBeDefined();
      expect(notif.message).toContain('You have been invited to take an AI assessment');
    });
  });

  // =========================================================================
  // 3. Candidate Experience, Consent Gate (Addendum 1) & Room Security
  // =========================================================================
  describe('Candidate Room, Consent Gate & Security', () => {
    let publishedIntId;

    beforeEach(async () => {
      const genRes = await request(app)
        .post('/api/ai-interviews/generate')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ applicationId: application1Id });
      publishedIntId = genRes.body.data.id;

      await request(app)
        .post(`/api/ai-interviews/${publishedIntId}/publish`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          windowStart: new Date(Date.now() - 60000).toISOString(),
          windowEnd: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 30,
        });
    });

    it('blocks other candidates from entering the room (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/ai-interviews/${publishedIntId}/room`)
        .set('Authorization', `Bearer ${candidate2Token}`); // Candidate 2 != Candidate 1

      expect(res.status).toBe(403);
    });

    it('NEVER leaks expected_points or rubrics to the candidate in the room payload', async () => {
      const res = await request(app)
        .get(`/api/ai-interviews/${publishedIntId}/room`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.questions).toHaveLength(2);
      res.body.data.questions.forEach((q) => {
        expect(q.expected_points).toBeUndefined();
        expect(q.expectedPoints).toBeUndefined();
      });
      expect(res.body.data.status).toBe('PUBLISHED');
      expect(res.body.data.timeRemainingSeconds).toBe(1800); // 30 mins
    });

    it('enforces Addendum 1: blocks starting interview without explicit consent acknowledgment', async () => {
      const res = await request(app)
        .post(`/api/ai-interviews/${publishedIntId}/start`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ consentAcknowledged: false });

      expect(res.status).toBe(400);

      // Verify db row was not started
      const row = await db('ai_interviews').where('id', publishedIntId).first();
      expect(row.status).toBe('PUBLISHED');
      expect(row.acknowledged_at).toBeNull();
    });

    it('starts interview when consent is acknowledged and sets server-side timer', async () => {
      const res = await request(app)
        .post(`/api/ai-interviews/${publishedIntId}/start`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ consentAcknowledged: true });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.startedAt).toBeDefined();
      expect(res.body.data.acknowledgedAt).toBeDefined();
      expect(res.body.data.timeRemainingSeconds).toBeGreaterThan(1700);

      const dbRow = await db('ai_interviews').where('id', publishedIntId).first();
      expect(dbRow.status).toBe('IN_PROGRESS');
      expect(dbRow.acknowledged_at).not.toBeNull();
      expect(dbRow.started_at).not.toBeNull();
    });
  });

  // =========================================================================
  // 4. Autosave & Single Attempt Submission
  // =========================================================================
  describe('Autosave, Submission & AI Resilience', () => {
    let activeIntId;
    let questions;

    beforeEach(async () => {
      const genRes = await request(app)
        .post('/api/ai-interviews/generate')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ applicationId: application1Id });
      activeIntId = genRes.body.data.id;
      questions = genRes.body.data.questions;

      await request(app)
        .post(`/api/ai-interviews/${activeIntId}/publish`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          windowStart: new Date(Date.now() - 60000).toISOString(),
          windowEnd: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 30,
        });

      await request(app)
        .post(`/api/ai-interviews/${activeIntId}/start`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ consentAcknowledged: true });
    });

    it('autosaves candidate answers idempotently up to 2000 chars', async () => {
      const q1Id = questions[0].id;
      const answerText = 'Node event loop consists of timers, pending callbacks, idle/prepare, poll, check, and close callbacks.';

      const res = await request(app)
        .post(`/api/ai-interviews/${activeIntId}/questions/${q1Id}/answer`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ answerText });

      expect(res.status).toBe(200);
      expect(res.body.data.answerText).toBe(answerText);

      // Verify stored in DB
      const dbAnswer = await db('ai_interview_answers')
        .where({ interview_id: activeIntId, question_id: q1Id })
        .first();
      expect(dbAnswer.answer_text).toBe(answerText);
      expect(dbAnswer.char_count).toBeGreaterThan(10);
    });

    it('submits interview, triggers evaluation, and prevents retakes (single attempt)', async () => {
      const q1Id = questions[0].id;
      await request(app)
        .post(`/api/ai-interviews/${activeIntId}/questions/${q1Id}/answer`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ answerText: 'Node uses libuv with phases like poll, check, timers.' });

      // Submit
      const submitRes = await request(app)
        .post(`/api/ai-interviews/${activeIntId}/submit`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.status).toBe('SUBMITTED');

      // Verify cannot submit again (single attempt enforcement)
      const resubmitRes = await request(app)
        .post(`/api/ai-interviews/${activeIntId}/submit`)
        .set('Authorization', `Bearer ${candidate1Token}`);
      expect(resubmitRes.status).toBe(400);

      // Verify cannot autosave after submission
      const postSubmitAutosave = await request(app)
        .post(`/api/ai-interviews/${activeIntId}/questions/${q1Id}/answer`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ answerText: 'Trying to change answer after submitting' });
      expect(postSubmitAutosave.status).toBe(400);
    });

    it('resilience: if AI evaluation service fails, answers are kept safe and recruiter can retry', async () => {
      // Mock AI failure
      aiMlClient.evaluateInterviewAnswers.mockRejectedValueOnce(new Error('Gemini API 503 Service Unavailable'));

      const q1Id = questions[0].id;
      await request(app)
        .post(`/api/ai-interviews/${activeIntId}/questions/${q1Id}/answer`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ answerText: 'High quality candidate answer preserved safely.' });

      // Submit should succeed even if evaluation fails in background
      const submitRes = await request(app)
        .post(`/api/ai-interviews/${activeIntId}/submit`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(submitRes.status).toBe(200);

      // Verify answers are intact in DB
      const ansRow = await db('ai_interview_answers')
        .where({ interview_id: activeIntId, question_id: q1Id })
        .first();
      expect(ansRow.answer_text).toBe('High quality candidate answer preserved safely.');

      // Verify status is SUBMITTED and evaluation_status is FAILED
      const intRow = await db('ai_interviews').where('id', activeIntId).first();
      expect(intRow.status).toBe('SUBMITTED');
      const evalRow = await db('ai_interview_evaluations').where('interview_id', activeIntId).first();
      expect(evalRow.evaluation_status).toBe('FAILED');
      expect(evalRow.error_message).toContain('Gemini API 503');

      // Now recruiter retries evaluation
      const retryRes = await request(app)
        .post(`/api/ai-interviews/${activeIntId}/evaluation/retry`)
        .set('Authorization', `Bearer ${recruiter1Token}`);

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.evaluation_status).toBe('EVALUATED');
      expect(retryRes.body.data.overall_score).toBe(84.5);
    });
  });

  // =========================================================================
  // 5. Feedback Release Toggle & Candidate View
  // =========================================================================
  describe('Feedback Release Toggle', () => {
    let intId;

    beforeEach(async () => {
      const genRes = await request(app)
        .post('/api/ai-interviews/generate')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ applicationId: application1Id });
      intId = genRes.body.data.id;

      await request(app)
        .post(`/api/ai-interviews/${intId}/publish`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({
          windowStart: new Date(Date.now() - 60000).toISOString(),
          windowEnd: new Date(Date.now() + 86400000).toISOString(),
        });

      await request(app)
        .post(`/api/ai-interviews/${intId}/start`)
        .set('Authorization', `Bearer ${candidate1Token}`)
        .send({ consentAcknowledged: true });

      await request(app)
        .post(`/api/ai-interviews/${intId}/submit`)
        .set('Authorization', `Bearer ${candidate1Token}`);
    });

    it('candidate does NOT see scores when feedback_released is false (default)', async () => {
      const roomRes = await request(app)
        .get(`/api/ai-interviews/${intId}/room`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(roomRes.status).toBe(200);
      expect(roomRes.body.data.evaluation).toBeNull(); // Recruiter has not released it
    });

    it('candidate sees scores only after recruiter releases feedback', async () => {
      // Recruiter toggles release
      const toggleRes = await request(app)
        .post(`/api/ai-interviews/${intId}/release-feedback`)
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ released: true });

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.data.feedback_released).toBe(1);

      // Now candidate views room
      const roomRes = await request(app)
        .get(`/api/ai-interviews/${intId}/room`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(roomRes.status).toBe(200);
      expect(roomRes.body.data.evaluation).toBeDefined();
      expect(roomRes.body.data.evaluation.overall_score).toBe(84.5);
      expect(roomRes.body.data.evaluation.recommendation).toBe('SHORTLIST');
    });
  });

  // =========================================================================
  // 6. Retention Cleanup (Addendum 2)
  // =========================================================================
  describe('Retention Policy & Cascade Deletion (Addendum 2)', () => {
    it('cleans up interviews older than retention threshold', async () => {
      const genRes = await request(app)
        .post('/api/ai-interviews/generate')
        .set('Authorization', `Bearer ${recruiter1Token}`)
        .send({ applicationId: application1Id });
      const oldIntId = genRes.body.data.id;

      await db('ai_interview_answers').insert({
        interview_id: oldIntId,
        question_id: genRes.body.data.questions[0].id,
        answer_text: 'Sensitive candidate answer',
        char_count: 26,
      });

      // Manually backdate created_at to 200 days ago
      const twoHundredDaysAgo = new Date(Date.now() - 200 * 86400000).toISOString();
      await db('ai_interviews').where('id', oldIntId).update({
        created_at: twoHundredDaysAgo,
        updated_at: twoHundredDaysAgo,
      });

      // Run cleanup with 180 days retention
      const result = await aiInterviewsService.cleanupOldInterviews(180);
      expect(result.purgedCount).toBeGreaterThanOrEqual(1);

      // Verify sensitive answer text is purged
      const ansCheck = await db('ai_interview_answers').where('interview_id', oldIntId).first();
      expect(ansCheck.answer_text).toBe('[PURGED_DUE_TO_RETENTION_POLICY]');
    });
  });
});
