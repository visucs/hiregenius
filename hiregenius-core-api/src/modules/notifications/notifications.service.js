const db = require('../../config/db');
const notificationsRepository = require('./notifications.repository');
const interviewsRepository = require('../interviews/interviews.repository');
const applicationsRepository = require('../applications/applications.repository');
const emailService = require('../email/email.service');
const recruiterPreferencesService = require('../recruiters/recruiterPreferences.service');
const {
  interviewScheduledTemplate,
  interviewCancelledTemplate,
  statusChangedTemplate,
  applicationReceivedRecruiterTemplate,
} = require('../email/email.templates');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const EMAILABLE_NOTIFICATION_CONFIG = {
  INTERVIEW_SCHEDULED: true,
  INTERVIEW_CANCELLED: true,
  STATUS_CHANGED: true, // Dynamically filtered: SHORTLISTED, HIRED, REJECTED
  APPLICATION_RECEIVED: false, // In-app notification only, UNLESS recruiter opted in via preferences
};

class NotificationsService {
  /**
   * Internal helper to create a notification.
   * Can be called as createNotification({ userId, type, message, relatedEntityType, relatedEntityId, metadata })
   * or createNotification(userId, type, message, relatedEntityType, relatedEntityId)
   */
  async createNotification(dataOrUserId, type, message, relatedEntityType, relatedEntityId) {
    let payload;
    if (typeof dataOrUserId === 'object' && dataOrUserId !== null) {
      payload = {
        user_id: dataOrUserId.userId || dataOrUserId.user_id,
        type: dataOrUserId.type,
        message: dataOrUserId.message,
        related_entity_type: dataOrUserId.relatedEntityType || dataOrUserId.related_entity_type || null,
        related_entity_id: dataOrUserId.relatedEntityId || dataOrUserId.related_entity_id || null,
        metadata: dataOrUserId.metadata || null,
      };
    } else {
      payload = {
        user_id: dataOrUserId,
        type,
        message,
        related_entity_type: relatedEntityType || null,
        related_entity_id: relatedEntityId || null,
        metadata: null,
      };
    }

    if (!payload.user_id || !payload.type || !payload.message) {
      throw ApiError.badRequest('Notification requires user_id, type, and message');
    }

    // 1. In-app notification is the source of truth - create DB row first
    const notification = await notificationsRepository.create({
      user_id: payload.user_id,
      type: payload.type,
      message: payload.message,
      related_entity_type: payload.related_entity_type,
      related_entity_id: payload.related_entity_id,
    });

    // 2. Fire-and-forget asynchronous email delivery (non-blocking, failure-isolated)
    notification._dispatchPromise = this.dispatchNotificationEmail(notification, payload).catch((err) => {
      console.error(`[NotificationEmail] Background dispatch unhandled error for notification ${notification.id}:`, err);
    });

    return notification;
  }

  /**
   * Dispatches email corresponding to an in-app notification if configured.
   * Completely isolated: never throws to caller.
   */
  async dispatchNotificationEmail(notification, payload = {}) {
    try {
      const type = notification.type;

      if (!EMAILABLE_NOTIFICATION_CONFIG[type]) {
        if (type === 'APPLICATION_RECEIVED') {
          const shouldSend = await recruiterPreferencesService.shouldSendForRecruiter(
            notification.user_id,
            'notify_on_new_application'
          );
          if (!shouldSend) {
            return;
          }
        } else {
          return;
        }
      }

      // Fetch recipient user record (email and name)
      let user = null;
      try {
        user = await db('users').where({ id: Number(notification.user_id) }).first();
      } catch {
        return;
      }
      if (!user || !user.email) {
        console.warn(`[NotificationEmail] No recipient email found for user_id ${notification.user_id} (notification: ${notification.id})`);
        return;
      }

      let template = null;

      if (type === 'INTERVIEW_SCHEDULED' || type === 'INTERVIEW_CANCELLED') {
        const interview = notification.related_entity_id
          ? await interviewsRepository.findById(notification.related_entity_id)
          : null;

        const candidateName = user.name || interview?.candidate_name || 'Candidate';
        const jobTitle = interview?.job_title || 'Position';
        const company = interview?.job_company || 'HireGenius';
        const scheduledAt = interview?.scheduled_at || payload.metadata?.scheduledAt;
        const meetingLink = interview?.meeting_link || payload.metadata?.meetingLink;

        if (type === 'INTERVIEW_SCHEDULED') {
          template = interviewScheduledTemplate({
            candidateName,
            jobTitle,
            company,
            scheduledAt,
            meetingLink,
          });
        } else {
          template = interviewCancelledTemplate({
            candidateName,
            jobTitle,
            company,
            scheduledAt,
          });
        }
      } else if (type === 'STATUS_CHANGED') {
        const application = notification.related_entity_id
          ? await applicationsRepository.findById(notification.related_entity_id)
          : null;

        // Determine status from metadata or application record
        const status = (payload.metadata?.status || application?.status || '').toUpperCase();

        // Only email for meaningful terminal/positive transitions: SHORTLISTED, HIRED, REJECTED
        // Do NOT email on APPLIED, SCREENING, or INTERVIEW
        if (!['SHORTLISTED', 'HIRED', 'REJECTED'].includes(status)) {
          return;
        }

        const candidateName = user.name || application?.candidate_name || 'Candidate';
        const jobTitle = application?.job_title || 'Position';
        const company = application?.job_company || 'HireGenius';

        template = statusChangedTemplate({
          candidateName,
          jobTitle,
          company,
          status,
        });
      } else if (type === 'APPLICATION_RECEIVED') {
        const application = notification.related_entity_id
          ? await applicationsRepository.findById(notification.related_entity_id)
          : null;

        const candidateName = payload.metadata?.candidateName || application?.candidate_name || 'A candidate';
        const jobTitle = payload.metadata?.jobTitle || application?.job_title || 'your job opening';
        const recruiterName = user.name || 'Recruiter';
        const applicationUrl = `${env.FRONTEND_BASE_URL || 'https://hiregenius-delta.vercel.app'}/recruiter/applications`;

        template = applicationReceivedRecruiterTemplate({
          recruiterName,
          candidateName,
          jobTitle,
          applicationUrl,
        });
      }

      if (template) {
        await emailService.sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
          notificationId: notification.id,
          type: notification.type,
        });
      }
    } catch (err) {
      console.error(`[NotificationEmail] Unexpected error during email dispatch for notification ${notification?.id}:`, err);
    }
  }

  async getMyNotifications(userId, query = {}) {
    let isRead = query.is_read;
    if (isRead === undefined && query.unreadOnly === true) {
      isRead = false;
    }
    const { page = 1, limit = 20 } = query;
    return notificationsRepository.findByUser(userId, {
      isRead,
      page,
      limit,
    });
  }

  async markAsRead(notificationId, userId) {
    const notification = await notificationsRepository.findById(notificationId);
    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    if (Number(notification.user_id) !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to access this notification');
    }

    return notificationsRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId) {
    return notificationsRepository.markAllAsRead(userId);
  }
}

module.exports = new NotificationsService();
