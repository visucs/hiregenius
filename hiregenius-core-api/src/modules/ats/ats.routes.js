const express = require('express');
const multer = require('multer');
const atsController = require('./ats.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');
const { atsRateLimiter } = require('../../middleware/rateLimiter');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

// Memory storage: never persists draft uploaded resumes to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

function optionalMemoryUploadMiddleware(req, res, next) {
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('File size exceeds the 5MB limit.'));
      }
      return next(err);
    }
    req.file = req.files?.file?.[0] || req.files?.resume?.[0] || null;
    return next();
  });
}

// POST /api/ats/scan - Run unified v2 ATS scan (profile or draft upload, General or Job mode)
router.post(
  '/scan',
  verifyJwt,
  requireRole('CANDIDATE', 'RECRUITER', 'ADMIN'),
  atsRateLimiter, // Per-minute burst protection
  optionalMemoryUploadMiddleware,
  (req, res, next) => atsController.scan(req, res, next),
);

// GET /api/ats/scans/mine - Get candidate's personal scan history
router.get(
  '/scans/mine',
  verifyJwt,
  requireRole('CANDIDATE'),
  (req, res, next) => atsController.listMyScans(req, res, next),
);

// GET /api/ats/scans/:id - Get specific scan detail
router.get(
  '/scans/:id',
  verifyJwt,
  (req, res, next) => atsController.getScanById(req, res, next),
);

module.exports = router;
