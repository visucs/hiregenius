const db = require('../../../src/config/db');
const emailService = require('../../../src/modules/email/email.service');
const notificationsService = require('../../../src/modules/notifications/notifications.service');
const {
  interviewScheduledTemplate,
  interviewCancelledTemplate,
  statusChangedTemplate,
  formatDateTime,
} = require('../../../src/modules/email/email.templates');

describe('Email Module & Email-Notification Delivery Wiring', () => {
  let originalSendMail;

  beforeAll(async () => {
    await db.migrate.latest();

    // Ensure users table exists for testing
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

    // Seed test user
    await db('users').whereIn('id', [9901, 9902]).del();
    await db('users').insert([
      { id: 9901, name: 'Candidate John', email: 'john.candidate@example.com', role: 'CANDIDATE' },
      { id: 9902, name: 'Recruiter Jane', email: 'jane.recruiter@example.com', role: 'RECRUITER' },
    ]);
  });

  afterAll(async () => {
    await db('notifications').whereIn('user_id', [9901, 9902]).del();
    await db('users').whereIn('id', [9901, 9902]).del();
  });

  beforeEach(async () => {
    await db('notifications').whereIn('user_id', [9901, 9902]).del();

    // Save original transporter sendMail
    if (!emailService.transporter) {
      emailService.transporter = { sendMail: jest.fn() };
    }
    originalSendMail = emailService.transporter.sendMail;
    emailService.transporter.sendMail = jest.fn().mockResolvedValue({ messageId: '<test-msg-123@hiregenius.ai>' });
  });

  afterEach(() => {
    if (emailService.transporter) {
      emailService.transporter.sendMail = originalSendMail;
    }
    jest.restoreAllMocks();
  });

  describe('Email Templates Generation', () => {
    test('formatDateTime handles ISO strings and invalid dates gracefully', () => {
      const formatted = formatDateTime('2026-10-15T14:30:00.000Z');
      expect(formatted).toContain('2026');
      expect(formatDateTime(null)).toBe('To be confirmed');
    });

    test('interviewScheduledTemplate generates valid HTML and plaintext', () => {
      const res = interviewScheduledTemplate({
        candidateName: 'John Doe',
        jobTitle: 'Senior React Developer',
        company: 'Stripe Labs',
        scheduledAt: '2026-10-15T14:30:00.000Z',
        meetingLink: 'https://meet.google.com/xyz-test',
      });

      expect(res.subject).toContain('Interview Scheduled');
      expect(res.subject).toContain('Senior React Developer');
      expect(res.html).toContain('John Doe');
      expect(res.html).toContain('Stripe Labs');
      expect(res.html).toContain('https://meet.google.com/xyz-test');
      expect(res.text).toContain('John Doe');
      expect(res.text).toContain('https://meet.google.com/xyz-test');
    });

    test('interviewCancelledTemplate clearly informs cancellation without active link', () => {
      const res = interviewCancelledTemplate({
        candidateName: 'John Doe',
        jobTitle: 'Senior React Developer',
        company: 'Stripe Labs',
        scheduledAt: '2026-10-15T14:30:00.000Z',
      });

      expect(res.subject).toContain('Interview Cancelled');
      expect(res.html).toContain('cancelled');
      expect(res.html).not.toContain('Join Interview Meeting');
      expect(res.text).toContain('cancelled');
    });

    test('statusChangedTemplate handles SHORTLISTED with encouraging tone', () => {
      const res = statusChangedTemplate({
        candidateName: 'John Doe',
        jobTitle: 'DevOps Engineer',
        company: 'Cloud Corp',
        status: 'SHORTLISTED',
      });

      expect(res.subject).toContain('shortlisted');
      expect(res.html).toContain('Congratulations! You are Shortlisted');
      expect(res.html).toContain('SHORTLISTED');
      expect(res.text).toContain('SHORTLISTED');
    });

    test('statusChangedTemplate handles HIRED with celebratory tone', () => {
      const res = statusChangedTemplate({
        candidateName: 'John Doe',
        jobTitle: 'Lead Architect',
        company: 'Innovate AI',
        status: 'HIRED',
      });

      expect(res.subject).toContain('Job Offer / Hired');
      expect(res.html).toContain('Congratulations on Your Offer!');
      expect(res.html).toContain('HIRED');
    });

    test('statusChangedTemplate handles REJECTED with respectful and professional tone', () => {
      const res = statusChangedTemplate({
        candidateName: 'John Doe',
        jobTitle: 'Backend Dev',
        company: 'Acme Inc',
        status: 'REJECTED',
      });

      expect(res.subject).toContain('Application Update');
      expect(res.html).toContain('REJECTED');
      expect(res.html).toContain('other candidates');
      // Should not contain cheerful congrats
      expect(res.html).not.toContain('Congratulations');
    });
  });

  describe('createNotification Email Triggering & Filtering Rules', () => {
    test('createNotification for INTERVIEW_SCHEDULED calls sendEmail with recipient details', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const notif = await notificationsService.createNotification({
        userId: 9901,
        type: 'INTERVIEW_SCHEDULED',
        message: 'Your interview has been scheduled',
        metadata: {
          scheduledAt: '2026-10-20T10:00:00.000Z',
          meetingLink: 'https://meet.google.com/test-meet',
        },
      });

      expect(notif.id).toBeDefined();
      await notif._dispatchPromise;

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.to).toBe('john.candidate@example.com');
      expect(callArgs.subject).toContain('Interview Scheduled');
      expect(callArgs.type).toBe('INTERVIEW_SCHEDULED');
      expect(callArgs.html).toContain('Candidate John');
    });

    test('createNotification for INTERVIEW_CANCELLED calls sendEmail', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const notif = await notificationsService.createNotification({
        userId: 9901,
        type: 'INTERVIEW_CANCELLED',
        message: 'Your interview has been cancelled',
      });

      await notif._dispatchPromise;

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.to).toBe('john.candidate@example.com');
      expect(callArgs.subject).toContain('Interview Cancelled');
      expect(callArgs.type).toBe('INTERVIEW_CANCELLED');
    });

    test('createNotification for STATUS_CHANGED with SHORTLISTED calls sendEmail', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const notif = await notificationsService.createNotification({
        userId: 9901,
        type: 'STATUS_CHANGED',
        message: 'Your application has been shortlisted',
        metadata: { status: 'SHORTLISTED' },
      });

      await notif._dispatchPromise;

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.to).toBe('john.candidate@example.com');
      expect(callArgs.subject).toContain('shortlisted');
    });

    test('createNotification for non-emailed STATUS_CHANGED (e.g. APPLIED, SCREENING, INTERVIEW) does NOT call sendEmail', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const notif = await notificationsService.createNotification({
        userId: 9901,
        type: 'STATUS_CHANGED',
        message: 'Your application is in screening',
        metadata: { status: 'SCREENING' },
      });

      await notif._dispatchPromise;

      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    test('createNotification for APPLICATION_RECEIVED does NOT call sendEmail (per recruiter anti-spam preference)', async () => {
      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const notif = await notificationsService.createNotification({
        userId: 9902,
        type: 'APPLICATION_RECEIVED',
        message: 'A candidate applied to your job',
      });

      await notif._dispatchPromise;

      expect(sendEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('Failure Isolation (sendEmail never crashes or rolls back in-app notifications)', () => {
    test('sendEmail rejection does NOT throw or fail createNotification', async () => {
      // Force sendMail to reject (e.g. SMTP server timeout / network failure)
      emailService.transporter.sendMail = jest.fn().mockRejectedValue(new Error('SMTP Connection timeout to mx.google.com'));

      let notif;
      await expect(
        (async () => {
          notif = await notificationsService.createNotification({
            userId: 9901,
            type: 'INTERVIEW_SCHEDULED',
            message: 'Your interview has been scheduled',
          });
          return notif;
        })()
      ).resolves.toBeDefined();

      // In-app notification creation succeeded
      expect(notif).toBeDefined();
      expect(notif.id).toBeDefined();

      // Allow async dispatch to execute and catch error
      await notif._dispatchPromise;

      // Verify the in-app notification row is still intact in DB
      const dbRecord = await db('notifications').where({ id: notif.id }).first();
      expect(dbRecord).toBeDefined();
      expect(dbRecord.type).toBe('INTERVIEW_SCHEDULED');
    });
  });
});
