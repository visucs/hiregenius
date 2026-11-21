const db = require('../../config/db');

function safeJsonParse(val, fallback = null) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

class RankingsRepository {
  /**
   * Creates an atomic ranking snapshot with all ranked and unrankable items.
   * If any insert fails, the transaction rolls back completely (never stores partial snapshot).
   *
   * @param {object} params
   * @param {object} params.rankingData
   * @param {Array<object>} params.itemsData
   * @returns {Promise<number>} Created ranking ID
   */
  async createSnapshot({ rankingData, itemsData }) {
    return await db.transaction(async (trx) => {
      const inserted = await trx('job_rankings').insert(rankingData);
      const rankingId = Array.isArray(inserted)
        ? inserted[0]
        : (typeof inserted === 'object' && inserted !== null ? inserted.id : inserted);

      if (itemsData && itemsData.length > 0) {
        const preparedItems = itemsData.map((item) => ({
          ranking_id: rankingId,
          application_id: item.application_id,
          candidate_id: item.candidate_id,
          rank: item.rank ?? null,
          score: item.score ?? null,
          components: item.components ? (typeof item.components === 'string' ? item.components : JSON.stringify(item.components)) : null,
          matched_skills: item.matched_skills ? (typeof item.matched_skills === 'string' ? item.matched_skills : JSON.stringify(item.matched_skills)) : null,
          missing_skills: item.missing_skills ? (typeof item.missing_skills === 'string' ? item.missing_skills : JSON.stringify(item.missing_skills)) : null,
          explanation: item.explanation ? (typeof item.explanation === 'string' ? item.explanation : JSON.stringify(item.explanation)) : null,
          rankable: item.rankable !== false,
          reason: item.reason ?? null,
        }));

        await trx('job_ranking_items').insert(preparedItems);
      }

      return rankingId;
    });
  }

  /**
   * Retrieves the latest ranking snapshot for a job along with all applicant items.
   *
   * @param {number} jobId
   * @returns {Promise<object|null>}
   */
  async getLatestByJobId(jobId) {
    const ranking = await db('job_rankings')
      .where('job_id', jobId)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .first();

    if (!ranking) return null;

    const items = await db('job_ranking_items')
      .leftJoin('applications', 'job_ranking_items.application_id', 'applications.id')
      .leftJoin('candidates', 'job_ranking_items.candidate_id', 'candidates.id')
      .leftJoin('users', 'candidates.user_id', 'users.id')
      .where('job_ranking_items.ranking_id', ranking.id)
      .select(
        'job_ranking_items.*',
        'applications.status as application_status',
        'applications.applied_at',
        'users.name as candidate_name',
        'users.email as candidate_email',
        'candidates.resume_path',
        'candidates.resume_original_name'
      )
      .orderByRaw('CASE WHEN job_ranking_items.rankable = 1 THEN 0 ELSE 1 END, job_ranking_items.rank ASC, job_ranking_items.id ASC');

    const parsedItems = items.map((item) => ({
      ...item,
      components: safeJsonParse(item.components),
      matched_skills: safeJsonParse(item.matched_skills, []),
      missing_skills: safeJsonParse(item.missing_skills, []),
      explanation: safeJsonParse(item.explanation),
    }));

    const rankings = parsedItems.filter((it) => it.rankable);
    const notRankable = parsedItems.filter((it) => !it.rankable);

    return {
      ...ranking,
      items: parsedItems,
      rankings,
      not_rankable: notRankable,
    };
  }

  /**
   * Checks staleness of a job's ranking snapshot:
   * - Checks if new applications arrived since snapshot creation
   * - Checks if total application count differs
   * - Checks if any applicant candidate updated their resume since snapshot creation
   *
   * @param {number} jobId
   * @param {Date|string} snapshotCreatedAt
   * @param {number} applicantCount
   * @returns {Promise<{ is_stale: boolean, new_applicants_count: number, updated_resumes_count: number }>}
   */
  async checkStale(jobId, snapshotCreatedAt, applicantCount) {
    const snapshotDate = new Date(snapshotCreatedAt);

    // 1. Total active applications check
    const totalAppsResult = await db('applications')
      .where('job_id', jobId)
      .count('id as count')
      .first();
    const totalCurrentApplicants = Number(totalAppsResult?.count || 0);

    // 2. Applications submitted after snapshot
    const newAppsResult = await db('applications')
      .where('job_id', jobId)
      .where('applied_at', '>', snapshotDate)
      .count('id as count')
      .first();
    const dateBasedNewCount = Number(newAppsResult?.count || 0);
    const countBasedNewCount = Math.max(0, totalCurrentApplicants - (applicantCount || 0));
    const newApplicantsCount = Math.max(dateBasedNewCount, countBasedNewCount);

    // 3. Candidate resume re-uploads after snapshot
    const updatedCandidatesResult = await db('applications')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where('applications.job_id', jobId)
      .where('candidates.updated_at', '>', snapshotDate)
      .count('applications.id as count')
      .first();
    const updatedCandidatesCount = Number(updatedCandidatesResult?.count || 0);

    const isStale = (newApplicantsCount > 0) || (totalCurrentApplicants !== applicantCount) || (updatedCandidatesCount > 0);

    return {
      is_stale: isStale,
      new_applicants_count: newApplicantsCount,
      updated_resumes_count: updatedCandidatesCount,
      total_current_applicants: totalCurrentApplicants,
    };
  }

  /**
   * Retrieves paginated ranking snapshot history for a specific job.
   *
   * @param {number} jobId
   * @param {object} [pagination]
   * @param {number} [pagination.page=1]
   * @param {number} [pagination.limit=10]
   */
  async getHistoryByJobId(jobId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const totalResult = await db('job_rankings')
      .where('job_id', jobId)
      .count('id as count')
      .first();
    const total = Number(totalResult?.count || 0);

    const snapshots = await db('job_rankings')
      .where('job_id', jobId)
      .select(
        'id',
        'job_id',
        'created_by',
        'scoring_version',
        'embedding_model',
        'applicant_count',
        'ranked_count',
        'unrankable_count',
        'semantic_unavailable',
        'created_at'
      )
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: snapshots,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

module.exports = new RankingsRepository();
