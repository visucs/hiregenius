const analyticsService = require('./analytics.service');
const ApiResponse = require('../../utils/ApiResponse');

class AnalyticsController {
  async getRecruiterSummary(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const data = await analyticsService.getRecruiterSummary(recruiterId, req.query.days);
      return ApiResponse.success(res, data, 'Recruiter analytics summary retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getRecruiterJobsBreakdown(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const data = await analyticsService.getRecruiterJobsBreakdown(recruiterId);
      return ApiResponse.success(res, data, 'Recruiter jobs breakdown retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getRecruiterTrend(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const data = await analyticsService.getRecruiterTrend(recruiterId, req.query.days);
      return ApiResponse.success(res, data, 'Recruiter application trend retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getCandidateSummary(req, res, next) {
    try {
      const candidateUserId = req.user.userId || req.user.id;
      const data = await analyticsService.getCandidateSummary(candidateUserId);
      return ApiResponse.success(res, data, 'Candidate analytics summary retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getAdminSummary(req, res, next) {
    try {
      const data = await analyticsService.getAdminSummary();
      return ApiResponse.success(res, data, 'Platform-wide admin analytics summary retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getTopRecruiters(req, res, next) {
    try {
      const data = await analyticsService.getTopRecruiters(req.query);
      return ApiResponse.success(res, data, 'Top recruiters retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AnalyticsController();
