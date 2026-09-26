const express = require('express');
const recruiterPreferencesController = require('./recruiterPreferences.controller');
const verifyJwt = require('../../middleware/verifyJwt');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();

router.use(verifyJwt);
router.use(requireRole('RECRUITER'));

router.get(['/notification-preferences', '/me/notification-preferences'], (req, res, next) => recruiterPreferencesController.getPreferences(req, res, next));
router.patch(['/notification-preferences', '/me/notification-preferences'], (req, res, next) => recruiterPreferencesController.updatePreferences(req, res, next));

module.exports = router;
