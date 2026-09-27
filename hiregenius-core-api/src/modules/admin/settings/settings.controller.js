const settingsService = require('./settings.service');
const ApiResponse = require('../../../utils/ApiResponse');

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const settings = await settingsService.getSettings();
      return ApiResponse.success(res, settings, 'Platform settings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const updatedBy = req.user?.userId || req.user?.id || null;
      const settings = await settingsService.updateSettings(req.body, updatedBy);
      return ApiResponse.success(res, settings, 'Platform settings updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingsController();
