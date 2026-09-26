import api from './api';

/**
 * Service for Core API Interviews endpoints (Phase 4).
 * Interacts with /api/interviews and /api/candidates/me/interviews.
 * Bearer JWT is attached automatically by the api Axios client.
 */
export const interviewsService = {
  /**
   * Schedule an interview for an application (Recruiter only)
   * POST /api/interviews
   * @param {{ applicationId: number|string, scheduledAt: string, meetingLink?: string }} data
   */
  scheduleInterview: async ({ applicationId, scheduledAt, meetingLink }) => {
    const res = await api.post('/interviews', {
      applicationId: Number(applicationId),
      scheduledAt,
      meetingLink: meetingLink || null,
    });
    return res.data;
  },

  /**
   * Get scheduled interviews for logged-in recruiter
   * GET /api/interviews/mine
   * @param {{ status?: string, page?: number, limit?: number }} params
   */
  getMyInterviews: async (params = {}) => {
    const res = await api.get('/interviews/mine', { params });
    return res.data;
  },

  /**
   * Get interviews scheduled for authenticated candidate
   * GET /api/candidates/me/interviews
   */
  getCandidateInterviews: async () => {
    const res = await api.get('/candidates/me/interviews');
    return res.data;
  },

  /**
   * Get single interview details by ID (Dual-ownership)
   * GET /api/interviews/:id
   * @param {number|string} id
   */
  getInterviewById: async (id) => {
    const res = await api.get(`/interviews/${id}`);
    return res.data;
  },

  /**
   * Update interview schedule, link, or status (Recruiter only)
   * PATCH /api/interviews/:id
   * @param {number|string} id
   * @param {{ scheduledAt?: string, meetingLink?: string, status?: 'SCHEDULED'|'COMPLETED'|'CANCELLED' }} data
   */
  updateInterview: async (id, data) => {
    const res = await api.patch(`/interviews/${id}`, data);
    return res.data;
  },
};

export default interviewsService;
