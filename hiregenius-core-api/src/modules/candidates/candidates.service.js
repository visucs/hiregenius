const path = require('path');
const jwt = require('jsonwebtoken');
const candidatesRepository = require('./candidates.repository');
const emailService = require('../email/email.service');
const {
  resumeUpdatedTemplate,
  welcomeProfileSetupTemplate,
} = require('../email/email.templates');
const db = require('../../config/db');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

class CandidatesService {
  /**
   * Generates a tamper-proof signed JWT token for job alerts unsubscription.
   *
   * @param {number|string} candidateId
   * @returns {string}
   */
  generateUnsubscribeToken(candidateId) {
    return jwt.sign(
      { candidateId: Number(candidateId), purpose: 'unsubscribe_job_alerts' },
      env.JWT_SIGNING_KEY,
      { expiresIn: '90d', algorithm: 'HS256' }
    );
  }

  /**
   * Verifies and decodes a signed job alerts unsubscribe token.
   *
   * @param {string} token
   * @returns {{ candidateId: number, purpose: string }}
   */
  verifyUnsubscribeToken(token) {
    if (!token || typeof token !== 'string') {
      throw ApiError.badRequest('Unsubscribe token is required');
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SIGNING_KEY, { algorithms: ['HS256'] });
      if (decoded.purpose !== 'unsubscribe_job_alerts' || !decoded.candidateId) {
        throw ApiError.badRequest('Invalid unsubscribe token');
      }
      return decoded;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.badRequest('Invalid or expired unsubscribe link');
    }
  }

  /**
   * Unsubscribes a candidate from job alerts using a signed token.
   *
   * @param {string} token
   * @returns {Promise<{ success: boolean, candidateId: number, job_alerts_opt_in: boolean, message: string }>}
   */
  async unsubscribeJobAlerts(token) {
    const decoded = this.verifyUnsubscribeToken(token);
    const candidate = await candidatesRepository.findById(decoded.candidateId);
    if (!candidate) {
      throw ApiError.notFound('Candidate record not found');
    }

    const updated = await candidatesRepository.updateJobAlertsOptIn(candidate.id, false);
    return {
      success: true,
      candidateId: candidate.id,
      job_alerts_opt_in: Boolean(updated.job_alerts_opt_in),
      message: 'You have been successfully unsubscribed from job alert emails.',
    };
  }

  /**
   * Upload or update resume reference for the authenticated candidate
   * Dispatches email confirmation asynchronously:
   * - Re-upload: Security notification (Your resume was updated)
   * - First-ever upload: Welcome/Profile setup confirmation
   */
  async uploadResume(userId, file) {
    if (!file) {
      throw ApiError.badRequest('Resume file is required');
    }

    // Store relative path with forward slashes for cross-platform consistency
    const projectRoot = path.resolve(__dirname, '../../../');
    const relativePath = path.relative(projectRoot, file.path).replace(/\\/g, '/');
    const resumePath = relativePath.startsWith('uploads') ? relativePath : file.path.replace(/\\/g, '/');

    const existingCandidate = await candidatesRepository.findByUserId(userId);

    let result;
    if (existingCandidate) {
      const updated = await candidatesRepository.updateResume(existingCandidate.id, {
        resume_path: resumePath,
        resume_original_name: file.originalname,
      });
      result = { candidate: updated, isNew: false };
    } else {
      const created = await candidatesRepository.create({
        user_id: Number(userId),
        resume_path: resumePath,
        resume_original_name: file.originalname,
      });
      result = { candidate: created, isNew: true };
    }

    // Non-blocking security/welcome notification email dispatch
    const dispatchPromise = (async () => {
      try {
        let user;
        try {
          user = await db('users').where('id', Number(userId)).first('name', 'email');
        } catch {
          // In test environments without seeded users table
        }

        if (!user || !user.email) return;

        if (existingCandidate) {
          // Re-upload: Security notification
          const tmpl = resumeUpdatedTemplate({
            candidateName: user.name,
            filename: file.originalname,
            updatedAt: new Date(),
          });
          await emailService.sendEmail({
            to: user.email,
            subject: tmpl.subject,
            html: tmpl.html,
            text: tmpl.text,
            type: 'RESUME_UPDATED',
          });
        } else {
          // First-ever upload: Welcome/Profile setup email
          const tmpl = welcomeProfileSetupTemplate({
            candidateName: user.name,
          });
          await emailService.sendEmail({
            to: user.email,
            subject: tmpl.subject,
            html: tmpl.html,
            text: tmpl.text,
            type: 'WELCOME_PROFILE_SETUP',
          });
        }
      } catch (err) {
        console.error(`[CandidatesService] Failed to dispatch resume notification email for user ${userId}:`, err.message);
      }
    })();

    // Attach for deterministic awaiting in test assertions
    result._dispatchPromise = dispatchPromise;
    return result;
  }

  /**
   * Get authenticated candidate's own profile and resume info
   * Returns 404 if no profile or resume uploaded yet
   */
  async getMyProfile(userId) {
    const candidate = await candidatesRepository.findByUserId(userId);
    if (!candidate || !candidate.resume_path) {
      throw ApiError.notFound('Candidate profile not found. Please upload your resume first.');
    }
    return candidate;
  }

  /**
   * Get candidate detail for a recruiter
   * Enforces ownership-adjacent check: recruiter can only view if candidate
   * has applied to one of THIS recruiter's jobs.
   */
  async getCandidateByIdForRecruiter(candidateId, recruiterId) {
    const candidate = await candidatesRepository.findById(candidateId);
    if (!candidate) {
      throw ApiError.notFound('Candidate not found');
    }

    const hasLink = await candidatesRepository.hasApplicationToRecruiter(candidateId, recruiterId);
    if (!hasLink) {
      throw ApiError.forbidden('Forbidden: You do not have permission to view this candidate profile');
    }

    const detailed = await candidatesRepository.findDetailWithUser(candidateId);
    return detailed || candidate;
  }

  /**
   * Get candidate notification preferences
   * @param {number|string} userId
   */
  async getPreferences(userId) {
    const candidate = await candidatesRepository.findByUserId(userId);
    if (!candidate) {
      return { job_alerts_opt_in: true };
    }
    return {
      job_alerts_opt_in: candidate.job_alerts_opt_in !== undefined ? Boolean(candidate.job_alerts_opt_in) : true,
    };
  }

  /**
   * Update candidate notification preferences
   * @param {number|string} userId
   * @param {{ job_alerts_opt_in: boolean }} param1
   */
  async updatePreferences(userId, { job_alerts_opt_in }) {
    if (typeof job_alerts_opt_in !== 'boolean') {
      throw ApiError.badRequest('job_alerts_opt_in must be a boolean');
    }
    let candidate = await candidatesRepository.findByUserId(userId);
    if (!candidate) {
      candidate = await candidatesRepository.create({
        user_id: Number(userId),
        resume_path: null,
        resume_original_name: null,
      });
    }
    const updated = await candidatesRepository.updateJobAlertsOptIn(candidate.id, job_alerts_opt_in);
    return {
      job_alerts_opt_in: Boolean(updated.job_alerts_opt_in),
    };
  }
}

module.exports = new CandidatesService();
