const db = require('../../config/db');

class AtsRepository {
  /**
   * Count scans triggered by a user in the rolling last 24 hours.
   *
   * @param {number|string} triggeredByUserId
   * @param {import('knex').Knex.Transaction} [trx]
   * @returns {Promise<number>}
   */
  async countScansIn24h(triggeredByUserId, trx = null) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const query = (trx || db)('ats_scans')
      .where({ triggered_by_user_id: Number(triggeredByUserId) })
      .andWhere('created_at', '>=', since)
      .count('* as count')
      .first();

    const result = await query;
    return parseInt(result?.count || 0, 10);
  }

  /**
   * Get the oldest scan in the rolling 24h window to calculate reset time.
   *
   * @param {number|string} triggeredByUserId
   * @param {import('knex').Knex.Transaction} [trx]
   * @returns {Promise<Date|null>}
   */
  async getOldestScanIn24h(triggeredByUserId, trx = null) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const query = (trx || db)('ats_scans')
      .where({ triggered_by_user_id: Number(triggeredByUserId) })
      .andWhere('created_at', '>=', since)
      .orderBy('created_at', 'asc')
      .first();

    const row = await query;
    if (!row) return null;
    let createdAt = new Date(row.created_at);
    if (isNaN(createdAt.getTime()) && typeof row.created_at === 'string') {
      createdAt = new Date(row.created_at.replace(' ', 'T') + 'Z');
    }
    if (isNaN(createdAt.getTime())) {
      return null;
    }
    // Reset is 24 hours after this scan
    return new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Insert a new scan record.
   *
   * @param {object} scanData
   * @param {import('knex').Knex.Transaction} [trx]
   * @returns {Promise<object>}
   */
  async createScan(scanData, trx = null) {
    const q = (trx || db)('ats_scans');
    const formattedCreatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [id] = await q.insert({
      candidate_user_id: Number(scanData.candidate_user_id),
      triggered_by_user_id: Number(scanData.triggered_by_user_id),
      triggered_by_role: scanData.triggered_by_role,
      job_id: scanData.job_id ? Number(scanData.job_id) : null,
      mode: scanData.mode,
      source: scanData.source,
      overall_score: scanData.overall_score,
      scoring_version: scanData.scoring_version || 'ats-v2-untuned',
      result_json: typeof scanData.result_json === 'string' ? scanData.result_json : JSON.stringify(scanData.result_json),
      created_at: formattedCreatedAt,
    });

    return this.findById(id, trx);
  }

  /**
   * Find scan by primary ID.
   *
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   * @returns {Promise<object|null>}
   */
  async findById(id, trx = null) {
    const row = await (trx || db)('ats_scans').where({ id: Number(id) }).first();
    if (!row) return null;
    return this._formatRow(row);
  }

  /**
   * Find scans triggered by candidate (for their personal history).
   * Note: Recruiter-triggered scans are NOT included in candidate history.
   *
   * @param {number|string} candidateUserId
   * @param {object} [options]
   * @returns {Promise<{ scans: Array, total: number }>}
   */
  async listCandidateHistory(candidateUserId, { limit = 20, offset = 0 } = {}) {
    const baseQuery = db('ats_scans')
      .where({
        candidate_user_id: Number(candidateUserId),
        triggered_by_user_id: Number(candidateUserId),
      });

    const countResult = await baseQuery.clone().count('* as total').first();
    const total = parseInt(countResult?.total || 0, 10);

    const rows = await baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      scans: rows.map((r) => this._formatRow(r)),
      total,
    };
  }

  /**
   * Get latest scan for a candidate.
   *
   * @param {number|string} candidateUserId
   * @param {number|string|null} [jobId]
   * @param {boolean} [candidateTriggeredOnly=true]
   * @returns {Promise<object|null>}
   */
  async getLatestForCandidate(candidateUserId, jobId = null, candidateTriggeredOnly = true) {
    const q = db('ats_scans')
      .where({ candidate_user_id: Number(candidateUserId) });

    if (candidateTriggeredOnly) {
      q.andWhere({ triggered_by_user_id: Number(candidateUserId) });
    }

    if (jobId) {
      q.andWhere({ job_id: Number(jobId) });
    } else {
      q.whereNull('job_id');
    }

    const row = await q.orderBy('created_at', 'desc').first();
    if (!row) return null;
    return this._formatRow(row);
  }

  /**
   * Format DB row to typed JSON object.
   *
   * @private
   */
  _formatRow(row) {
    let parsedResult = {};
    try {
      parsedResult = typeof row.result_json === 'string' ? JSON.parse(row.result_json) : (row.result_json || {});
    } catch {
      parsedResult = {};
    }

    return {
      id: row.id,
      candidate_user_id: row.candidate_user_id,
      triggered_by_user_id: row.triggered_by_user_id,
      triggered_by_role: row.triggered_by_role,
      job_id: row.job_id,
      mode: row.mode,
      source: row.source,
      overall_score: parseFloat(row.overall_score),
      scoring_version: row.scoring_version,
      result: parsedResult,
      created_at: row.created_at,
    };
  }
}

module.exports = new AtsRepository();
