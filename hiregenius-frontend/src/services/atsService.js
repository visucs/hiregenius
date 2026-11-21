import api from './api';

/**
 * Service for Core API ATS v2 endpoints.
 * Handles unified scanning, rolling quota, and personal scan history.
 */
export const atsService = {
  /**
   * Run ATS scan (Profile or Upload source, General or Job mode)
   * POST /api/ats/scan
   *
   * @param {FormData} formData
   * @returns {Promise<object>}
   */
  scan: async (formData) => {
    const res = await api.post('/ats/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Get candidate's personal ATS scan history
   * GET /api/ats/scans/mine
   *
   * @param {object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<object>}
   */
  getMyScans: async ({ page = 1, limit = 20 } = {}) => {
    const res = await api.get('/ats/scans/mine', {
      params: { page, limit },
    });
    return res.data;
  },

  /**
   * Get specific ATS scan detail by ID
   * GET /api/ats/scans/:id
   *
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  getScanById: async (id) => {
    const res = await api.get(`/ats/scans/${id}`);
    return res.data;
  },
};

export default atsService;
