const recruiterPreferencesService = require('./recruiterPreferences.service');
const ApiResponse = require('../../utils/ApiResponse');

class RecruiterPreferencesController {
  async getPreferences(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const prefs = await recruiterPreferencesService.getPreferences(recruiterId);
      return ApiResponse.success(res, prefs, 'Recruiter notification preferences retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const updated = await recruiterPreferencesService.updatePreferences(recruiterId, req.body);
      return ApiResponse.success(res, updated, 'Recruiter notification preferences updated successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new RecruiterPreferencesController();
