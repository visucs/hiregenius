const express = require('express');
const rankingsController = require('./rankings.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const { rankingRateLimiter } = require('../../middleware/rateLimiter');
const {
  jobIdParamSchema,
  historyQuerySchema,
  validate,
} = require('./rankings.validation');

const router = express.Router({ mergeParams: true });

/**
 * Recruiter Ranking Endpoints
 * All routes require authenticated user with RECRUITER role and job ownership.
 * Candidates are strictly blocked (403 Forbidden).
 */

// POST /api/jobs/:jobId/ranking - Create a new ranking snapshot (rate limited)
router.post(
  '/:jobId/ranking',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(jobIdParamSchema, 'params'),
  rankingRateLimiter,
  (req, res, next) => rankingsController.rank(req, res, next)
);

// GET /api/jobs/:jobId/ranking - Get latest ranking snapshot with staleness indicator
router.get(
  '/:jobId/ranking',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(jobIdParamSchema, 'params'),
  (req, res, next) => rankingsController.getLatest(req, res, next)
);

// GET /api/jobs/:jobId/ranking/history - Get ranking history snapshots
router.get(
  '/:jobId/ranking/history',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(jobIdParamSchema, 'params'),
  validate(historyQuerySchema, 'query'),
  (req, res, next) => rankingsController.getHistory(req, res, next)
);

module.exports = router;
