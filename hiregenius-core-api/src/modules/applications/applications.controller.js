const applicationsService = require('./applications.service');
const ApiResponse = require('../../utils/ApiResponse');

class ApplicationsController {
  async apply(req, res, next) {
    try {
      const application = await applicationsService.applyToJob(req.user.userId, req.body.jobId);
      return ApiResponse.created(res, application, 'Application submitted successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const applications = await applicationsService.getMyApplications(req.user.userId);
      return ApiResponse.success(res, applications, 'Candidate applications retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getJobApplications(req, res, next) {
    try {
      const applications = await applicationsService.getJobApplications(
        req.params.jobId,
        req.user.userId,
      );
      return ApiResponse.success(res, applications, 'Job applications retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const updated = await applicationsService.updateApplicationStatus(
        req.params.id,
        req.user.userId,
        req.body.status,
      );
      return ApiResponse.success(res, updated, 'Application status updated successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getApplicationById(req, res, next) {
    try {
      const application = await applicationsService.getApplicationById(req.params.id, req.user);
      return ApiResponse.success(res, application, 'Application details retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new ApplicationsController();
