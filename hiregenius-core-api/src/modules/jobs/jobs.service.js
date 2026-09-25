const jobsRepository = require('./jobs.repository');
const ApiError = require('../../utils/ApiError');

class JobsService {
  /**
   * Create a new job.
   * Recruiter ID comes strictly from authenticated user — never from request body.
   */
  async createJob(recruiterId, jobData) {
    // Strip recruiter_id if passed in request body
    const safeData = { ...jobData };
    delete safeData.recruiter_id;

    const newJob = await jobsRepository.create({
      ...safeData,
      recruiter_id: Number(recruiterId),
    });

    return newJob;
  }

  /**
   * Get public jobs list.
   * Returns only OPEN and non-deleted jobs with pagination & filters.
   */
  async getPublicJobs(query) {
    return jobsRepository.findPublicJobs(query);
  }

  /**
   * Get jobs created by the authenticated recruiter.
   * Returns all statuses (OPEN, CLOSED) for this recruiter.
   */
  async getMyJobs(recruiterId, query) {
    return jobsRepository.findByRecruiter(Number(recruiterId), query);
  }

  /**
   * Get job by ID.
   * Returns 404 if missing or soft-deleted.
   */
  async getJobById(id) {
    const job = await jobsRepository.findById(id);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }
    return job;
  }

  /**
   * Update job details.
   * Enforces strict ownership check.
   */
  async updateJob(id, recruiterId, updateData) {
    const existingJob = await jobsRepository.findById(id);
    if (!existingJob) {
      throw ApiError.notFound('Job not found');
    }

    if (Number(existingJob.recruiter_id) !== Number(recruiterId)) {
      throw ApiError.forbidden('Forbidden: You do not have permission to modify this job');
    }

    // Strip recruiter_id so ownership cannot be transferred
    const safeUpdate = { ...updateData };
    delete safeUpdate.recruiter_id;

    return jobsRepository.update(id, safeUpdate);
  }

  /**
   * Update job status (toggle OPEN/CLOSED).
   * Enforces strict ownership check.
   */
  async updateJobStatus(id, recruiterId, status) {
    const existingJob = await jobsRepository.findById(id);
    if (!existingJob) {
      throw ApiError.notFound('Job not found');
    }

    if (Number(existingJob.recruiter_id) !== Number(recruiterId)) {
      throw ApiError.forbidden('Forbidden: You do not have permission to modify this job');
    }

    return jobsRepository.updateStatus(id, status);
  }

  /**
   * Soft-delete a job.
   * Enforces strict ownership check.
   */
  async deleteJob(id, recruiterId) {
    const existingJob = await jobsRepository.findById(id);
    if (!existingJob) {
      throw ApiError.notFound('Job not found');
    }

    if (Number(existingJob.recruiter_id) !== Number(recruiterId)) {
      throw ApiError.forbidden('Forbidden: You do not have permission to delete this job');
    }

    return jobsRepository.softDelete(id);
  }
}

module.exports = new JobsService();
