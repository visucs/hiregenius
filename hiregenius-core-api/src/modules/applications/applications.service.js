const applicationsRepository = require('./applications.repository');
const candidatesRepository = require('../candidates/candidates.repository');
const jobsRepository = require('../jobs/jobs.repository');
const ApiError = require('../../utils/ApiError');

class ApplicationsService {
  /**
   * Submit application to an open job posting
   * Candidate ID strictly derived from authenticated JWT user — never trusted from body
   */
  async applyToJob(userId, jobId) {
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

    // 5. Persist application with race condition handling
    try {
      return await applicationsRepository.create({
        job_id: Number(jobId),
        candidate_id: Number(candidate.id),
        status: 'APPLIED',
      });
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

    return applicationsRepository.updateStatus(applicationId, status);
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
