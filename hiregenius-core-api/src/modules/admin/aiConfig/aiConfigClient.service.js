const crypto = require('crypto');
const env = require('../../../config/env');
const db = require('../../../config/db');
const emailService = require('../../email/email.service');
const ApiError = require('../../../utils/ApiError');

/**
 * Lexicographically canonicalize query string to prevent signature mismatch
 * @param {string|object} query
 * @returns {string}
 */
function canonicalizeQuery(query) {
  if (!query) return '';
  let entries = [];
  if (typeof query === 'string') {
    const raw = query.startsWith('?') ? query.slice(1) : query;
    if (!raw) return '';
    entries = raw.split('&').map((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return [decodeURIComponent(pair), ''];
      return [
        decodeURIComponent(pair.slice(0, idx)),
        decodeURIComponent(pair.slice(idx + 1)),
      ];
    });
  } else if (typeof query === 'object') {
    entries = Object.entries(query).map(([k, v]) => [String(k), String(v)]);
  }

  entries.sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });

  return entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/**
 * Compute constant-time HMAC-SHA256 signature matching the Python AI service
 */
function computeHmacSignature({
  secret,
  method,
  path,
  timestamp,
  nonce,
  bodyString = '',
  adminId = '',
  queryString = '',
}) {
  const canonicalQuery = canonicalizeQuery(queryString);
  const bodyHash = crypto.createHash('sha256').update(bodyString, 'utf8').digest('hex');
  const parts = [
    method.toUpperCase(),
    path,
    canonicalQuery,
    String(timestamp),
    String(nonce),
    bodyHash,
    String(adminId || ''),
  ];
  const payload = parts.join('\n');
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

class AIConfigClientService {
  constructor() {
    this.baseUrl = env.AI_ML_SERVICE_URL;
    this.secret = env.AI_CONFIG_INTERNAL_KEY;
  }

  /**
   * Dispatches signed internal HTTP request to Python AI/ML microservice
   */
  async request({ method, path, query = '', body = null, adminId = '' }) {
    const secret = this.secret;
    if (!secret) {
      throw new Error('AI_CONFIG_INTERNAL_KEY is not configured on Core API server.');
    }

    const timestamp = (Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();
    const canonicalQ = canonicalizeQuery(query);
    const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';

    const signature = computeHmacSignature({
      secret,
      method,
      path,
      timestamp,
      nonce,
      bodyString,
      adminId,
      queryString: canonicalQ,
    });

    const url = `${this.baseUrl}${path}${canonicalQ ? `?${canonicalQ}` : ''}`;

    const headers = {
      'Content-Type': 'application/json',
      'X-Acting-Admin-Id': String(adminId),
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature,
    };

    const isSensitive = path.includes('/credentials') || (body && body.api_key);
    if (!isSensitive) {
      console.log(`[AIConfigClient] ${method} ${path} (admin: ${adminId})`);
    } else {
      console.log(`[AIConfigClient] ${method} ${path} (admin: ${adminId}) [BODY REDACTED]`);
    }

    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: bodyString || undefined,
        signal: AbortSignal.timeout(env.AI_ML_SERVICE_TIMEOUT_MS || 30000),
      });
    } catch (fetchErr) {
      console.error(`[AIConfigClient] Network error connecting to AI Service at ${this.baseUrl}: ${fetchErr.message}`);
      throw ApiError.serviceUnavailable('AI Service is currently unreachable. Please check microservice connectivity.');
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      data = { message: 'Non-JSON response from AI Service' };
    }

    if (!response.ok) {
      const errorMsg = data.detail || data.message || `AI Service error: ${response.status}`;
      console.warn(`[AIConfigClient] Error response ${response.status} from ${path}: ${errorMsg}`);
      const err = new ApiError(response.status, errorMsg);
      err.code = data.code || 'AI_SERVICE_ERROR';
      throw err;
    }

    return data;
  }

  // ── Administrative Config Operations ────────────────────────────────────────

  async getConfiguration(adminId) {
    return await this.request({
      method: 'GET',
      path: '/api/internal/ai-config',
      adminId,
    });
  }

  async saveCredential(provider, apiKey, adminId) {
    const res = await this.request({
      method: 'PUT',
      path: `/api/internal/ai-config/credentials/${encodeURIComponent(provider)}`,
      body: { api_key: apiKey },
      adminId,
    });
    await this.notifyAdminsOnConfigChange({
      event: 'AI_PROVIDER_KEY_SAVED',
      adminId,
      details: `Administrator updated API credential for provider '${provider}' (Last4: ${res.last4}).`,
    });
    return res;
  }

  async deleteCredential(provider, adminId) {
    const res = await this.request({
      method: 'DELETE',
      path: `/api/internal/ai-config/credentials/${encodeURIComponent(provider)}`,
      adminId,
    });
    await this.notifyAdminsOnConfigChange({
      event: 'AI_PROVIDER_KEY_DELETED',
      adminId,
      details: `Administrator deleted stored API credential for provider '${provider}'.`,
    });
    return res;
  }

  async recheckCredential(provider, adminId) {
    return await this.request({
      method: 'POST',
      path: `/api/internal/ai-config/credentials/${encodeURIComponent(provider)}/recheck`,
      adminId,
    });
  }

  async createDraft(tasks, note, adminId) {
    return await this.request({
      method: 'POST',
      path: '/api/internal/ai-config/drafts',
      body: { tasks, note: note || '' },
      adminId,
    });
  }

  async testDraft(version, adminId) {
    return await this.request({
      method: 'POST',
      path: `/api/internal/ai-config/drafts/${encodeURIComponent(version)}/test`,
      adminId,
    });
  }

  async activateConfiguration(version, expectedActiveVersion, acknowledgeInconclusive, note, adminId) {
    const res = await this.request({
      method: 'POST',
      path: '/api/internal/ai-config/activate',
      body: {
        version: Number(version),
        expected_active_version: Number(expectedActiveVersion),
        acknowledge_inconclusive: Boolean(acknowledgeInconclusive),
        note: note || '',
      },
      adminId,
    });
    await this.notifyAdminsOnConfigChange({
      event: 'AI_CONFIG_ACTIVATED',
      adminId,
      details: `Administrator activated AI configuration Version ${version}. Note: "${note || 'N/A'}"`,
    });
    return res;
  }

  async rollbackConfiguration(targetVersion, expectedActiveVersion, confirmationPhrase, reason, adminId) {
    const res = await this.request({
      method: 'POST',
      path: '/api/internal/ai-config/rollback',
      body: {
        target_version: Number(targetVersion),
        expected_active_version: Number(expectedActiveVersion),
        confirmation_phrase: confirmationPhrase,
        reason: reason || '',
      },
      adminId,
    });
    await this.notifyAdminsOnConfigChange({
      event: 'AI_CONFIG_ROLLED_BACK',
      adminId,
      details: `Administrator rolled back AI configuration to Version ${targetVersion}. Reason: "${reason || 'N/A'}"`,
    });
    return res;
  }

  async getHistory(limit, adminId) {
    return await this.request({
      method: 'GET',
      path: '/api/internal/ai-config/history',
      query: { limit: limit || 50 },
      adminId,
    });
  }

  async getAuditTrail(limit, adminId) {
    return await this.request({
      method: 'GET',
      path: '/api/internal/ai-config/audit',
      query: { limit: limit || 100 },
      adminId,
    });
  }

  /**
   * Sends security alert emails to all active system administrators on credential or activation changes
   */
  async notifyAdminsOnConfigChange({ event, adminId, details }) {
    try {
      const adminUsers = await db('users')
        .where({ role: 'ADMIN', is_active: 1 })
        .select('email');

      if (!adminUsers || adminUsers.length === 0) return;

      const subject = `[SECURITY ALERT] AI Configuration Change: ${event}`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">HireGenius AI Security Alert</h2>
          <p>An administrative action was performed on the AI Provider and Model Configuration:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>Event:</strong> ${event}</p>
            <p><strong>Acting Administrator ID:</strong> ${adminId}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Details:</strong> ${details}</p>
          </div>
          <p style="font-size: 12px; color: #6b7280;">If you did not authorize this change, please inspect the Audit Log immediately in the Admin Console.</p>
        </div>
      `;

      for (const admin of adminUsers) {
        if (admin.email) {
          await emailService.sendEmail({
            to: admin.email,
            subject,
            html,
            text: `HireGenius AI Security Alert: ${event}\nActing Admin: ${adminId}\nDetails: ${details}`,
            type: 'SECURITY_ALERT',
          });
        }
      }
    } catch (err) {
      console.warn(`[AIConfigClient] Failed to dispatch admin notification emails: ${err.message}`);
    }
  }
}

module.exports = {
  AIConfigClientService,
  aiConfigClient: new AIConfigClientService(),
  canonicalizeQuery,
  computeHmacSignature,
};
