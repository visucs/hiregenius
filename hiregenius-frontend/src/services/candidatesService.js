import api from './api';

/**
 * Service for Core API Candidates endpoints (Phase 3).
 * Interacts with /api/candidates.
 * Bearer JWT is attached automatically by the api Axios client.
 */
export const candidatesService = {
  /**
   * Upload or update resume reference for the authenticated candidate
   * POST /api/candidates/me/resume
   * @param {FormData} formData - Must contain field 'resume' with PDF or DOCX file (max 5MB)
   */
  uploadResume: async (formData) => {
    const res = await api.post('/candidates/me/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Get authenticated candidate's own profile and resume info
   * GET /api/candidates/me
   * Note: Returns 404 if no resume has been uploaded yet.
   */
  getMyProfile: async () => {
    const res = await api.get('/candidates/me');
    return res.data;
  },

  /**
   * Get candidate detail for a recruiter (Recruiter only)
   * GET /api/candidates/:id
   * Enforces ownership-adjacent check: returns 403 if candidate has not applied to caller's jobs.
   * @param {string|number} id - Candidate ID
   */
  getCandidateById: async (id) => {
    const res = await api.get(`/candidates/${id}`);
    return res.data;
  },
};

export default candidatesService;
