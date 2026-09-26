const express = require('express');
const interviewsController = require('./interviews.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const {
  createInterviewSchema,
  updateInterviewSchema,
  interviewIdParamSchema,
  listInterviewsQuerySchema,
  validate,
} = require('./interviews.validation');

const router = express.Router();
const candidatesInterviewsRouter = express.Router();

/**
 * Candidate Interviews Route (mounted at /api/candidates)
 */
candidatesInterviewsRouter.get(
  '/me/interviews',
  verifyJwt,
  requireRole('CANDIDATE'),
  (req, res, next) => interviewsController.getCandidateInterviews(req, res, next),
);

/**
 * Recruiter & Authenticated Interviews Routes (mounted at /api/interviews)
 */

// POST /api/interviews - Schedule an interview (Recruiter only)
router.post(
  '/',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(createInterviewSchema, 'body'),
  (req, res, next) => interviewsController.schedule(req, res, next),
);

// GET /api/interviews & /api/interviews/mine - List scheduled interviews for recruiter
router.get(
  '/',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(listInterviewsQuerySchema, 'query'),
  (req, res, next) => interviewsController.getRecruiterInterviews(req, res, next),
);

router.get(
  '/mine',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(listInterviewsQuerySchema, 'query'),
  (req, res, next) => interviewsController.getRecruiterInterviews(req, res, next),
);

// GET /api/interviews/:id - View interview details (Recruiter or Candidate)
router.get(
  '/:id',
  verifyJwt,
  requireRole('RECRUITER', 'CANDIDATE', 'ADMIN'),
  validate(interviewIdParamSchema, 'params'),
  (req, res, next) => interviewsController.getInterviewById(req, res, next),
);

// PATCH /api/interviews/:id - Update interview (Recruiter only)
router.patch(
  '/:id',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(interviewIdParamSchema, 'params'),
  validate(updateInterviewSchema, 'body'),
  (req, res, next) => interviewsController.updateInterview(req, res, next),
);

router.candidatesInterviewsRouter = candidatesInterviewsRouter;

module.exports = router;
