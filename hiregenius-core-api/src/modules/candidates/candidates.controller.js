const candidatesService = require('./candidates.service');
const ApiResponse = require('../../utils/ApiResponse');
const env = require('../../config/env');

class CandidatesController {
  async uploadResume(req, res, next) {
    try {
      const { candidate, isNew, _dispatchPromise } = await candidatesService.uploadResume(req.user.userId, req.file);
      res.locals._dispatchPromise = _dispatchPromise;
      if (isNew) {
        return ApiResponse.created(res, candidate, 'Resume uploaded successfully');
      }
      return ApiResponse.success(res, candidate, 'Resume updated successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const candidate = await candidatesService.getMyProfile(req.user.userId);
      return ApiResponse.success(res, candidate, 'Candidate profile retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getCandidateById(req, res, next) {
    try {
      const candidate = await candidatesService.getCandidateByIdForRecruiter(
        req.params.id,
        req.user.userId,
      );
      return ApiResponse.success(res, candidate, 'Candidate details retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async unsubscribeJobAlerts(req, res, next) {
    try {
      const token = req.query.token || req.body?.token;
      const result = await candidatesService.unsubscribeJobAlerts(token);

      if (req.accepts('html')) {
        return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed from Job Alerts - HireGenius AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: white; max-width: 480px; width: 100%; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; color: #10b981; }
    h1 { font-size: 22px; color: #111827; margin: 0 0 12px 0; }
    p { color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px 0; }
    a { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Unsubscribed Successfully</h1>
    <p>You have been unsubscribed from new job alert emails. You will no longer receive notifications when new roles are posted.</p>
    <a href="${env.FRONTEND_BASE_URL || 'https://hiregenius-delta.vercel.app'}">Return to HireGenius AI</a>
  </div>
</body>
</html>`);
      }

      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      return next(err);
    }
  }

  async getPreferences(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await candidatesService.getPreferences(userId);
      return ApiResponse.success(res, data, 'Candidate notification preferences retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await candidatesService.updatePreferences(userId, req.body);
      return ApiResponse.success(res, data, 'Candidate notification preferences updated successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getParsedResume(req, res, next) {
    try {
      const parsed = await candidatesService.getParsedResume(req.user.userId);
      return ApiResponse.success(res, parsed, 'Parsed resume data retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getParsedResumeForRecruiter(req, res, next) {
    try {
      const parsed = await candidatesService.getParsedResumeForRecruiter(
        req.params.id,
        req.user.userId,
      );
      return ApiResponse.success(res, parsed, 'Candidate parsed resume retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new CandidatesController();

