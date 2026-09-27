const express = require('express');
const settingsController = require('./settings.controller');
const verifyJwt = require('../../../middleware/verifyJwt');
const requireRole = require('../../../middleware/requireRole');
const { updateSettingsSchema, validate } = require('./settings.validation');

const router = express.Router();

// GET /api/admin/settings
router.get(
  '/',
  verifyJwt,
  requireRole('ADMIN'),
  (req, res, next) => settingsController.getSettings(req, res, next),
);

// PATCH /api/admin/settings
router.patch(
  '/',
  verifyJwt,
  requireRole('ADMIN'),
  validate(updateSettingsSchema, 'body'),
  (req, res, next) => settingsController.updateSettings(req, res, next),
);

module.exports = router;
