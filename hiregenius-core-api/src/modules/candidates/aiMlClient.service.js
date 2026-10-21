const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

class AiMlClientService {
  /**
   * Helper to handle and map HTTP error responses from hiregenius-ai-ml-service.
   * Surfaces friendly 4xx/422 details (e.g. ScannedDocumentError, EncryptedFileError)
   * while mapping 5xx and connection drops to 503 "Resume analysis service is temporarily unavailable".
   *
   * @private
   * @param {Response} response
   */
  async _handleAtsError(response) {
    if (response.status === 404) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.detail?.message || (typeof errData.detail === 'string' ? errData.detail : 'ATS evaluation not found');
      throw new ApiError(404, msg, errData.detail?.error_type ? { error_type: errData.detail.error_type } : null);
    }

    if (response.status >= 400 && response.status < 500) {
      const errData = await response.json().catch(() => ({}));
      const detail = errData.detail || {};
      const message = typeof detail === 'string' ? detail : (detail.message || 'ATS validation error');
      const details = typeof detail === 'object' && detail !== null ? {
        error_type: detail.error_type || null,
        parsability: detail.parsability || null,
      } : null;
      throw new ApiError(response.status, message, details);
    }

    // Server-side / 5xx error
    throw new ApiError(503, 'Resume analysis service is temporarily unavailable');
  }

  /**
   * Invokes hiregenius-ai-ml-service POST /api/resume/parse with candidate_id and file.
   *
   * @param {string|number} candidateId
   * @param {Buffer} fileBuffer
   * @param {string} originalFilename
   * @param {string} [mimetype]
   * @returns {Promise<object|null>} Parsed resume response object
   */
  async parseResume(candidateId, fileBuffer, originalFilename, mimetype = 'application/pdf') {
    if (!candidateId || !fileBuffer) {
      throw new Error('candidateId and fileBuffer are required for AI parsing');
    }

    const targetUrl = `${env.AI_ML_SERVICE_URL}/api/resume/parse`;
    const formData = new FormData();
    formData.append('candidate_id', String(candidateId));

    const fileBlob = new Blob([fileBuffer], { type: mimetype || 'application/pdf' });
    formData.append('file', fileBlob, originalFilename || 'resume.pdf');

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'X-Internal-Key': env.AI_ML_SERVICE_INTERNAL_KEY,
      },
      body: formData,
      signal: AbortSignal.timeout(15000), // 15 second timeout guard for LLM
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.detail || `AI service returned HTTP ${response.status}`;
      throw new Error(`AI parse request failed: ${errMsg}`);
    }

    return response.json();
  }

  /**
   * Retrieves parsed resume data for a candidate from hiregenius-ai-ml-service.
   *
   * @param {string|number} candidateId
   * @returns {Promise<object|null>} Parsed resume object or null if 404
   */
  async getParsedResume(candidateId) {
    if (!candidateId) return null;

    const targetUrl = `${env.AI_ML_SERVICE_URL}/api/resume/${encodeURIComponent(candidateId)}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-Internal-Key': env.AI_ML_SERVICE_INTERNAL_KEY,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.detail || `AI service returned HTTP ${response.status}`;
      throw new Error(`Failed to fetch parsed resume: ${errMsg}`);
    }

    return response.json();
  }

  /**
   * Invokes hiregenius-ai-ml-service POST /api/ats/check (General ATS mode).
   *
   * @param {string|number} candidateId
   * @param {Buffer} fileBuffer
   * @param {string} originalFilename
   * @param {string} [mimetype]
   * @returns {Promise<object>} ATS evaluation result
   */
  async checkGeneralAts(candidateId, fileBuffer, originalFilename, mimetype = 'application/pdf') {
    if (!candidateId || !fileBuffer) {
      throw ApiError.badRequest('candidate_id and file are required for ATS check');
    }

    const targetUrl = `${env.AI_ML_SERVICE_URL}/api/ats/check`;
    const formData = new FormData();
    formData.append('candidate_id', String(candidateId));

    const fileBlob = new Blob([fileBuffer], { type: mimetype || 'application/pdf' });
    formData.append('file', fileBlob, originalFilename || 'resume.pdf');

    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'X-Internal-Key': env.AI_ML_SERVICE_INTERNAL_KEY,
        },
        body: formData,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ApiError(503, 'Resume analysis service is temporarily unavailable');
    }

    if (!response.ok) {
      await this._handleAtsError(response);
    }

    return response.json();
  }

  /**
   * Invokes hiregenius-ai-ml-service POST /api/ats/check-for-job (Job-specific ATS mode).
   *
   * @param {string|number} candidateId
   * @param {string} jobDescription
   * @param {string|number} [jobId]
   * @param {Buffer} [fileBuffer]
   * @param {string} [originalFilename]
   * @param {string} [mimetype]
   * @returns {Promise<object>} ATS evaluation result
   */
  async checkJobAts(candidateId, jobDescription, jobId = null, fileBuffer = null, originalFilename = null, mimetype = 'application/pdf') {
    if (!candidateId) {
      throw ApiError.badRequest('candidate_id is required for job ATS check');
    }
    if (!jobDescription || jobDescription.length < 30) {
      throw ApiError.badRequest('job_description is too short (minimum 30 characters required)');
    }

    const targetUrl = `${env.AI_ML_SERVICE_URL}/api/ats/check-for-job`;
    const formData = new FormData();
    formData.append('candidate_id', String(candidateId));
    formData.append('job_description', String(jobDescription));

    if (jobId !== null && jobId !== undefined) {
      formData.append('job_id', String(jobId));
    }

    if (fileBuffer) {
      const fileBlob = new Blob([fileBuffer], { type: mimetype || 'application/pdf' });
      formData.append('file', fileBlob, originalFilename || 'resume.pdf');
    }

    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'X-Internal-Key': env.AI_ML_SERVICE_INTERNAL_KEY,
        },
        body: formData,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ApiError(503, 'Resume analysis service is temporarily unavailable');
    }

    if (!response.ok) {
      await this._handleAtsError(response);
    }

    return response.json();
  }

  /**
   * Retrieves stored ATS result for a candidate from hiregenius-ai-ml-service GET /api/ats/{candidate_id}.
   *
   * @param {string|number} candidateId
   * @param {string|number} [jobId]
   * @returns {Promise<object>} ATS evaluation result
   */
  async getCandidateAts(candidateId, jobId = null) {
    if (!candidateId) {
      throw ApiError.badRequest('candidate_id is required');
    }

    const query = jobId ? `?job_id=${encodeURIComponent(String(jobId))}` : '';
    const targetUrl = `${env.AI_ML_SERVICE_URL}/api/ats/${encodeURIComponent(String(candidateId))}${query}`;

    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'X-Internal-Key': env.AI_ML_SERVICE_INTERNAL_KEY,
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ApiError(503, 'Resume analysis service is temporarily unavailable');
    }

    if (!response.ok) {
      await this._handleAtsError(response);
    }

    return response.json();
  }
}

module.exports = new AiMlClientService();
