const express = require('express');
const applicationsController = require('./applications.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const {
  createApplicationSchema,
  updateStatusSchema,
  applicationIdParamSchema,
  jobIdParamSchema,
  validate,
} = require('./applications.validation');

const router = express.Router();
const jobsApplicationsRouter = express.Router();

/**
 * Candidate Protected Routes (mounted at /api/applications)
 */

// POST /api/applications - Apply to a job (Candidate only)
router.post(
  '/',
  verifyJwt,
  requireRole('CANDIDATE'),
  validate(createApplicationSchema, 'body'),
  (req, res, next) => applicationsController.apply(req, res, next),
);

// GET /api/applications/mine - Candidate views their own applications list
router.get(
  '/mine',
  verifyJwt,
  requireRole('CANDIDATE'),
  (req, res, next) => applicationsController.getMyApplications(req, res, next),
);

/**
 * Recruiter & Candidate Shared / Param Routes (mounted at /api/applications)
 */

// PATCH /api/applications/:id/status - Recruiter updates application status
router.patch(
  '/:id/status',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(applicationIdParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  (req, res, next) => applicationsController.updateStatus(req, res, next),
);

// GET /api/applications/:id - View application details (Candidate own OR Recruiter owning job)
router.get(
  '/:id',
  verifyJwt,
  requireRole('CANDIDATE', 'RECRUITER'),
  validate(applicationIdParamSchema, 'params'),
  (req, res, next) => applicationsController.getApplicationById(req, res, next),
);

/**
 * Job-scoped Applications Routes (mounted at /api/jobs)
 * GET /api/jobs/:jobId/applications - Recruiter views all applicants for their job
 */
jobsApplicationsRouter.get(
  '/:jobId/applications',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(jobIdParamSchema, 'params'),
  (req, res, next) => applicationsController.getJobApplications(req, res, next),
);

// Attach jobsApplicationsRouter to main router for flexible mounting
router.jobsApplicationsRouter = jobsApplicationsRouter;

module.exports = router;
module.exports.jobsApplicationsRouter = jobsApplicationsRouter;
module.exports.router = router;
