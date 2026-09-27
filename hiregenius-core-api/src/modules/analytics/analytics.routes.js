const express = require('express');
const analyticsController = require('./analytics.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const {
  recruiterSummaryQuerySchema,
  recruiterTrendQuerySchema,
  topRecruitersQuerySchema,
  validate,
} = require('./analytics.validation');

const router = express.Router();

/**
 * PART 1: Recruiter-Scoped Analytics (own data only)
 */

// GET /api/analytics/recruiter/summary - Recruiter summary metrics
router.get(
  '/recruiter/summary',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(recruiterSummaryQuerySchema, 'query'),
  (req, res, next) => analyticsController.getRecruiterSummary(req, res, next),
);

// GET /api/analytics/recruiter/jobs-breakdown - Per-job metrics for recruiter's jobs
router.get(
  '/recruiter/jobs-breakdown',
  verifyJwt,
  requireRole('RECRUITER'),
  (req, res, next) => analyticsController.getRecruiterJobsBreakdown(req, res, next),
);

// GET /api/analytics/recruiter/trend - Daily application trend with zero-filled gaps
router.get(
  '/recruiter/trend',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(recruiterTrendQuerySchema, 'query'),
  (req, res, next) => analyticsController.getRecruiterTrend(req, res, next),
);

/**
 * PART 2: Candidate-Scoped Analytics (own data only)
 */

// GET /api/analytics/candidate/summary - Candidate application and interview summary
router.get(
  '/candidate/summary',
  verifyJwt,
  requireRole('CANDIDATE'),
  (req, res, next) => analyticsController.getCandidateSummary(req, res, next),
);

/**
 * PART 3: Admin Platform-Wide Analytics
 */

// GET /api/analytics/admin/summary - Platform-wide summary
router.get(
  '/admin/summary',
  verifyJwt,
  requireRole('ADMIN'),
  (req, res, next) => analyticsController.getAdminSummary(req, res, next),
);

// GET /api/analytics/admin/top-recruiters - Top recruiters ranked by applications/jobs
router.get(
  '/admin/top-recruiters',
  verifyJwt,
  requireRole('ADMIN'),
  validate(topRecruitersQuerySchema, 'query'),
  (req, res, next) => analyticsController.getTopRecruiters(req, res, next),
);

module.exports = router;
