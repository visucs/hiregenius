import api from './api';

/**
 * Service for Core API Candidate Ranking (RAG) endpoints (Phase 8).
 * Interacts with /api/jobs/:jobId/ranking.
 * Bearer JWT is attached automatically by the api Axios client.
 */
export const rankingsService = {
  /**
   * Get latest ranking snapshot for a job with freshness/staleness indicator
   * GET /api/jobs/:jobId/ranking
   * @param {number|string} jobId
   */
  getJobRanking: async (jobId) => {
    const res = await api.get(`/jobs/${jobId}/ranking`);
    return res.data;
  },

  /**
   * Trigger a new candidate ranking snapshot for a job
   * POST /api/jobs/:jobId/ranking
   * @param {number|string} jobId
   */
  createJobRanking: async (jobId) => {
    const res = await api.post(`/jobs/${jobId}/ranking`);
    return res.data;
  },

  /**
   * Get paginated ranking snapshot history for a job
   * GET /api/jobs/:jobId/ranking/history
   * @param {number|string} jobId
   * @param {object} [params] - { page, limit }
   */
  getJobRankingHistory: async (jobId, params = {}) => {
    const res = await api.get(`/jobs/${jobId}/ranking/history`, { params });
    return res.data;
  },
};

export default rankingsService;
