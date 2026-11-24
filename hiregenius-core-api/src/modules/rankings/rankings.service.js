const db = require('../../config/db');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const aiMlClient = require('../candidates/aiMlClient.service');
const rankingsRepository = require('./rankings.repository');

class RankingsService {
  /**
   * Generates a new candidate ranking snapshot for a job.
   * Only the recruiter who owns the job can generate ranking.
   * Atomic: if the AI service fails or timeout occurs, nothing is saved.
   *
   * @param {number} jobId
   * @param {number} recruiterUserId
   * @returns {Promise<object>}
   */
  async rankJobApplicants(jobId, recruiterUserId) {
    const job = await db('jobs')
      .where({ id: jobId, is_deleted: false })
      .first();

    if (!job) {
      throw ApiError.notFound(`Job with ID ${jobId} not found`);
    }

    if (Number(job.recruiter_id) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to rank applicants for this job');
    }

    // Retrieve active applications for this job
    const applications = await db('applications')
      .where('job_id', jobId)
      .select('id as application_id', 'candidate_id');

    // Handle case where job has 0 applicants
    if (!applications || applications.length === 0) {
      const rankingData = {
        job_id: jobId,
        created_by: recruiterUserId,
        scoring_version: 'rag-v1-untuned',
        embedding_model: 'models/gemini-embedding-001',
        applicant_count: 0,
        ranked_count: 0,
        unrankable_count: 0,
        semantic_unavailable: false,
        created_at: new Date(),
      };
      await rankingsRepository.createSnapshot({ rankingData, itemsData: [] });
      const emptySnapshot = await rankingsRepository.getLatestByJobId(jobId);
      return {
        ranking: emptySnapshot,
        is_stale: false,
        new_applicants_count: 0,
      };
    }

    const candidateAppMap = new Map();
    applications.forEach((app) => {
      candidateAppMap.set(String(app.candidate_id), app.id || app.application_id);
    });

    const applicantCandidateIds = applications.map((app) => String(app.candidate_id));

    // Call AI/ML Service RAG ranking endpoint
    const aiResult = await aiMlClient.rankApplicants({
      jobId,
      jobTitle: job.title,
      jobDescription: job.description,
      candidateIds: applicantCandidateIds,
      topNExplanations: env.RANKING_TOP_N_EXPLANATIONS || 10,
    });

    // Prepare itemsData for atomic transaction insert
    const itemsData = [];

    if (Array.isArray(aiResult.rankings)) {
      for (const ranked of aiResult.rankings) {
        const appId = candidateAppMap.get(String(ranked.candidate_id));
        if (appId) {
          itemsData.push({
            application_id: appId,
            candidate_id: Number(ranked.candidate_id),
            rank: ranked.rank,
            score: ranked.score,
            components: ranked.components,
            matched_skills: ranked.matched_skills || [],
            missing_skills: ranked.missing_skills || [],
            explanation: ranked.explanation || null,
            rankable: true,
            reason: null,
          });
        }
      }
    }

    if (Array.isArray(aiResult.not_rankable)) {
      for (const unrankable of aiResult.not_rankable) {
        const appId = candidateAppMap.get(String(unrankable.candidate_id));
        if (appId) {
          itemsData.push({
            application_id: appId,
            candidate_id: Number(unrankable.candidate_id),
            rank: null,
            score: null,
            components: null,
            matched_skills: null,
            missing_skills: null,
            explanation: null,
            rankable: false,
            reason: unrankable.reason || 'Unrankable',
          });
        }
      }
    }

    const rankingData = {
      job_id: jobId,
      created_by: recruiterUserId,
      scoring_version: aiResult.scoring_version || 'rag-v1-untuned',
      embedding_model: aiResult.embedding_model || 'models/gemini-embedding-001',
      applicant_count: aiResult.total_applicants ?? applications.length,
      ranked_count: aiResult.ranked_count ?? (aiResult.rankings?.length || 0),
      unrankable_count: aiResult.unrankable_count ?? (aiResult.not_rankable?.length || 0),
      semantic_unavailable: Boolean(aiResult.semantic_unavailable),
      provider: aiResult.provider || 'gemini',
      model_version: aiResult.model_version || 'gemini-3.5-flash',
      config_version: aiResult.config_version || 1,
      config_source: aiResult.config_source || 'db',
      created_at: new Date(),
    };

    await rankingsRepository.createSnapshot({ rankingData, itemsData });

    const createdSnapshot = await rankingsRepository.getLatestByJobId(jobId);

    return {
      ranking: createdSnapshot,
      is_stale: false,
      new_applicants_count: 0,
      disclaimer: aiResult.disclaimer || 'Advisory ranking: does not automate hiring decisions or auto-reject applicants.',
    };
  }

  /**
   * Retrieves the latest ranking snapshot for a job along with freshness/staleness indicator.
   * Only the recruiter who owns the job can access it.
   *
   * @param {number} jobId
   * @param {number} recruiterUserId
   * @returns {Promise<object>}
   */
  async getJobRanking(jobId, recruiterUserId) {
    const job = await db('jobs')
      .where({ id: jobId, is_deleted: false })
      .first();

    if (!job) {
      throw ApiError.notFound(`Job with ID ${jobId} not found`);
    }

    if (Number(job.recruiter_id) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to view rankings for this job');
    }

    const snapshot = await rankingsRepository.getLatestByJobId(jobId);

    if (!snapshot) {
      return {
        ranking: null,
        is_stale: false,
        new_applicants_count: 0,
      };
    }

    const staleStatus = await rankingsRepository.checkStale(
      jobId,
      snapshot.created_at,
      snapshot.applicant_count
    );

    return {
      ranking: snapshot,
      is_stale: staleStatus.is_stale,
      new_applicants_count: staleStatus.new_applicants_count,
      updated_resumes_count: staleStatus.updated_resumes_count,
      total_current_applicants: staleStatus.total_current_applicants,
    };
  }

  /**
   * Retrieves ranking history snapshots for a job.
   * Only the recruiter who owns the job can access it.
   *
   * @param {number} jobId
   * @param {number} recruiterUserId
   * @param {object} pagination
   * @returns {Promise<object>}
   */
  async getJobRankingHistory(jobId, recruiterUserId, pagination = {}) {
    const job = await db('jobs')
      .where({ id: jobId, is_deleted: false })
      .first();

    if (!job) {
      throw ApiError.notFound(`Job with ID ${jobId} not found`);
    }

    if (Number(job.recruiter_id) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to view ranking history for this job');
    }

    return await rankingsRepository.getHistoryByJobId(jobId, pagination);
  }
}

module.exports = new RankingsService();
