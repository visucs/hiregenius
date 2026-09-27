const fs = require('fs');
const path = require('path');
const db = require('../../../config/db');
const env = require('../../../config/env');
const ApiResponse = require('../../../utils/ApiResponse');

class AdminHealthController {
  async getHealth(req, res, _next) {
    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      components: {
        database: { status: 'UNKNOWN' },
        authService: { status: 'UNKNOWN' },
        emailService: { status: 'UNKNOWN' },
        fileStorage: { status: 'UNKNOWN' },
        aiResumeScreening: { status: 'NOT_AVAILABLE', note: 'Phase 6 pending' },
        aiInterviewService: { status: 'NOT_AVAILABLE', note: 'Phase 6 pending' },
      },
    };

    // 1. Database check
    try {
      const dbStart = Date.now();
      await db.raw('SELECT 1');
      health.components.database = {
        status: 'UP',
        latencyMs: Date.now() - dbStart,
      };
    } catch (err) {
      health.components.database = {
        status: 'DOWN',
        error: err.message,
      };
      health.status = 'DEGRADED';
    }

    // 2. Auth Service check
    try {
      const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8080';
      const authStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const resp = await fetch(`${authUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      health.components.authService = {
        status: resp.ok ? 'UP' : 'DOWN',
        latencyMs: Date.now() - authStart,
      };
      if (!resp.ok) health.status = 'DEGRADED';
    } catch (err) {
      health.components.authService = {
        status: 'DOWN',
        error: err.message,
      };
      health.status = 'DEGRADED';
    }

    // 3. Email Service check
    const isSmtpConfigured = Boolean(
      process.env.SMTP_HOST || process.env.MAIL_HOST || env.SMTP_HOST
    );
    health.components.emailService = {
      status: isSmtpConfigured ? 'UP' : 'NOT_CONFIGURED',
      provider: isSmtpConfigured ? (process.env.SMTP_HOST || process.env.MAIL_HOST || 'configured') : 'none',
    };

    // 4. File Storage check
    try {
      const uploadsDir = path.resolve(__dirname, '../../../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.accessSync(uploadsDir, fs.constants.W_OK);
      health.components.fileStorage = {
        status: 'UP',
        storageType: 'LOCAL_DISK',
      };
    } catch (err) {
      health.components.fileStorage = {
        status: 'DEGRADED',
        error: err.message,
      };
    }

    return ApiResponse.success(res, health, 'System health report retrieved');
  }
}

module.exports = new AdminHealthController();
