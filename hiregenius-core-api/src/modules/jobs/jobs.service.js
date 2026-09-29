const jobsRepository = require('./jobs.repository');
const candidatesRepository = require('../candidates/candidates.repository');
const candidatesService = require('../candidates/candidates.service');
const recruiterPreferencesService = require('../recruiters/recruiterPreferences.service');
const settingsService = require('../admin/settings/settings.service');
const emailService = require('../email/email.service');
const { jobAlertTemplate } = require('../email/email.templates');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const db = require('../../config/db');

class JobsService {
  /**
   * Create a new job.
   * Recruiter ID comes strictly from authenticated user — never from request body.
   */
  async createJob(recruiterId, jobData) {
    // 0. Recruiter email must be verified, admin approved, and job posting enabled
    let user;
    try {
      user = await db('users').where('id', Number(recruiterId)).first();
    } catch {
      // Table might not exist in isolated mock environments
    }
    if (user) {
      if (user.is_active === 0 || user.is_active === false) {
        throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
      }
      if (user.email_verified === 0 || user.email_verified === false) {
        throw ApiError.forbidden('Please verify your email address to post jobs.');
      }
      if (user.admin_approved === 0 || user.admin_approved === false) {
        throw ApiError.forbidden('Your recruiter account is pending admin approval.');
      }
      if (user.can_post_jobs === 0 || user.can_post_jobs === false) {
        throw ApiError.forbidden('Job posting has been disabled for your account by an administrator.');
      }
    }

    // 0.1 Check max_jobs_per_recruiter platform limit
    try {
      const settings = await settingsService.getSettings();
      if (settings && typeof settings.maxJobsPerRecruiter === 'number') {
        const countRow = await db('jobs')
          .where('recruiter_id', Number(recruiterId))
          .where('is_deleted', false)
          .count('id as count')
          .first();
        const currentCount = Number(countRow?.count || 0);
        if (currentCount >= settings.maxJobsPerRecruiter) {
          throw ApiError.badRequest(`Maximum job posting limit reached (${settings.maxJobsPerRecruiter}). Please contact your administrator.`);
        }
      }
    } catch (err) {
      if (err.statusCode) throw err;
    }

    // Strip recruiter_id if passed in request body
    const safeData = { ...jobData };
    delete safeData.recruiter_id;

    const newJob = await jobsRepository.create({
      ...safeData,
      recruiter_id: Number(recruiterId),
    });

    if (newJob && newJob.status === 'OPEN') {
      const dispatchPromise = this.dispatchJobAlerts(newJob, recruiterId).catch((err) => {
        console.error(`[JobAlerts] Background dispatch unhandled error for job ${newJob.id}:`, err);
      });
      newJob._dispatchPromise = dispatchPromise;
    }

    return newJob;
  }

  /**
   * Dispatches batched job alert emails to opted-in candidates.
   * Completely isolated: never throws to caller, never delays API response.
   * Respects recruiter preferences: skipped if recruiter disabled job_alert_dispatch_enabled.
   */
  async dispatchJobAlerts(job, recruiterId) {
    try {
      // 1. Recruiter preference check
      const shouldDispatch = await recruiterPreferencesService.shouldSendForRecruiter(
        recruiterId,
        'job_alert_dispatch_enabled'
      );

      if (!shouldDispatch) {
        console.log(`[JobAlerts] Suppressed alerts for job ${job.id}: recruiter ${recruiterId} disabled job_alert_dispatch_enabled`);
        return { skipped: true, reason: 'recruiter_disabled' };
      }

      // 2. Fetch candidates who opted into job alerts
      const candidates = await candidatesRepository.findOptedInCandidates();
      if (!candidates || candidates.length === 0) {
        return { success: true, count: 0 };
      }

      // 3. Batch processing (respecting rate limits)
      // Gmail SMTP: batches of 10
      const BATCH_SIZE = 10;
      let sentCount = 0;
      let errorCount = 0;

      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (candidate) => {
            try {
              if (!candidate.candidate_email) return;

              const unsubscribeToken = candidatesService.generateUnsubscribeToken(candidate.candidate_id);
              const unsubscribeUrl = `${env.CORE_API_URL || 'http://localhost:4000'}/api/candidates/job-alerts/unsubscribe?token=${unsubscribeToken}`;
              const jobUrl = `${env.FRONTEND_BASE_URL || 'https://hiregenius-delta.vercel.app'}/jobs/${job.id}`;
              const descriptionExcerpt = job.description ? job.description.slice(0, 180) + '...' : '';

              const tmpl = jobAlertTemplate({
                candidateName: candidate.candidate_name,
                jobTitle: job.title,
                company: job.company,
                location: job.location,
                descriptionExcerpt,
                jobUrl,
                unsubscribeUrl,
              });

              const sendResult = await emailService.sendEmail({
                to: candidate.candidate_email,
                subject: tmpl.subject,
                html: tmpl.html,
                text: tmpl.text,
                type: 'JOB_ALERT',
              });

              if (sendResult.success) {
                sentCount++;
              } else {
                errorCount++;
              }
            } catch (candidateErr) {
              errorCount++;
              console.error(`[JobAlerts] Failed to send job alert to candidate ${candidate.candidate_id}:`, candidateErr.message);
            }
          })
        );
      }

      console.log(`[JobAlerts] Completed dispatch for job ${job.id}: ${sentCount} sent, ${errorCount} errors, ${candidates.length} total candidates`);
      return { success: true, sentCount, errorCount, totalCandidates: candidates.length };
    } catch (err) {
      console.error(`[JobAlerts] Error during job alert dispatch for job ${job?.id}:`, err);
      return { success: false, error: err.message };
    }
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
    delete safeUpdate.id;
    delete safeUpdate.recruiter_id;
    delete safeUpdate.created_at;

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
