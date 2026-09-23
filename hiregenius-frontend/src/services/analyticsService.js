/**
 * analyticsService.js — Analytics API client
 * Architecture.md: React → Spring Boot only. All requests go through
 * the Spring Boot orchestrator with JWT auth.
 *
 * Endpoints (Spring Boot):
 *   GET /api/analytics/summary?range=7d|30d|90d
 *   GET /api/analytics/hiring-trend?range=...
 *   GET /api/analytics/score-distribution?range=...
 *   GET /api/analytics/interview-outcomes?range=...
 *   GET /api/analytics/skill-distribution?range=...
 *   GET /api/analytics/candidates-per-job?range=...
 *   GET /api/analytics/recent-activity?range=...&page=0&size=10&search=
 *
 * All endpoints are scoped to the authenticated user's organization via JWT.
 * Admins receive platform-wide aggregates; recruiters see only their own data.
 */

import api from './api';


/** @param {string} range - "7d" | "30d" | "90d" */
export const fetchSummary            = (range) => api.get('/analytics/summary',            { params: { range } });
export const fetchHiringTrend        = (range) => api.get('/analytics/hiring-trend',        { params: { range } });
export const fetchScoreDistribution  = (range) => api.get('/analytics/score-distribution',  { params: { range } });
export const fetchInterviewOutcomes  = (range) => api.get('/analytics/interview-outcomes',  { params: { range } });
export const fetchSkillDistribution  = (range) => api.get('/analytics/skill-distribution',  { params: { range } });
export const fetchCandidatesPerJob   = (range) => api.get('/analytics/candidates-per-job',  { params: { range } });
export const fetchRecentActivity     = (range, page = 0, size = 10, search = '') =>
  api.get('/analytics/recent-activity', { params: { range, page, size, search } });
