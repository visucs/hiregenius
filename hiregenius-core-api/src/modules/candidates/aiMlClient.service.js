const env = require('../../config/env');

class AiMlClientService {
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
}

module.exports = new AiMlClientService();
