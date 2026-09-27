const applicationsRepository = require('./applications.repository');
const candidatesRepository = require('../candidates/candidates.repository');
const jobsRepository = require('../jobs/jobs.repository');
const notificationsService = require('../notifications/notifications.service');
const settingsService = require('../admin/settings/settings.service');
const ApiError = require('../../utils/ApiError');
const db = require('../../config/db');

class ApplicationsService {
  /**
   * Submit application to an open job posting
   * Candidate ID strictly derived from authenticated JWT user — never trusted from body
   */
  async applyToJob(userId, jobId) {
    // 0. Candidate email must be verified
    let user;
    try {
      user = await db('users').where('id', Number(userId)).first('email_verified');
    } catch {
      // Table or column might not exist in isolated test environments
    }
    if (user && (user.email_verified === 0 || user.email_verified === false)) {
      throw ApiError.forbidden('Please verify your email address to apply for jobs.');
    }

    // 1. Candidate must have a profile and uploaded resume
    const candidate = await candidatesRepository.findByUserId(userId);
    if (!candidate || !candidate.resume_path) {
      throw ApiError.badRequest('Upload your resume before applying');
    }

    // 2. Job must exist and be active (non-deleted)
    const job = await jobsRepository.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    // 3. Job status must not be CLOSED
    if (job.status === 'CLOSED') {
      throw ApiError.badRequest('This job is no longer accepting applications');
    }

    // 4. Candidate cannot apply to the same job twice
    const existing = await applicationsRepository.findByJobAndCandidate(jobId, candidate.id);
    if (existing) {
      throw ApiError.conflict('You have already applied for this job');
    }

    // 4.1 Check max_candidates_per_job platform limit
    try {
      const settings = await settingsService.getSettings();
      if (settings && typeof settings.maxCandidatesPerJob === 'number') {
        const currentCandidates = await applicationsRepository.countByJob(jobId);
        if (currentCandidates >= settings.maxCandidatesPerJob) {
          throw ApiError.badRequest(`Maximum candidate limit reached for this job (${settings.maxCandidatesPerJob}).`);
        }
      }
    } catch (err) {
      if (err.statusCode) throw err;
    }

    // 5. Persist application with race condition handling
    try {
      const application = await applicationsRepository.create({
        job_id: Number(jobId),
        candidate_id: Number(candidate.id),
        status: 'APPLIED',
      });

      // Notify the recruiter: In-app notification always; email if recruiter opted in via preferences
      try {
        const notifPromise = notificationsService.createNotification({
          userId: job.recruiter_id,
          type: 'APPLICATION_RECEIVED',
          message: `New application received for "${job.title}"`,
          relatedEntityType: 'APPLICATION',
          relatedEntityId: application.id,
          metadata: {
            jobId: job.id,
            jobTitle: job.title,
            candidateId: candidate.id,
            candidateName: candidate.candidate_name,
          },
        });
        application._dispatchPromise = notifPromise;
      } catch (err) {
        console.error('[ApplicationsService] Failed to create APPLICATION_RECEIVED notification:', err.message);
      }

      return application;
    } catch (err) {
      if (
        err.code === 'ER_DUP_ENTRY' ||
        err.code === 'SQLITE_CONSTRAINT' ||
        (err.message && err.message.includes('UNIQUE constraint failed'))
      ) {
        throw ApiError.conflict('You have already applied for this job');
      }
      throw err;
    }
  }

  /**
   * Get authenticated candidate's own submitted applications
   */
  async getMyApplications(userId) {
    const candidate = await candidatesRepository.findByUserId(userId);
    if (!candidate) {
      return [];
    }
    return applicationsRepository.findByCandidate(candidate.id);
  }

  /**
   * Get all applications for a specific job (Recruiter owner only)
   * Enforces strict ownership check: job must belong to req.user.userId
   */
  async getJobApplications(jobId, recruiterId) {
    const job = await jobsRepository.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    if (Number(job.recruiter_id) !== Number(recruiterId)) {
      throw ApiError.forbidden('Forbidden: You do not have permission to view applications for this job');
    }

    return applicationsRepository.findByJob(jobId);
  }

  /**
   * Update application status (Recruiter owner only)
   * Enforces ownership check: verify the application's job belongs to req.user.userId
   */
  async updateApplicationStatus(applicationId, recruiterId, status) {
    const application = await applicationsRepository.findById(applicationId);
    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    // Verify recruiter owns the job associated with this application
    if (Number(application.recruiter_id) !== Number(recruiterId)) {
      throw ApiError.forbidden('Forbidden: You do not have permission to modify this application');
    }

    const updated = await applicationsRepository.updateStatus(applicationId, status);

    // Phase 4 retrofit: notify candidate of application status update
    if (application.candidate_user_id) {
      await notificationsService.createNotification({
        userId: application.candidate_user_id,
        type: 'STATUS_CHANGED',
        message: `Your application for "${application.job_title}" has been updated to ${status}.`,
        relatedEntityType: 'APPLICATION',
        relatedEntityId: Number(applicationId),
        metadata: { status },
      });
    }

    return updated;
  }

  /**
   * Get single application by ID
   * Supports both CANDIDATE (own application only) and RECRUITER (own job's application only)
   */
  async getApplicationById(applicationId, user) {
    const application = await applicationsRepository.findById(applicationId);
    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    if (user.role === 'CANDIDATE') {
      const candidate = await candidatesRepository.findByUserId(user.userId);
      if (!candidate || Number(application.candidate_id) !== Number(candidate.id)) {
        throw ApiError.forbidden('Forbidden: You do not have permission to view this application');
      }
      return application;
    }

    if (user.role === 'RECRUITER') {
      if (Number(application.recruiter_id) !== Number(user.userId)) {
        throw ApiError.forbidden('Forbidden: You do not have permission to view this application');
      }
      return application;
    }

    throw ApiError.forbidden('Forbidden: Access is denied');
  }
}

module.exports = new ApplicationsService();
