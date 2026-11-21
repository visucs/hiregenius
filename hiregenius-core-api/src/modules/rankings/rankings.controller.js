const rankingsService = require('./rankings.service');
const ApiResponse = require('../../utils/ApiResponse');

class RankingsController {
  /**
   * POST /api/jobs/:jobId/ranking
   * Generates a new candidate ranking snapshot for a job.
   */
  async rank(req, res, next) {
    try {
      const result = await rankingsService.rankJobApplicants(
        Number(req.params.jobId),
        req.user.userId
      );
      return ApiResponse.created(res, result, 'Candidate ranking snapshot created successfully');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/jobs/:jobId/ranking
   * Retrieves the latest ranking snapshot for a job with stale indicator.
   */
  async getLatest(req, res, next) {
    try {
      const result = await rankingsService.getJobRanking(
        Number(req.params.jobId),
        req.user.userId
      );
      return ApiResponse.success(res, result, 'Latest ranking snapshot retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/jobs/:jobId/ranking/history
   * Retrieves paginated ranking snapshot history for a job.
   */
  async getHistory(req, res, next) {
    try {
      const result = await rankingsService.getJobRankingHistory(
        Number(req.params.jobId),
        req.user.userId,
        req.query
      );
      return ApiResponse.success(res, result, 'Ranking history retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new RankingsController();
