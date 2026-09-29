const express = require('express');
const healthController = require('./health.controller');
const verifyJwt = require('../../../middleware/verifyJwt');
const requireRole = require('../../../middleware/requireRole');

const router = express.Router();

// GET /api/admin/health
router.get(
  '/',
  verifyJwt,
  requireRole('ADMIN'),
  (req, res, next) => healthController.getHealth(req, res, next),
);

module.exports = router;
