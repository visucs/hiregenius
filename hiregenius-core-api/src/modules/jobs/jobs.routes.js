const express = require('express');
const jobsController = require('./jobs.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const {
  validate,
  createJobSchema,
  updateJobSchema,
  updateStatusSchema,
  jobIdParamSchema,
  listJobsQuerySchema,
} = require('./jobs.validation');

const router = express.Router();

/**
 * Public routes
 */
// GET /api/jobs - List open jobs with pagination & filters
router.get('/', validate(listJobsQuerySchema, 'query'), (req, res, next) =>
  jobsController.getPublicJobs(req, res, next),
);

/**
 * Recruiter protected routes
 * Note: /mine must be declared BEFORE /:id
 */
// GET /api/jobs/mine - List recruiter's own jobs
router.get(
  '/mine',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(listJobsQuerySchema, 'query'),
  (req, res, next) => jobsController.getMyJobs(req, res, next),
);

// GET /api/jobs/:id - Public job details (404 if missing or deleted)
router.get('/:id', validate(jobIdParamSchema, 'params'), (req, res, next) =>
  jobsController.getJobById(req, res, next),
);

// POST /api/jobs - Create a job posting (Recruiter only)
router.post(
  '/',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(createJobSchema, 'body'),
  (req, res, next) => jobsController.createJob(req, res, next),
);

// PUT /api/jobs/:id - Update job posting (Recruiter owner only)
router.put(
  '/:id',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(jobIdParamSchema, 'params'),
  validate(updateJobSchema, 'body'),
  (req, res, next) => jobsController.updateJob(req, res, next),
);

// PATCH /api/jobs/:id/status - Update job status OPEN/CLOSED (Recruiter owner only)
router.patch(
  '/:id/status',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(jobIdParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  (req, res, next) => jobsController.updateStatus(req, res, next),
);

// DELETE /api/jobs/:id - Soft-delete job (Recruiter owner only)
router.delete(
  '/:id',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(jobIdParamSchema, 'params'),
  (req, res, next) => jobsController.deleteJob(req, res, next),
);

module.exports = router;
