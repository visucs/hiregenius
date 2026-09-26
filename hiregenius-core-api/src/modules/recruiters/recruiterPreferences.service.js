const recruiterPreferencesRepository = require('./recruiterPreferences.repository');
const ApiError = require('../../utils/ApiError');

const DEFAULT_PREFERENCES = {
  notify_on_new_application: false,
  job_alert_dispatch_enabled: true,
};

class RecruiterPreferencesService {
  /**
   * Retrieves recruiter preferences, lazily initializing defaults if none exist.
   *
   * @param {number|string} recruiterUserId
   * @returns {Promise<object>}
   */
  async getPreferences(recruiterUserId) {
    if (!recruiterUserId) {
      throw ApiError.badRequest('Recruiter user ID is required');
    }

    let prefs = await recruiterPreferencesRepository.findByRecruiterId(recruiterUserId);
    if (!prefs) {
      prefs = await recruiterPreferencesRepository.createDefault(recruiterUserId);
    }
    return prefs;
  }

  /**
   * Updates one or more recruiter preferences.
   *
   * @param {number|string} recruiterUserId
   * @param {{ notify_on_new_application?: boolean, job_alert_dispatch_enabled?: boolean }} updates
   * @returns {Promise<object>}
   */
  async updatePreferences(recruiterUserId, updates = {}) {
    if (!recruiterUserId) {
      throw ApiError.badRequest('Recruiter user ID is required');
    }

    const allowedKeys = ['notify_on_new_application', 'job_alert_dispatch_enabled'];
    const sanitizedUpdates = {};

    for (const key of Object.keys(updates)) {
      if (!allowedKeys.includes(key)) {
        continue;
      }
      if (typeof updates[key] !== 'boolean') {
        throw ApiError.badRequest(`Field "${key}" must be a boolean (true or false)`);
      }
      sanitizedUpdates[key] = updates[key];
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw ApiError.badRequest('No valid preference fields provided to update');
    }

    // Ensure record exists before updating
    let prefs = await recruiterPreferencesRepository.findByRecruiterId(recruiterUserId);
    if (!prefs) {
      await recruiterPreferencesRepository.createDefault(recruiterUserId);
    }

    return recruiterPreferencesRepository.update(recruiterUserId, sanitizedUpdates);
  }

  /**
   * Centralized helper to check whether a given email type should be sent for a recruiter.
   * Never throws - defaults safely to system standard if database check fails.
   *
   * @param {number|string} recruiterUserId
   * @param {'notify_on_new_application'|'job_alert_dispatch_enabled'} preferenceKey
   * @returns {Promise<boolean>}
   */
  async shouldSendForRecruiter(recruiterUserId, preferenceKey) {
    try {
      if (!recruiterUserId) return DEFAULT_PREFERENCES[preferenceKey] ?? false;

      const prefs = await recruiterPreferencesRepository.findByRecruiterId(recruiterUserId);
      if (!prefs) {
        return DEFAULT_PREFERENCES[preferenceKey] ?? false;
      }
      return Boolean(prefs[preferenceKey]);
    } catch (err) {
      console.error(`[RecruiterPreferences] Error checking preference "${preferenceKey}" for recruiter ${recruiterUserId}:`, err.message);
      return DEFAULT_PREFERENCES[preferenceKey] ?? false;
    }
  }
}

const serviceInstance = new RecruiterPreferencesService();
module.exports = serviceInstance;
