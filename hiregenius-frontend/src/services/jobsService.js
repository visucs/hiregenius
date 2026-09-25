import api from './api';

/**
 * Service for Core API Jobs endpoints (Phase 2).
 * All endpoints use real HTTP requests to Core API.
 * Authorization header is attached automatically by the api Axios client.
 */
export const jobsService = {
  /**
   * Fetch all jobs created by the authenticated recruiter (OPEN & CLOSED)
   * GET /api/jobs/mine
   * @param {object} [params] - { page, limit, title, company, location }
   */
  getMyJobs: async (params = {}) => {
    const res = await api.get('/jobs/mine', { params });
    // Returns { status: 200, message: '...', data: { jobs: [...], total, page, limit, totalPages } }
    return res.data;
  },

  /**
   * Fetch public open jobs
   * GET /api/jobs
   * @param {object} [params] - { page, limit, title, company, location }
   */
  getPublicJobs: async (params = {}) => {
    const res = await api.get('/jobs', { params });
    return res.data;
  },

  /**
   * Get full details for a specific job
   * GET /api/jobs/:id
   * @param {string|number} id
   */
  getJobById: async (id) => {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  /**
   * Create a new job posting (Recruiter only)
   * POST /api/jobs
   * @param {object} jobData - { title, company, skills, salary, experience, location, description, status }
   */
  createJob: async (jobData) => {
    const res = await api.post('/jobs', jobData);
    return res.data;
  },

  /**
   * Update an existing job (Recruiter owner only)
   * PUT /api/jobs/:id
   * @param {string|number} id
   * @param {object} updateData
   */
  updateJob: async (id, updateData) => {
    const res = await api.put(`/jobs/${id}`, updateData);
    return res.data;
  },

  /**
   * Toggle job status (OPEN / CLOSED)
   * PATCH /api/jobs/:id/status
   * @param {string|number} id
   * @param {'OPEN'|'CLOSED'} status
   */
  updateStatus: async (id, status) => {
    const res = await api.patch(`/jobs/${id}/status`, { status });
    return res.data;
  },

  /**
   * Soft-delete a job (Recruiter owner only)
   * DELETE /api/jobs/:id
   * @param {string|number} id
   */
  deleteJob: async (id) => {
    const res = await api.delete(`/jobs/${id}`);
    return res.data;
  },
};

export default jobsService;
