const jobsService = require('./jobs.service');
const ApiResponse = require('../../utils/ApiResponse');

class JobsController {
  async createJob(req, res, next) {
    try {
      const job = await jobsService.createJob(req.user.userId, req.body);
      return ApiResponse.created(res, job, 'Job created successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getPublicJobs(req, res, next) {
    try {
      const result = await jobsService.getPublicJobs(req.query);
      return ApiResponse.success(res, result, 'Jobs retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getMyJobs(req, res, next) {
    try {
      const result = await jobsService.getMyJobs(req.user.userId, req.query);
      return ApiResponse.success(res, result, 'Recruiter jobs retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getJobById(req, res, next) {
    try {
      const job = await jobsService.getJobById(req.params.id);
      return ApiResponse.success(res, job, 'Job details retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async updateJob(req, res, next) {
    try {
      const updated = await jobsService.updateJob(req.params.id, req.user.userId, req.body);
      return ApiResponse.success(res, updated, 'Job updated successfully');
    } catch (err) {
      return next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const updated = await jobsService.updateJobStatus(
        req.params.id,
        req.user.userId,
        req.body.status,
      );
      return ApiResponse.success(res, updated, 'Job status updated successfully');
    } catch (err) {
      return next(err);
    }
  }

  async deleteJob(req, res, next) {
    try {
      await jobsService.deleteJob(req.params.id, req.user.userId);
      return ApiResponse.success(res, null, 'Job deleted successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new JobsController();
