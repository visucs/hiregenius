const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');
const emailService = require('../../../src/modules/email/email.service');
const candidatesService = require('../../../src/modules/candidates/candidates.service');
const recruiterPreferencesService = require('../../../src/modules/recruiters/recruiterPreferences.service');
const {
  jobAlertTemplate,
  resumeUpdatedTemplate,
  welcomeProfileSetupTemplate,
  applicationReceivedRecruiterTemplate,
} = require('../../../src/modules/email/email.templates');

function makeToken({ userId = 8801, email = 'user8801@example.com', role = 'RECRUITER' } = {}) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('Phase 4 Email Extensions: Job Alerts, Preferences, Resume Updates & Opt-Out', () => {
  const recruiterToken = makeToken({ userId: 8801, email: 'recruiter.ext@example.com', role: 'RECRUITER' });
  const candidateToken = makeToken({ userId: 8802, email: 'candidate.ext@example.com', role: 'CANDIDATE' });

  let originalSendMail;

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
      });
    }

    // Seed test users
    await db('users').whereIn('id', [8801, 8802, 8803]).del();
    await db('users').insert([
      { id: 8801, name: 'Recruiter Bob', email: 'recruiter.ext@example.com', role: 'RECRUITER' },
      { id: 8802, name: 'Candidate Alice', email: 'candidate.ext@example.com', role: 'CANDIDATE' },
      { id: 8803, name: 'Candidate OptedOut', email: 'candidate.optout@example.com', role: 'CANDIDATE' },
    ]);
  });

  afterAll(async () => {
    await db('recruiter_notification_preferences').whereIn('recruiter_user_id', [8801]).del();
    await db('jobs').whereIn('recruiter_id', [8801]).del();
    await db('candidates').whereIn('user_id', [8802, 8803]).del();
    await db('users').whereIn('id', [8801, 8802, 8803]).del();
  });

  beforeEach(async () => {
    if (!emailService.transporter) {
      emailService.transporter = { sendMail: jest.fn() };
    }
    originalSendMail = emailService.transporter.sendMail;
    emailService.transporter.sendMail = jest.fn().mockResolvedValue({ messageId: '<test-ext-msg@hiregenius.ai>' });
  });

  afterEach(() => {
    if (emailService.transporter) {
      emailService.transporter.sendMail = originalSendMail;
    }
    jest.restoreAllMocks();
  });

  describe('Part 1: Template Generations for New Categories', () => {
    test('jobAlertTemplate generates valid HTML and plaintext with mandatory unsubscribe link', () => {
      const tmpl = jobAlertTemplate({
        candidateName: 'Alice Dev',
        jobTitle: 'Senior Cloud Engineer',
        company: 'CloudWorks',
        location: 'Remote',
        descriptionExcerpt: 'Architect and deploy Kubernetes clusters.',
        jobUrl: 'https://hiregenius.ai/jobs/42',
        unsubscribeUrl: 'https://api.hiregenius.ai/api/candidates/job-alerts/unsubscribe?token=abc',
      });

      expect(tmpl.subject).toContain('Senior Cloud Engineer at CloudWorks');
      expect(tmpl.html).toContain('Alice Dev');
      expect(tmpl.html).toContain('Senior Cloud Engineer');
      expect(tmpl.html).toContain('CloudWorks');
      expect(tmpl.html).toContain('href="https://api.hiregenius.ai/api/candidates/job-alerts/unsubscribe?token=abc"');
      expect(tmpl.text).toContain('https://api.hiregenius.ai/api/candidates/job-alerts/unsubscribe?token=abc');
    });

    test('resumeUpdatedTemplate generates security notice with filename and timestamp', () => {
      const tmpl = resumeUpdatedTemplate({
        candidateName: 'Alice',
        filename: 'alice_cv_2026.pdf',
        updatedAt: '2026-09-26T12:00:00.000Z',
      });

      expect(tmpl.subject).toMatch(/Security Notice.*resume was updated/i);
      expect(tmpl.html).toContain('alice_cv_2026.pdf');
      expect(tmpl.html).toMatch(/Didn't make this change\?/i);
      expect(tmpl.text).toContain('alice_cv_2026.pdf');
    });

    test('welcomeProfileSetupTemplate welcomes new candidate and provides CTA', () => {
      const tmpl = welcomeProfileSetupTemplate({
        candidateName: 'Alice',
      });

      expect(tmpl.subject).toMatch(/Welcome to HireGenius AI/i);
      expect(tmpl.html).toContain('Alice');
      expect(tmpl.html).toContain('Explore Open Jobs');
    });

    test('applicationReceivedRecruiterTemplate renders application details and review link', () => {
      const tmpl = applicationReceivedRecruiterTemplate({
        recruiterName: 'Bob',
        candidateName: 'Alice Candidate',
        jobTitle: 'Full Stack Dev',
        applicationUrl: 'https://hiregenius.ai/recruiter/applications',
      });

      expect(tmpl.subject).toContain('Alice Candidate applied for Full Stack Dev');
      expect(tmpl.html).toContain('Alice Candidate');
      expect(tmpl.html).toContain('Full Stack Dev');
      expect(tmpl.html).toContain('https://hiregenius.ai/recruiter/applications');
    });
  });

  describe('Part 1 & 5: Unsubscribe Token Verification & Candidate Opt-Out', () => {
    let candidateAId;
    let candidateBId;

    beforeEach(async () => {
      await db('candidates').whereIn('user_id', [8802, 8803]).del();

      const [cA] = await db('candidates').insert({
        user_id: 8802,
        resume_path: 'uploads/resumes/alice.pdf',
        resume_original_name: 'alice.pdf',
        job_alerts_opt_in: true,
      });
      const [cB] = await db('candidates').insert({
        user_id: 8803,
        resume_path: 'uploads/resumes/optout.pdf',
        resume_original_name: 'optout.pdf',
        job_alerts_opt_in: true,
      });

      candidateAId = cA;
      candidateBId = cB;
    });

    test('signed token successfully unsubscribes candidate A without affecting candidate B', async () => {
      const token = candidatesService.generateUnsubscribeToken(candidateAId);

      const res = await request(app)
        .get(`/api/candidates/job-alerts/unsubscribe?token=${token}`)
        .set('Accept', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.data.job_alerts_opt_in).toBe(false);

      // Verify DB state
      const candidateAInDb = await db('candidates').where('id', candidateAId).first();
      const candidateBInDb = await db('candidates').where('id', candidateBId).first();

      expect(Boolean(candidateAInDb.job_alerts_opt_in)).toBe(false);
      expect(Boolean(candidateBInDb.job_alerts_opt_in)).toBe(true);
    });

    test('tampered / forged token is rejected with 400 Bad Request and does not modify DB', async () => {
      const validToken = candidatesService.generateUnsubscribeToken(candidateAId);
      const forgedToken = validToken.slice(0, -6) + 'xxxxxx'; // corrupt signature

      const res = await request(app)
        .get(`/api/candidates/job-alerts/unsubscribe?token=${forgedToken}`)
        .set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid.*link|token/i);

      // Verify DB was NOT changed
      const candidateAInDb = await db('candidates').where('id', candidateAId).first();
      expect(Boolean(candidateAInDb.job_alerts_opt_in)).toBe(true);
    });

    test('missing token returns 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/candidates/job-alerts/unsubscribe')
        .set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/token.*required/i);
    });
  });

  describe('Part 4: Recruiter Notification Preferences', () => {
    beforeEach(async () => {
      await db('recruiter_notification_preferences').where('recruiter_user_id', 8801).del();
    });

    test('GET /api/recruiters/me/notification-preferences creates defaults lazily', async () => {
      const res = await request(app)
        .get('/api/recruiters/me/notification-preferences')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notify_on_new_application).toBe(false); // opt-in default
      expect(res.body.data.job_alert_dispatch_enabled).toBe(true); // enabled default
    });

    test('PATCH /api/recruiters/me/notification-preferences updates preferences', async () => {
      const res = await request(app)
        .patch('/api/recruiters/me/notification-preferences')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          notify_on_new_application: true,
          job_alert_dispatch_enabled: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.notify_on_new_application).toBe(true);
      expect(res.body.data.job_alert_dispatch_enabled).toBe(false);

      // Verify helper shouldSendForRecruiter reflects changes
      const sendApp = await recruiterPreferencesService.shouldSendForRecruiter(8801, 'notify_on_new_application');
      const sendAlerts = await recruiterPreferencesService.shouldSendForRecruiter(8801, 'job_alert_dispatch_enabled');

      expect(sendApp).toBe(true);
      expect(sendAlerts).toBe(false);
    });

    test('PATCH rejects non-boolean values with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/recruiters/me/notification-preferences')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          notify_on_new_application: 'yes',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/boolean/i);
    });

    test('recruiter routes reject unauthenticated requests (401) and candidate role (403)', async () => {
      const unauth = await request(app).get('/api/recruiters/me/notification-preferences');
      expect(unauth.status).toBe(401);

      const forbidden = await request(app)
        .get('/api/recruiters/me/notification-preferences')
        .set('Authorization', `Bearer ${candidateToken}`);
      expect(forbidden.status).toBe(403);
    });
  });

  describe('Part 1: Job Creation Alert Dispatch & Non-Blocking Safety', () => {
    beforeEach(async () => {
      await db('jobs').where('recruiter_id', 8801).del();
      await db('candidates').whereIn('user_id', [8802, 8803]).del();
      await db('recruiter_notification_preferences').where('recruiter_user_id', 8801).del();

      // Seed Candidate 8802 as Opted-In, Candidate 8803 as Opted-Out
      await db('candidates').insert([
        { user_id: 8802, resume_path: 'uploads/alice.pdf', resume_original_name: 'alice.pdf', job_alerts_opt_in: true },
        { user_id: 8803, resume_path: 'uploads/optout.pdf', resume_original_name: 'optout.pdf', job_alerts_opt_in: false },
      ]);
    });

    test('job creation sends job alerts ONLY to opted-in candidate, NEVER to opted-out candidate', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Staff Platform Engineer',
          company: 'HyperScale AI',
          skills: ['Go', 'Kubernetes'],
          description: 'Build mission-critical high-throughput services.',
          location: 'San Francisco, CA',
        });

      expect(res.status).toBe(201);

      // Await background dispatch tick
      await new Promise((r) => setTimeout(r, 50));

      // Verify email was sent to candidate.ext@example.com
      const sentToOptedIn = sendEmailSpy.mock.calls.some((c) => c[0].to === 'candidate.ext@example.com' && c[0].type === 'JOB_ALERT');
      // Verify email was NOT sent to candidate.optout@example.com
      const sentToOptedOut = sendEmailSpy.mock.calls.some((c) => c[0].to === 'candidate.optout@example.com');

      expect(sentToOptedIn).toBe(true);
      expect(sentToOptedOut).toBe(false);
    });

    test('suppresses job alerts when recruiter has job_alert_dispatch_enabled = false', async () => {
      await recruiterPreferencesService.updatePreferences(8801, { job_alert_dispatch_enabled: false });
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Stealth Mode Executive',
          company: 'Confidential Inc',
          skills: ['Strategy'],
          description: 'Secret project.',
        });

      expect(res.status).toBe(201);
      await new Promise((r) => setTimeout(r, 50));

      const alertCalls = sendEmailSpy.mock.calls.filter((c) => c[0].type === 'JOB_ALERT');
      expect(alertCalls.length).toBe(0);
    });

    test('job creation returns 201 immediately and does not fail even if sendEmail throws or fails', async () => {
      // Mock sendEmail to throw
      jest.spyOn(emailService, 'sendEmail').mockRejectedValueOnce(new Error('SMTP Network Offline'));

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Resilient Architect',
          company: 'RockSolid Corp',
          skills: ['Distributed Systems'],
          description: 'Failure isolated.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Resilient Architect');
    });
  });

  describe('Part 3: Resume Upload Notifications (First-ever vs Re-upload)', () => {
    const dummyPdfPath = path.resolve(__dirname, 'dummy_test_resume.pdf');

    beforeAll(() => {
      fs.writeFileSync(dummyPdfPath, '%PDF-1.4 test dummy content');
    });

    afterAll(() => {
      if (fs.existsSync(dummyPdfPath)) {
        fs.unlinkSync(dummyPdfPath);
      }
    });

    beforeEach(async () => {
      await db('candidates').where('user_id', 8802).del();
    });

    test('first-ever resume upload triggers welcome / profile setup email (WELCOME_PROFILE_SETUP)', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const res = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', dummyPdfPath);

      expect(res.status).toBe(201);
      await new Promise((r) => setTimeout(r, 50));

      const welcomeCall = sendEmailSpy.mock.calls.find((c) => c[0].type === 'WELCOME_PROFILE_SETUP');
      expect(welcomeCall).toBeDefined();
      expect(welcomeCall[0].to).toBe('candidate.ext@example.com');
      expect(welcomeCall[0].subject).toMatch(/Welcome to HireGenius AI/i);
    });

    test('re-upload on existing profile triggers security update email (RESUME_UPDATED) with filename', async () => {
      // 1. Initial upload
      await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', dummyPdfPath);

      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      // 2. Re-upload
      const res = await request(app)
        .post('/api/candidates/me/resume')
        .set('Authorization', `Bearer ${candidateToken}`)
        .attach('resume', dummyPdfPath);

      expect(res.status).toBe(200);
      await new Promise((r) => setTimeout(r, 50));

      const updateCall = sendEmailSpy.mock.calls.find((c) => c[0].type === 'RESUME_UPDATED');
      expect(updateCall).toBeDefined();
      expect(updateCall[0].to).toBe('candidate.ext@example.com');
      expect(updateCall[0].subject).toMatch(/Security Notice: Your resume was updated/i);
      expect(updateCall[0].html).toContain('dummy_test_resume.pdf');
    });
  });
});
