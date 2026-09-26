const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const db = require('../../../src/config/db');
const env = require('../../../src/config/env');
const notificationsService = require('../../../src/modules/notifications/notifications.service');

function makeToken({ userId = 301, email = 'user@hiregenius.ai', role = 'CANDIDATE' } = {}) {
  return jwt.sign({ userId, role }, env.JWT_SIGNING_KEY, {
    subject: email,
    expiresIn: '1h',
    algorithm: 'HS256',
  });
}

describe('Notifications Module - End-to-End & Ownership Enforcement', () => {
  const user1Token = makeToken({ userId: 501, email: 'user1@hiregenius.ai', role: 'RECRUITER' });
  const user2Token = makeToken({ userId: 502, email: 'user2@hiregenius.ai', role: 'CANDIDATE' });

  beforeAll(async () => {
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await db('notifications').del();
  });

  afterAll(async () => {
    await db('notifications').del();
    await db.destroy();
  });

  describe('GET /api/notifications', () => {
    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Authorization header missing/i);
    });

    test('should return only notifications belonging to the logged-in user', async () => {
      await notificationsService.createNotification({
        userId: 501,
        type: 'INTERVIEW_SCHEDULED',
        message: 'Interview 1 for user 501',
      });
      await notificationsService.createNotification({
        userId: 501,
        type: 'STATUS_CHANGED',
        message: 'Status changed for user 501',
      });
      await notificationsService.createNotification({
        userId: 502,
        type: 'INTERVIEW_SCHEDULED',
        message: 'Interview for user 502',
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.notifications[0].user_id).toBe(501);
      expect(res.body.data.notifications[1].user_id).toBe(501);
    });

    test('should filter by is_read query param', async () => {
      const n1 = await notificationsService.createNotification({
        userId: 501,
        type: 'INTERVIEW_SCHEDULED',
        message: 'Unread notification',
      });
      const n2 = await notificationsService.createNotification({
        userId: 501,
        type: 'STATUS_CHANGED',
        message: 'To be read',
      });
      await notificationsService.markAsRead(n2.id, 501);

      // Filter unread (is_read=false)
      const resUnread = await request(app)
        .get('/api/notifications?is_read=false')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(resUnread.status).toBe(200);
      expect(resUnread.body.data.notifications).toHaveLength(1);
      expect(resUnread.body.data.notifications[0].id).toBe(n1.id);
      expect(resUnread.body.data.notifications[0].is_read).toBe(false);

      // Filter read (is_read=true)
      const resRead = await request(app)
        .get('/api/notifications?is_read=true')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(resRead.status).toBe(200);
      expect(resRead.body.data.notifications).toHaveLength(1);
      expect(resRead.body.data.notifications[0].id).toBe(n2.id);
      expect(resRead.body.data.notifications[0].is_read).toBe(true);
    });

    test('should support pagination (limit, page)', async () => {
      for (let i = 1; i <= 5; i++) {
        await notificationsService.createNotification({
          userId: 501,
          type: 'STATUS_CHANGED',
          message: `Notification ${i}`,
        });
      }

      const res = await request(app)
        .get('/api/notifications?page=2&limit=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.page).toBe(2);
      expect(res.body.data.limit).toBe(2);
      expect(res.body.data.total).toBe(5);
      expect(res.body.data.totalPages).toBe(3);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    test('should reject request when unauthenticated (401)', async () => {
      const res = await request(app).patch('/api/notifications/1/read');
      expect(res.status).toBe(401);
    });

    test('should return 404 if notification does not exist', async () => {
      const res = await request(app)
        .patch('/api/notifications/99999/read')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Notification not found/i);
    });

    test('should return 403 Forbidden when user is not the notification owner', async () => {
      const notif = await notificationsService.createNotification({
        userId: 501,
        type: 'INTERVIEW_SCHEDULED',
        message: 'Owner is user 501',
      });

      // User 502 attempts to mark User 501's notification as read
      const res = await request(app)
        .patch(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/permission/i);
    });

    test('should successfully mark notification as read for owner (200)', async () => {
      const notif = await notificationsService.createNotification({
        userId: 501,
        type: 'INTERVIEW_SCHEDULED',
        message: 'Owner is user 501',
      });

      expect(notif.is_read).toBe(false);

      const res = await request(app)
        .patch(`/api/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(notif.id);
      expect(res.body.data.is_read).toBe(true);

      // Verify in DB
      const inDb = await db('notifications').where('id', notif.id).first();
      expect(Boolean(inDb.is_read)).toBe(true);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    test('should mark all unread notifications for logged-in user as read', async () => {
      await notificationsService.createNotification({
        userId: 501,
        type: 'INTERVIEW_SCHEDULED',
        message: 'Unread 1',
      });
      await notificationsService.createNotification({
        userId: 501,
        type: 'STATUS_CHANGED',
        message: 'Unread 2',
      });
      const otherUserNotif = await notificationsService.createNotification({
        userId: 502,
        type: 'INTERVIEW_SCHEDULED',
        message: 'Other user unread',
      });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBe(2);

      // Check user 501 notifications
      const user1List = await db('notifications').where('user_id', 501);
      user1List.forEach((n) => expect(Boolean(n.is_read)).toBe(true));

      // Check user 502 notification is still unread
      const user2Check = await db('notifications').where('id', otherUserNotif.id).first();
      expect(Boolean(user2Check.is_read)).toBe(false);
    });
  });
});
