const express = require('express');
const verifyJwt = require('../../../middleware/verifyJwt');
const requireRole = require('../../../middleware/requireRole');
const stepUpController = require('./stepUp.controller');

const router = express.Router();

// Enforce authenticated administrator for step-up verification
router.post('/', verifyJwt, requireRole('ADMIN'), stepUpController.createStepUpToken);

module.exports = router;
