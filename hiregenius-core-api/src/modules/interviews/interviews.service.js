const interviewsRepository = require('./interviews.repository');
const applicationsRepository = require('../applications/applications.repository');
const notificationsService = require('../notifications/notifications.service');
const ApiError = require('../../utils/ApiError');

class InterviewsService {
  async scheduleInterview(recruiterUserId, { applicationId, scheduledAt, meetingLink }) {
    // 1. Verify application exists
    const application = await applicationsRepository.findById(applicationId);
    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    // 2. Ownership check: verify job belongs to the logged-in recruiter
    if (Number(application.recruiter_id) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to schedule interviews for this application');
    }

    // 3. Check for existing interview for this application
    const existing = await interviewsRepository.findByApplicationId(applicationId);
    if (existing) {
      throw ApiError.conflict('An interview has already been scheduled for this application');
    }

    // 4. Reject past dates
    if (new Date(scheduledAt) <= new Date()) {
      throw ApiError.badRequest('Interview cannot be scheduled in the past');
    }

    // 5. Create interview record
    let interview;
    try {
      interview = await interviewsRepository.create({
        application_id: applicationId,
        scheduled_at: scheduledAt,
        meeting_link: meetingLink || null,
        created_by: recruiterUserId,
      });
    } catch (err) {
      if (
        err.code === 'ER_DUP_ENTRY' ||
        err.code === 'SQLITE_CONSTRAINT' ||
        (err.message && err.message.includes('UNIQUE'))
      ) {
        throw ApiError.conflict('An interview has already been scheduled for this application');
      }
      throw err;
    }

    // 6. Update application status to INTERVIEW
    await applicationsRepository.updateStatus(applicationId, 'INTERVIEW');

    // 7. Send notification to candidate
    if (application.candidate_user_id) {
      const formattedDate = new Date(scheduledAt).toUTCString();
      await notificationsService.createNotification({
        userId: application.candidate_user_id,
        type: 'INTERVIEW_SCHEDULED',
        message: `Your interview for "${application.job_title}" has been scheduled for ${formattedDate}.`,
        relatedEntityType: 'INTERVIEW',
        relatedEntityId: interview.id,
      });
    }

    return interview;
  }

  async getRecruiterInterviews(recruiterUserId, query = {}) {
    const { status, page = 1, limit = 20 } = query;
    return interviewsRepository.findByRecruiter(recruiterUserId, {
      status,
      page,
      limit,
    });
  }

  async getInterviewById(interviewId, user) {
    const interview = await interviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('Interview not found');
    }

    const userId = Number(user.userId || user.id);
    const userRole = user.role;

    if (userRole === 'RECRUITER') {
      const isOwner =
        Number(interview.created_by) === userId ||
        Number(interview.recruiter_id) === userId;
      if (!isOwner) {
        throw ApiError.forbidden('You do not have permission to view this interview');
      }
    } else if (userRole === 'CANDIDATE') {
      const isCandidate = Number(interview.candidate_user_id) === userId;
      if (!isCandidate) {
        throw ApiError.forbidden('You do not have permission to view this interview');
      }
    } else if (userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to view this interview');
    }

    return interview;
  }

  async updateInterview(interviewId, recruiterUserId, data) {
    const interview = await interviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('Interview not found');
    }

    const userId = Number(recruiterUserId);
    const isOwner =
      Number(interview.created_by) === userId ||
      Number(interview.recruiter_id) === userId;
    if (!isOwner) {
      throw ApiError.forbidden('You do not have permission to update this interview');
    }

    if (data.scheduledAt && new Date(data.scheduledAt) <= new Date()) {
      throw ApiError.badRequest('Interview cannot be scheduled in the past');
    }

    const updateData = {};
    if (data.scheduledAt !== undefined) updateData.scheduled_at = new Date(data.scheduledAt);
    if (data.meetingLink !== undefined) updateData.meeting_link = data.meetingLink;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await interviewsRepository.update(interviewId, updateData);

    // If status changed to CANCELLED, notify candidate
    if (data.status === 'CANCELLED' && interview.candidate_user_id) {
      await notificationsService.createNotification({
        userId: interview.candidate_user_id,
        type: 'INTERVIEW_CANCELLED',
        message: `Your interview for "${interview.job_title}" has been cancelled.`,
        relatedEntityType: 'INTERVIEW',
        relatedEntityId: interview.id,
      });
    }

    return updated;
  }

  async getCandidateInterviews(candidateUserId) {
    return interviewsRepository.findByCandidate(candidateUserId);
  }
}

module.exports = new InterviewsService();
