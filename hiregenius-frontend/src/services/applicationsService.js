import api from './api';

/**
 * Service for Core API Applications endpoints (Phase 3).
 * Interacts with /api/applications and /api/jobs/:jobId/applications.
 * Bearer JWT is attached automatically by the api Axios client.
 */
export const applicationsService = {
  /**
   * Submit application to an open job posting (Candidate only)
   * POST /api/applications
   * @param {number|string} jobId
   */
  applyToJob: async (jobId) => {
    const res = await api.post('/applications', { jobId: Number(jobId) });
    return res.data;
  },

  /**
   * Get authenticated candidate's own submitted applications
   * GET /api/applications/mine
   */
  getMyApplications: async () => {
    const res = await api.get('/applications/mine');
    return res.data;
  },

  /**
   * Get all applications for a specific job (Recruiter owner only)
   * GET /api/jobs/:jobId/applications
   * @param {number|string} jobId
   */
  getJobApplications: async (jobId) => {
    const res = await api.get(`/jobs/${jobId}/applications`);
    return res.data;
  },

  /**
   * Update application status (Recruiter owner only)
   * PATCH /api/applications/:id/status
   * @param {number|string} id - Application ID
   * @param {'APPLIED'|'SCREENING'|'INTERVIEW'|'SHORTLISTED'|'REJECTED'|'HIRED'} status
   */
  updateStatus: async (id, status) => {
    const res = await api.patch(`/applications/${id}/status`, { status });
    return res.data;
  },

  /**
   * Get single application by ID
   * GET /api/applications/:id
   * Supports candidate owner and recruiter job owner
   * @param {number|string} id
   */
  getApplicationById: async (id) => {
    const res = await api.get(`/applications/${id}`);
    return res.data;
  },
};

export default applicationsService;
