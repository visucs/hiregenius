import api from './api';

const aiInterviewsService = {
  // ==========================================
  // Candidate Methods
  // ==========================================

  /**
   * List all AI interviews assigned to the current candidate
   */
  async getCandidateAiInterviews() {
    const res = await api.get('/candidates/me/ai-interviews');
    return res.data;
  },

  /**
   * Load Candidate AI Assessment room details (sanitized questions without expected_points)
   */
  async getRoom(interviewId) {
    const res = await api.get(`/ai-interviews/${interviewId}/room`);
    return res.data;
  },

  /**
   * Start interview session (requires consent acknowledgment)
   */
  async startInterview(interviewId, consentAcknowledged = true) {
    const res = await api.post(`/ai-interviews/${interviewId}/start`, { consentAcknowledged });
    return res.data;
  },

  /**
   * Autosave candidate's answer for a question (max 2000 chars)
   */
  async autosaveAnswer(interviewId, questionId, answerText) {
    const res = await api.post(`/ai-interviews/${interviewId}/questions/${questionId}/answer`, {
      answerText,
    });
    return res.data;
  },

  /**
   * Final candidate submission
   */
  async submitInterview(interviewId) {
    const res = await api.post(`/ai-interviews/${interviewId}/submit`);
    return res.data;
  },

  // ==========================================
  // Recruiter Methods
  // ==========================================

  /**
   * Generate interview questions for a candidate's application
   */
  async generateInterview(payload) {
    const res = await api.post('/ai-interviews/generate', payload);
    return res.data;
  },

  /**
   * Get full interview details, draft questions, or evaluation report for recruiter
   */
  async getInterviewDetail(interviewId) {
    const res = await api.get(`/ai-interviews/${interviewId}`);
    return res.data;
  },

  /**
   * Update / edit draft questions
   */
  async updateQuestions(interviewId, { questions, orderedQuestionIds }) {
    const res = await api.put(`/ai-interviews/${interviewId}/questions`, {
      questions,
      orderedQuestionIds,
    });
    return res.data;
  },

  /**
   * Publish interview (opens test window and sends invitation notification)
   */
  async publishInterview(interviewId, { windowStart, windowEnd, durationMinutes } = {}) {
    const res = await api.post(`/ai-interviews/${interviewId}/publish`, {
      windowStart,
      windowEnd,
      durationMinutes,
    });
    return res.data;
  },

  /**
   * Cancel an interview
   */
  async cancelInterview(interviewId) {
    const res = await api.post(`/ai-interviews/${interviewId}/cancel`);
    return res.data;
  },

  /**
   * Toggle release of feedback/scores to candidate
   */
  async releaseFeedback(interviewId, released = true) {
    const res = await api.post(`/ai-interviews/${interviewId}/release-feedback`, { released });
    return res.data;
  },

  /**
   * Retry failed AI evaluation
   */
  async retryEvaluation(interviewId) {
    const res = await api.post(`/ai-interviews/${interviewId}/evaluation/retry`);
    return res.data;
  },

  /**
   * Reset assessment to allow candidate to retake
   */
  async resetInterview(interviewId) {
    const res = await api.post(`/ai-interviews/${interviewId}/reset`);
    return res.data;
  },

  /**
   * List all AI interviews for a specific job
   */
  async getJobAiInterviews(jobId) {
    const res = await api.get(`/jobs/${jobId}/ai-interviews`);
    return res.data;
  },
};

export default aiInterviewsService;
