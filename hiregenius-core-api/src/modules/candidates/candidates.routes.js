const express = require('express');
const candidatesController = require('./candidates.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const {
  candidateIdParamSchema,
  resumeUploadMiddleware,
  validate,
} = require('./candidates.validation');

const router = express.Router();

/**
 * Candidate Protected Routes
 * Note: Specific static routes (/me/resume, /me) must be registered before param route (/:id)
 */

// POST /api/candidates/me/resume - Upload/update candidate's own resume
router.post(
  '/me/resume',
  verifyJwt,
  requireRole('CANDIDATE'),
  resumeUploadMiddleware,
  (req, res, next) => candidatesController.uploadResume(req, res, next),
);

// GET /api/candidates/me - Get candidate's own profile and resume info
router.get(
  '/me',
  verifyJwt,
  requireRole('CANDIDATE'),
  (req, res, next) => candidatesController.getMyProfile(req, res, next),
);

/**
 * Recruiter Protected Routes
 */

// GET /api/candidates/:id - Get candidate detail (Recruiter must own a job applied to by this candidate)
router.get(
  '/:id',
  verifyJwt,
  requireRole('RECRUITER'),
  validate(candidateIdParamSchema, 'params'),
  (req, res, next) => candidatesController.getCandidateById(req, res, next),
);

module.exports = router;
