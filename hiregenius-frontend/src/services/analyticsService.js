import api from './api';

/**
 * Service for Core API Analytics endpoints (Phase 5).
 * All endpoints use real HTTP requests to Core API (/api/analytics/...).
 * Authorization header is attached automatically by the api Axios client.
 */
export const analyticsService = {
  /**
   * Recruiter summary analytics
   * GET /api/analytics/recruiter/summary
   * @param {number|string} [days] - optional window filter (e.g. 7, 30, 90)
   * @returns {Promise<{ success: boolean, data: { totalJobs: number, openJobs: number, closedJobs: number, totalApplications: number, totalInterviewsScheduled: number, applicationsByStatus: Record<string, number>, recent: object, allTime: object, days?: number } }>}
   */
  getRecruiterSummary: async (days) => {
    const params = days !== undefined && days !== null && days !== '' ? { days: Number(days) } : {};
    const res = await api.get('/analytics/recruiter/summary', { params });
    return res.data;
  },

  /**
   * Recruiter per-job breakdown
   * GET /api/analytics/recruiter/jobs-breakdown
   * @returns {Promise<{ success: boolean, data: Array<{ jobId: number, title: string, status: string, applicationCount: number, interviewCount: number }> }>}
   */
  getRecruiterJobsBreakdown: async () => {
    const res = await api.get('/analytics/recruiter/jobs-breakdown');
    return res.data;
  },

  /**
   * Recruiter daily application trend over specified window with zero-filled gaps
   * GET /api/analytics/recruiter/trend
   * @param {number|string} [days=30]
   * @returns {Promise<{ success: boolean, data: Array<{ date: string, count: number }> }>}
   */
  getRecruiterTrend: async (days) => {
    const params = days !== undefined && days !== null && days !== '' ? { days: Number(days) } : {};
    const res = await api.get('/analytics/recruiter/trend', { params });
    return res.data;
  },

  /**
   * Candidate summary analytics
   * GET /api/analytics/candidate/summary
   * @returns {Promise<{ success: boolean, data: { totalApplications: number, applicationsByStatus: Record<string, number>, totalInterviewsScheduled: number, totalInterviewsCompleted: number } }>}
   */
  getCandidateSummary: async () => {
    const res = await api.get('/analytics/candidate/summary');
    return res.data;
  },

  /**
   * Admin platform-wide summary
   * GET /api/analytics/admin/summary
   * @returns {Promise<{ success: boolean, data: { totalUsers: { total: number, recruiters: number, candidates: number, admins: number }, usersByRole: object, totalRecruiters: number, totalCandidates: number, totalJobs: number, totalApplications: number, totalInterviews: number, applicationsByStatus: Record<string, number> } }>}
   */
  getAdminSummary: async () => {
    const res = await api.get('/analytics/admin/summary');
    return res.data;
  },

  /**
   * Admin top recruiters leaderboard
   * GET /api/analytics/admin/top-recruiters
   * @param {object} [options] - { limit?: number, sortBy?: 'applications'|'jobs' }
   * @returns {Promise<{ success: boolean, data: Array<{ recruiterId: number, name: string|null, email: string|null, jobsCount: number, totalJobs: number, applicationsCount: number, totalApplications: number }> }>}
   */
  getAdminTopRecruiters: async (options = {}) => {
    const res = await api.get('/analytics/admin/top-recruiters', { params: options });
    return res.data;
  },

  /**
   * Admin monthly hiring trend (applications vs hires)
   * GET /api/analytics/admin/trend
   * @param {object} [options] - { months?: number }
   * @returns {Promise<{ success: boolean, data: Array<{ month: string, applications: number, hires: number }> }>}
   */
  getAdminTrend: async (options = {}) => {
    const res = await api.get('/analytics/admin/trend', { params: options });
    return res.data;
  },

  /**
   * Admin top in-demand skills aggregated across active jobs
   * GET /api/analytics/admin/top-skills
   * @param {object} [options] - { limit?: number }
   * @returns {Promise<{ success: boolean, data: Array<{ skill: string, count: number, percentage: number }> }>}
   */
  getAdminTopSkills: async (options = {}) => {
    const res = await api.get('/analytics/admin/top-skills', { params: options });
    return res.data;
  },
};

export default analyticsService;
