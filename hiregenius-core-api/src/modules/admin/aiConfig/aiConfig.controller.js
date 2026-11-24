const { aiConfigClient } = require('./aiConfigClient.service');
const ApiError = require('../../../utils/ApiError');

class AIConfigController {
  async getConfiguration(req, res, next) {
    try {
      const data = await aiConfigClient.getConfiguration(req.user.userId);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async saveCredential(req, res, next) {
    try {
      const { provider } = req.params;
      const { api_key } = req.body;
      if (!api_key || typeof api_key !== 'string' || api_key.trim().length === 0) {
        throw ApiError.badRequest('api_key is required and must be a non-empty string.');
      }
      const data = await aiConfigClient.saveCredential(provider, api_key.trim(), req.user.userId);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async deleteCredential(req, res, next) {
    try {
      const { provider } = req.params;
      const expectedPhrase = `DELETE_CREDENTIAL_${provider.toUpperCase()}`;
      if (!req.body?.confirmation_phrase || req.body.confirmation_phrase.trim() !== expectedPhrase) {
        throw ApiError.badRequest(`Deleting provider credential requires exact typed confirmation phrase '${expectedPhrase}'.`);
      }
      const data = await aiConfigClient.deleteCredential(provider, req.user.userId);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async recheckCredential(req, res, next) {
    try {
      const { provider } = req.params;
      const data = await aiConfigClient.recheckCredential(provider, req.user.userId);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async createDraft(req, res, next) {
    try {
      const { tasks, note } = req.body;
      if (!tasks || typeof tasks !== 'object') {
        throw ApiError.badRequest("tasks dictionary mapping is required: e.g. {'RESUME_PARSER': {'provider': 'gemini', 'model': '...'}}");
      }
      const data = await aiConfigClient.createDraft(tasks, note, req.user.userId);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async testDraft(req, res, next) {
    try {
      const { version } = req.params;
      const data = await aiConfigClient.testDraft(version, req.user.userId);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async activateConfiguration(req, res, next) {
    try {
      const { version, expected_active_version, acknowledge_inconclusive, note, confirmation_phrase } = req.body;
      if (version === undefined || expected_active_version === undefined) {
        throw ApiError.badRequest('version and expected_active_version are required.');
      }
      const expectedPhrase = `CONFIRM_ACTIVATE_VERSION_${version}`;
      if (!confirmation_phrase || confirmation_phrase.trim() !== expectedPhrase) {
        throw ApiError.badRequest(`Activating configuration requires exact typed confirmation phrase '${expectedPhrase}'.`);
      }
      const data = await aiConfigClient.activateConfiguration(
        version,
        expected_active_version,
        acknowledge_inconclusive,
        note,
        req.user.userId
      );
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async rollbackConfiguration(req, res, next) {
    try {
      const { target_version, expected_active_version, confirmation_phrase, reason } = req.body;
      if (target_version === undefined || expected_active_version === undefined) {
        throw ApiError.badRequest('target_version and expected_active_version are required.');
      }
      if (!confirmation_phrase || confirmation_phrase.trim() !== 'CONFIRM_ROLLBACK') {
        throw ApiError.badRequest("Emergency rollback requires exact typed confirmation phrase 'CONFIRM_ROLLBACK'.");
      }
      const data = await aiConfigClient.rollbackConfiguration(
        target_version,
        expected_active_version,
        confirmation_phrase.trim(),
        reason,
        req.user.userId
      );
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const data = await aiConfigClient.getHistory(limit, req.user.userId);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }

  async getAuditTrail(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '100', 10);
      const data = await aiConfigClient.getAuditTrail(limit, req.user.userId);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AIConfigController();
