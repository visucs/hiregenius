const settingsRepository = require('./settings.repository');

class SettingsService {
  async getSettings() {
    return settingsRepository.getSettings();
  }

  async updateSettings(updates, updatedBy = null) {
    return settingsRepository.updateSettings(updates, updatedBy);
  }
}

module.exports = new SettingsService();
