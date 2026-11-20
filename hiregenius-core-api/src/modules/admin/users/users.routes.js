const express = require('express');
const adminUsersController = require('./users.controller');
const verifyJwt = require('../../../middleware/verifyJwt');
const requireRole = require('../../../middleware/requireRole');

const router = express.Router();

const getAuthServiceBase = () => {
  return (process.env.AUTH_SERVICE_URL || 'https://hiregenius-auth-service.onrender.com').replace(/\/+$/, '');
};

/**
 * GET /api/admin/users
 * Proxy to Spring Boot Auth Service if client requests user list via Core API
 */
router.get('/', verifyJwt, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const authServiceBase = getAuthServiceBase();
    const queryPart = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = `${authServiceBase}/api/admin/users${queryPart}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Proxy to Spring Boot Auth Service to update user active status
 */
router.patch('/:id/status', verifyJwt, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const authServiceBase = getAuthServiceBase();
    const targetUrl = `${authServiceBase}/api/admin/users/${req.params.id}/status`;
    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id/approve
 * Proxy to Spring Boot Auth Service to approve recruiter account
 */
router.patch('/:id/approve', verifyJwt, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const authServiceBase = getAuthServiceBase();
    const targetUrl = `${authServiceBase}/api/admin/users/${req.params.id}/approve`;
    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id/privileges
 * Proxy to Spring Boot Auth Service to update granular permissions
 */
router.patch('/:id/privileges', verifyJwt, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const authServiceBase = getAuthServiceBase();
    const targetUrl = `${authServiceBase}/api/admin/users/${req.params.id}/privileges`;
    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id/verify-email
 * Proxy to Spring Boot Auth Service to manually verify user email
 */
router.patch('/:id/verify-email', verifyJwt, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const authServiceBase = getAuthServiceBase();
    const targetUrl = `${authServiceBase}/api/admin/users/${req.params.id}/verify-email`;
    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users/:id
 * Admin drill-down view returning user profile + activity aggregations
 */
router.get('/:id', verifyJwt, requireRole('ADMIN'), adminUsersController.getUserDetail);
router.delete('/:id', verifyJwt, requireRole('ADMIN'), adminUsersController.deleteUser);

module.exports = router;
