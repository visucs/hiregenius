const express = require('express');
const adminUsersController = require('./users.controller');
const verifyJwt = require('../../../middleware/verifyJwt');
const requireRole = require('../../../middleware/requireRole');

const router = express.Router();

/**
 * GET /api/admin/users/:id
 * Admin drill-down view returning user profile + activity aggregations
 */
router.get('/:id', verifyJwt, requireRole('ADMIN'), adminUsersController.getUserDetail);
router.delete('/:id', verifyJwt, requireRole('ADMIN'), adminUsersController.deleteUser);

module.exports = router;
