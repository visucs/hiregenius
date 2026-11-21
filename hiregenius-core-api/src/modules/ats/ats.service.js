const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const atsRepository = require('./ats.repository');
const candidatesRepository = require('../candidates/candidates.repository');
const jobsRepository = require('../jobs/jobs.repository');
const aiMlClient = require('../candidates/aiMlClient.service');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_PREVIEW_LENGTH = 1500;

class AtsService {
  /**
   * Validate magic bytes for PDF and DOCX files.
   *
   * @param {Buffer} buffer
   * @param {string} originalFilename
   */
  validateFileSignature(buffer, originalFilename) {
    if (!buffer || buffer.length < 4) {
      throw ApiError.badRequest('Invalid file: file is empty or corrupted.');
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw ApiError.badRequest('File size exceeds the 5MB limit.');
    }

    const ext = path.extname(originalFilename || '').toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      throw ApiError.badRequest('Invalid file format. Only PDF (.pdf) and Word (.docx) files are supported.');
    }

    // PDF signature: %PDF (0x25, 0x50, 0x44, 0x46)
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    // ZIP signature (DOCX): PK.. (0x50, 0x4B)
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);

    if (ext === '.pdf' && !isPdf) {
      throw ApiError.badRequest('Invalid file content: file extension is .pdf but binary content does not match PDF format.');
    }

    if (ext === '.docx' && !isZip) {
      throw ApiError.badRequest('Invalid file content: file extension is .docx but binary content does not match DOCX format.');
    }

    if (!isPdf && !isZip) {
      throw ApiError.badRequest('Unsupported file content: file binary signature does not match PDF or DOCX format.');
    }
  }

  /**
   * Sanitize job description: strip control characters, validate length (30 - 10,000 chars).
   *
   * @param {string} text
   * @returns {string}
   */
  sanitizeJobDescription(text) {
    if (!text || typeof text !== 'string') {
      throw ApiError.badRequest('Job description is required.');
    }
    // Strip control characters except newline (\n), carriage return (\r), tab (\t)
    const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    if (cleaned.length < 30) {
      throw ApiError.badRequest('Job description is too short (minimum 30 characters required).');
    }
    if (cleaned.length > 10000) {
      throw ApiError.badRequest('Job description exceeds maximum length of 10,000 characters.');
    }
    return cleaned;
  }

  /**
   * Main scan method orchestrating quota check, file loading, AI invocation, and MySQL persistence.
   *
   * @param {object} params
   * @param {object} params.user - { userId, role } from JWT
   * @param {string} [params.mode='GENERAL'] - 'GENERAL' or 'JOB'
   * @param {number|string} [params.jobId]
   * @param {string} [params.jobTitle]
   * @param {string} [params.jobDescription]
   * @param {Express.Multer.File} [params.file]
   * @param {number|string} [params.targetCandidateUserId] - For recruiter evaluation
   * @returns {Promise<object>}
   */
  async scan({
    user,
    mode = 'GENERAL',
    jobId = null,
    jobTitle = null,
    jobDescription = null,
    file = null,
    targetCandidateUserId = null,
  }) {
    const isRecruiter = user.role === 'RECRUITER' || user.role === 'ADMIN';
    const limit = isRecruiter ? env.ATS_DAILY_LIMIT_RECRUITER : env.ATS_DAILY_LIMIT_CANDIDATE;
    const modeUpper = (mode || 'GENERAL').toUpperCase();

    if (modeUpper !== 'GENERAL' && modeUpper !== 'JOB') {
      throw ApiError.badRequest("mode must be either 'GENERAL' or 'JOB'.");
    }

    // Determine target candidate user ID
    let candidateUserId = user.userId;
    if (isRecruiter) {
      if (!targetCandidateUserId) {
        throw ApiError.badRequest('targetCandidateUserId is required for recruiter-triggered ATS scans.');
      }
      candidateUserId = targetCandidateUserId;
    }

    // Resolve candidate profile record
    let candidateRecord = await candidatesRepository.findByUserId(candidateUserId);
    if (!candidateRecord && !isRecruiter) {
      candidateRecord = await candidatesRepository.create({
        user_id: Number(candidateUserId),
        resume_path: null,
        resume_original_name: null,
      });
    }

    // Resolve source and file buffer
    let source = 'PROFILE';
    let fileBuffer = null;
    let originalFilename = 'resume.pdf';
    let mimetype = 'application/pdf';

    if (file) {
      source = 'UPLOAD';
      this.validateFileSignature(file.buffer, file.originalname);
      fileBuffer = file.buffer;
      originalFilename = file.originalname;
      const ext = path.extname(originalFilename).toLowerCase();
      mimetype = ext === '.docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';
    } else {
      source = 'PROFILE';
      if (!candidateRecord || !candidateRecord.resume_path) {
        throw ApiError.badRequest('Upload your resume first');
      }

      const projectRoot = path.resolve(__dirname, '../../../');
      const fullPath = path.resolve(projectRoot, candidateRecord.resume_path);

      try {
        await fs.promises.access(fullPath, fs.constants.R_OK);
        fileBuffer = await fs.promises.readFile(fullPath);
      } catch {
        throw new ApiError(409, 'Resume file not found, please re-upload');
      }

      originalFilename = candidateRecord.resume_original_name || path.basename(candidateRecord.resume_path);
      const ext = path.extname(originalFilename).toLowerCase();
      mimetype = ext === '.docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';
    }

    // Resolve Job Description if mode is JOB
    let resolvedJobTitle = jobTitle;
    let resolvedJdText = null;

    if (modeUpper === 'JOB') {
      if (jobId) {
        const job = await jobsRepository.findById(jobId);
        if (!job) {
          throw ApiError.notFound(`Job with ID ${jobId} not found.`);
        }
        if (job.status === 'CLOSED') {
          throw ApiError.badRequest('This job posting is closed.');
        }

        resolvedJobTitle = resolvedJobTitle || job.title;
        const skillsText = Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || '');
        const parts = [
          job.title ? `Job Title: ${job.title}` : '',
          job.experience ? `Experience Required: ${job.experience}` : '',
          skillsText ? `Required Skills: ${skillsText}` : '',
          job.description ? `Job Description:\n${job.description}` : '',
        ].filter(Boolean);

        resolvedJdText = this.sanitizeJobDescription(parts.join('\n\n'));
      } else if (jobDescription) {
        resolvedJdText = this.sanitizeJobDescription(jobDescription);
      } else {
        throw ApiError.badRequest('Either jobId or jobDescription is required for JOB mode.');
      }
    }

    // ── ATOMIC RATE LIMIT CHECK & CALL AI SERVICE ──────────────────────────────
    // 1. Check rolling 24h quota atomically in a transaction with table row count lock
    const currentCount = await atsRepository.countScansIn24h(user.userId);
    if (currentCount >= limit) {
      const resetAt = await atsRepository.getOldestScanIn24h(user.userId);
      throw new ApiError(429, 'Daily ATS scan quota reached. Please try again later.', {
        remaining: 0,
        resetAt: resetAt ? resetAt.toISOString() : null,
        limit,
      });
    }

    // 2. Invoke AI/ML service (if this throws, nothing is persisted and NO quota is consumed!)
    const aiResponse = await aiMlClient.scanAts({
      mode: modeUpper,
      jobTitle: resolvedJobTitle,
      jobDescription: resolvedJdText,
      candidateId: candidateRecord?.id || candidateUserId,
      fileBuffer,
      originalFilename,
      mimetype,
    });

    // 3. Privacy & Sanitization: Truncate extractedTextPreview and ensure no raw full resume text
    const sanitizedAiResponse = { ...aiResponse };
    if (sanitizedAiResponse.extractedTextPreview) {
      sanitizedAiResponse.extractedTextPreview = sanitizedAiResponse.extractedTextPreview.slice(0, MAX_PREVIEW_LENGTH);
    }
    delete sanitizedAiResponse.raw_text;

    // 4. Save to MySQL ats_scans in transaction
    const savedScan = await db.transaction(async (trx) => {
      // Re-verify limit inside transaction to prevent parallel race conditions
      const trxCount = await atsRepository.countScansIn24h(user.userId, trx);
      if (trxCount >= limit) {
        const resetAt = await atsRepository.getOldestScanIn24h(user.userId, trx);
        throw new ApiError(429, 'Daily ATS scan quota reached. Please try again later.', {
          remaining: 0,
          resetAt: resetAt ? resetAt.toISOString() : null,
          limit,
        });
      }

      return atsRepository.createScan(
        {
          candidate_user_id: candidateUserId,
          triggered_by_user_id: user.userId,
          triggered_by_role: user.role,
          job_id: jobId || null,
          mode: modeUpper,
          source,
          overall_score: sanitizedAiResponse.overallScore || 0,
          scoring_version: sanitizedAiResponse.scoringVersion || 'ats-v2-untuned',
          result_json: sanitizedAiResponse,
        },
        trx
      );
    });

    const new24hCount = await atsRepository.countScansIn24h(user.userId);
    const remaining = Math.max(0, limit - new24hCount);
    const resetAt = await atsRepository.getOldestScanIn24h(user.userId);

    return {
      scanId: savedScan.id,
      overallScore: savedScan.overall_score,
      grade: sanitizedAiResponse.grade,
      mode: savedScan.mode,
      source: savedScan.source,
      scoringVersion: savedScan.scoring_version,
      remaining,
      limit,
      resetAt: resetAt ? resetAt.toISOString() : null,
      result: sanitizedAiResponse,
      createdAt: savedScan.created_at,
    };
  }

  /**
   * Get candidate scan history (only candidate-triggered scans).
   *
   * @param {number|string} candidateUserId
   * @param {object} pagination
   */
  async getCandidateHistory(candidateUserId, pagination) {
    return atsRepository.listCandidateHistory(candidateUserId, pagination);
  }

  /**
   * Get single scan detail by ID with ownership enforcement.
   *
   * @param {number|string} scanId
   * @param {object} user - JWT user { userId, role }
   */
  async getScanDetail(scanId, user) {
    const scan = await atsRepository.findById(scanId);
    if (!scan) {
      throw ApiError.notFound('ATS scan not found.');
    }

    const isCandidateOwner = String(scan.candidate_user_id) === String(user.userId) && user.role === 'CANDIDATE';
    const isTriggerer = String(scan.triggered_by_user_id) === String(user.userId);
    const isAdmin = user.role === 'ADMIN';

    if (!isCandidateOwner && !isTriggerer && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to view this ATS scan.');
    }

    return scan;
  }

  /**
   * Get latest candidate ATS scan (for GET /api/candidates/me/ats).
   *
   * @param {number|string} candidateUserId
   * @param {number|string|null} [jobId]
   */
  async getLatestScanForCandidate(candidateUserId, jobId = null) {
    return atsRepository.getLatestForCandidate(candidateUserId, jobId, true);
  }
}

module.exports = new AtsService();
