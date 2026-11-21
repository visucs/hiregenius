const aiInterviewsRepository = require('./aiInterviews.repository');
const applicationsRepository = require('../applications/applications.repository');
const candidatesRepository = require('../candidates/candidates.repository');
const notificationsService = require('../notifications/notifications.service');
const aiMlClient = require('../candidates/aiMlClient.service');
const ApiError = require('../../utils/ApiError');
const env = require('../../config/env');
const db = require('../../config/db');

function parseDbDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    if (val.includes('T') || val.endsWith('Z')) {
      return new Date(val);
    }
    return new Date(val.replace(' ', 'T') + 'Z');
  }
  return new Date(val);
}

class AiInterviewsService {
  /**
   * Recruiter: Generate AI Interview Draft for an application
   */
  async generateInterview(recruiterUserId, { applicationId, windowStart, windowEnd, durationMinutes = 30, questionCount = 6 }) {
    const application = await applicationsRepository.findById(applicationId);
    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    // Ownership check: Recruiter must own the job
    if (Number(application.recruiter_id) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to create an interview for this application');
    }

    // Check for existing active AI interview on this application
    const existing = await aiInterviewsRepository.findByApplicationId(applicationId);
    if (existing && ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED'].includes(existing.status)) {
      throw ApiError.conflict(`An AI interview already exists for this application in ${existing.status} status.`);
    }

    // Recruiter rate limit check (default 20 / hour)
    const recentCount = await aiInterviewsRepository.countRecentGenerationsByRecruiter(recruiterUserId, 1);
    const hourlyLimit = env.AI_INTERVIEW_RATE_LIMIT_HOURLY || 20;
    if (recentCount >= hourlyLimit) {
      throw new ApiError(429, 'Hourly AI interview generation limit reached. Please try again later.');
    }

    // Default time window: opens now, closes in 7 days
    const now = new Date();
    const effectiveStart = windowStart ? new Date(windowStart) : now;
    const effectiveEnd = windowEnd ? new Date(windowEnd) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (effectiveEnd <= effectiveStart) {
      throw ApiError.badRequest('Window end time must be after window start time');
    }

    // Retrieve candidate parsed resume data if available
    let parsedResumeData = null;
    try {
      if (application.candidate_id) {
        parsedResumeData = await aiMlClient.getParsedResume(application.candidate_id);
      }
    } catch {
      // Non-blocking: proceed without parsed resume if unavailable
    }

    // Prepare job payload for AI service
    const skills = typeof application.job_skills === 'string'
      ? application.job_skills.split(',').map((s) => s.trim()).filter(Boolean)
      : (application.job_skills || []);

    const aiGenResponse = await aiMlClient.generateInterviewQuestions({
      job: {
        title: application.job_title || 'Software Engineer',
        description: application.job_description || '',
        requiredSkills: skills,
        experienceYears: application.job_experience ? parseFloat(application.job_experience) : null,
        seniority: application.job_experience && parseFloat(application.job_experience) >= 5 ? 'SENIOR' : 'MID',
      },
      parsedResume: parsedResumeData,
      options: {
        questionCount: Math.min(10, Math.max(4, parseInt(questionCount, 10) || 6)),
      },
    });

    const questionsFromAi = aiGenResponse?.questions || [];
    if (questionsFromAi.length === 0) {
      throw new ApiError(502, 'AI service failed to generate questions. Please try again.');
    }

    // Persist session and questions in atomic transaction
    const interview = await db.transaction(async (trx) => {
      const createdSession = await aiInterviewsRepository.createInterview(
        {
          application_id: applicationId,
          status: 'DRAFT',
          window_start: effectiveStart,
          window_end: effectiveEnd,
          duration_minutes: durationMinutes,
          created_by: recruiterUserId,
        },
        trx
      );

      const questionsToInsert = questionsFromAi.map((q, idx) => ({
        interview_id: createdSession.id,
        question_order: idx + 1,
        type: q.type || 'TECHNICAL',
        text: q.text,
        skill_tags: JSON.stringify(q.skill_tags || []),
        difficulty: q.difficulty || 'MEDIUM',
        expected_points: JSON.stringify(q.expected_points || []),
        max_score: q.max_score || 10,
        created_at: new Date(),
      }));

      await aiInterviewsRepository.createQuestions(questionsToInsert, trx);
      return createdSession;
    });

    const questions = await aiInterviewsRepository.getQuestions(interview.id);
    return {
      ...interview,
      questions,
    };
  }

  /**
   * Recruiter: Edit / reorder questions on a DRAFT interview
   */
  async updateDraftQuestions(recruiterUserId, interviewId, { questions = [], orderedQuestionIds = [] }) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('AI interview not found');
    }
    if (Number(interview.created_by) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to edit this interview');
    }
    if (interview.status !== 'DRAFT') {
      throw ApiError.badRequest('Questions can only be edited while interview is in DRAFT status');
    }

    await db.transaction(async (trx) => {
      if (Array.isArray(orderedQuestionIds) && orderedQuestionIds.length > 0) {
        await aiInterviewsRepository.reorderQuestions(interviewId, orderedQuestionIds, trx);
      }

      if (Array.isArray(questions) && questions.length > 0) {
        for (const q of questions) {
          if (q.id) {
            await aiInterviewsRepository.updateQuestion(
              q.id,
              {
                text: q.text,
                type: q.type,
                difficulty: q.difficulty,
                expected_points: q.expectedPoints,
              },
              trx
            );
          }
        }
      }
    });

    const updatedQuestions = await aiInterviewsRepository.getQuestions(interviewId);
    return {
      ...interview,
      questions: updatedQuestions,
    };
  }

  /**
   * Recruiter: Publish AI Interview (opens test window and notifies candidate)
   */
  async publishInterview(recruiterUserId, interviewId, { windowStart, windowEnd, durationMinutes } = {}) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('AI interview not found');
    }
    if (Number(interview.created_by) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to publish this interview');
    }
    if (interview.status !== 'DRAFT' && interview.status !== 'CANCELLED') {
      throw ApiError.badRequest(`Cannot publish interview in ${interview.status} status`);
    }

    const updates = {
      status: 'PUBLISHED',
    };
    if (windowStart) updates.window_start = new Date(windowStart);
    if (windowEnd) updates.window_end = new Date(windowEnd);
    if (durationMinutes) updates.duration_minutes = durationMinutes;

    const published = await aiInterviewsRepository.update(interviewId, updates);

    // Transition application status to INTERVIEW in ATS pipeline
    await applicationsRepository.updateStatus(interview.application_id, 'INTERVIEW');

    // Notify candidate
    if (interview.candidate_user_id) {
      await notificationsService.createNotification({
        userId: interview.candidate_user_id,
        type: 'INTERVIEW_SCHEDULED',
        message: `You have been invited to take an AI assessment for "${interview.job_title}". Assessment closes on ${parseDbDate(published.window_end).toUTCString()}.`,
        relatedEntityType: 'AI_INTERVIEW',
        relatedEntityId: published.id,
      });
    }

    return published;
  }

  /**
   * Recruiter: Cancel interview
   */
  async cancelInterview(recruiterUserId, interviewId) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('AI interview not found');
    }
    if (Number(interview.created_by) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to cancel this interview');
    }
    if (['SUBMITTED', 'EVALUATED'].includes(interview.status)) {
      throw ApiError.badRequest('Cannot cancel an already submitted or evaluated interview');
    }

    return aiInterviewsRepository.update(interviewId, { status: 'CANCELLED' });
  }

  /**
   * Recruiter: Full report view (includes expected points, answers, evaluation, and candidate metrics)
   */
  async getInterviewDetailForRecruiter(recruiterUserId, interviewId) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('AI interview not found');
    }
    if (Number(interview.created_by) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to view this interview report');
    }

    const questions = await aiInterviewsRepository.getQuestions(interviewId);
    const answers = await aiInterviewsRepository.getAnswers(interviewId);
    const evaluation = await aiInterviewsRepository.getEvaluation(interviewId);

    const answersMap = {};
    for (const a of answers) {
      answersMap[a.question_id] = a;
    }

    const questionsWithAnswers = questions.map((q) => ({
      ...q,
      candidateAnswer: answersMap[q.id]?.answer_text || null,
      charCount: answersMap[q.id]?.char_count || 0,
      submittedAt: answersMap[q.id]?.submitted_at || null,
    }));

    return {
      interview,
      questions: questionsWithAnswers,
      evaluation,
      disclaimer: 'AI output is advisory; the recruiter makes the final hiring decision.',
    };
  }

  /**
   * Recruiter: List AI interviews for a specific job
   */
  async getJobAiInterviews(recruiterUserId, jobId) {
    return aiInterviewsRepository.listByJob(jobId, recruiterUserId);
  }

  /**
   * Recruiter: Toggle release candidate feedback
   */
  async releaseFeedback(recruiterUserId, interviewId, released = true) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('AI interview not found');
    }
    if (Number(interview.created_by) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to update feedback visibility');
    }

    const updated = await aiInterviewsRepository.update(interviewId, { feedback_released: Boolean(released) });

    if (released && interview.candidate_user_id) {
      await notificationsService.createNotification({
        userId: interview.candidate_user_id,
        type: 'STATUS_CHANGED',
        message: `Evaluation feedback for your AI assessment on "${interview.job_title}" has been released by the recruiter.`,
        relatedEntityType: 'AI_INTERVIEW',
        relatedEntityId: interviewId,
      });
    }

    return updated;
  }

  /**
   * Recruiter: Retry evaluation if failed
   */
  async retryEvaluation(recruiterUserId, interviewId) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('AI interview not found');
    }
    if (Number(interview.created_by) !== Number(recruiterUserId)) {
      throw ApiError.forbidden('You do not have permission to retry this evaluation');
    }
    if (!['SUBMITTED', 'EVALUATED'].includes(interview.status)) {
      throw ApiError.badRequest('Can only evaluate submitted interviews');
    }

    const questions = await aiInterviewsRepository.getQuestions(interviewId);
    const answers = await aiInterviewsRepository.getAnswers(interviewId);

    const questionsPayload = questions.map((q) => ({
      id: String(q.id),
      type: q.type,
      text: q.text,
      skill_tags: q.skill_tags || [],
      difficulty: q.difficulty,
      expected_points: q.expected_points || [],
      max_score: q.max_score,
    }));

    const answersPayload = answers.map((a) => ({
      question_id: String(a.question_id),
      answer_text: a.answer_text || '',
    }));

    const skills = typeof interview.job_skills === 'string'
      ? interview.job_skills.split(',').map((s) => s.trim()).filter(Boolean)
      : (interview.job_skills || []);

    const evalResponse = await aiMlClient.evaluateInterviewAnswers({
      questions: questionsPayload,
      answers: answersPayload,
      job: {
        title: interview.job_title,
        description: interview.job_description || '',
        requiredSkills: skills,
      },
    });

    const aggregate = evalResponse?.aggregate || {};
    const savedEval = await aiInterviewsRepository.upsertEvaluation(interviewId, {
      evaluation_status: 'EVALUATED',
      overall_score: aggregate.overall_score ?? aggregate.overall ?? 0,
      technical_score: aggregate.technical_score ?? aggregate.technical ?? 0,
      communication_score: aggregate.communication_score ?? aggregate.communication ?? 0,
      confidence_score: aggregate.indicative_confidence ?? aggregate.confidence_indicative ?? 0,
      recommendation: aggregate.recommendation || 'CONSIDER',
      rubric_version: aggregate.rubric_version || 'rubric-v1-untuned',
      model_version: aggregate.model_version || null,
      result_json: evalResponse?.evaluations || [],
      evaluated_at: new Date(),
    });

    await aiInterviewsRepository.update(interviewId, { status: 'EVALUATED' });
    return savedEval;
  }

  // ── CANDIDATE FACING METHODS ───────────────────────────────────────────────

  /**
   * Candidate: Get all my AI interviews
   */
  async getCandidateAiInterviews(candidateUserId) {
    const list = await aiInterviewsRepository.listByCandidate(candidateUserId);
    // Redact unreleased evaluations
    return list.map((item) => {
      const sanitized = { ...item };
      if (!item.feedback_released) {
        delete sanitized.overall_score;
        delete sanitized.recommendation;
      }
      return sanitized;
    });
  }

  /**
   * Candidate: Enter test room
   * CRITICAL RESTRICTION: Never returns expected_points or rubric details to candidate!
   */
  async getRoom(candidateUserId, interviewId) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('Interview not found');
    }

    // Ownership check: Candidate must own the application
    if (Number(interview.candidate_user_id) !== Number(candidateUserId)) {
      throw ApiError.forbidden('You do not have permission to access this interview room');
    }

    if (interview.status === 'CANCELLED') {
      throw ApiError.badRequest('This interview assessment has been cancelled by the recruiter');
    }

    const now = new Date();
    // Expiry check
    if (parseDbDate(interview.window_end) < now && ['DRAFT', 'PUBLISHED', 'IN_PROGRESS'].includes(interview.status)) {
      await aiInterviewsRepository.update(interviewId, { status: 'EXPIRED' });
      throw ApiError.forbidden('The time window for this interview assessment has expired');
    }

    if (parseDbDate(interview.window_start) > now) {
      throw ApiError.forbidden('The time window for this assessment has not yet opened');
    }

    // Server-side timer check if already in progress
    let remainingSeconds = (interview.duration_minutes || 30) * 60;
    if (interview.status === 'IN_PROGRESS' && interview.started_at) {
      const elapsedMs = now.getTime() - parseDbDate(interview.started_at).getTime();
      const totalAllowedMs = interview.duration_minutes * 60 * 1000;
      const leftMs = totalAllowedMs - elapsedMs;
      remainingSeconds = Math.max(0, Math.floor(leftMs / 1000));

      // Auto-submit if time has fully run out + 60s grace period
      if (leftMs < -60000) {
        await this.submitInterview(candidateUserId, interviewId);
        throw ApiError.forbidden('Your allocated assessment time has expired and your answers have been auto-submitted.');
      }
    }

    const questions = await aiInterviewsRepository.getQuestions(interviewId);
    const answers = await aiInterviewsRepository.getAnswers(interviewId);
    const answersMap = {};
    for (const a of answers) {
      answersMap[a.question_id] = a.answer_text || '';
    }

    // Strip expected_points from every question for candidate security
    const sanitizedQuestions = questions.map((q) => ({
      id: q.id,
      questionOrder: q.question_order,
      type: q.type,
      text: q.text,
      skillTags: q.skill_tags || [],
      difficulty: q.difficulty,
      maxScore: q.max_score,
      currentAnswer: answersMap[q.id] || '',
    }));

    let evaluationData = null;
    if (Boolean(interview.feedback_released)) {
      evaluationData = await aiInterviewsRepository.getEvaluation(interviewId);
    }

    return {
      interviewId: interview.id,
      jobTitle: interview.job_title,
      status: interview.status,
      durationMinutes: interview.duration_minutes,
      remainingSeconds,
      timeRemainingSeconds: remainingSeconds,
      windowStart: interview.window_start,
      windowEnd: interview.window_end,
      startedAt: interview.started_at,
      submittedAt: interview.submitted_at,
      acknowledgedAt: interview.acknowledged_at,
      questions: sanitizedQuestions,
      evaluation: evaluationData,
      hint: 'Tip: You can answer in English or Hinglish; answers are evaluated strictly on substance and clarity with zero language penalty (English recommended).',
    };
  }

  /**
   * Candidate: Start interview (activates server-side countdown timer & stores consent acknowledgement)
   */
  async startInterview(candidateUserId, interviewId, { consentAcknowledged }) {
    if (!consentAcknowledged) {
      throw ApiError.badRequest('Consent acknowledgment is required to start the interview room.');
    }

    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('Interview not found');
    }
    if (Number(interview.candidate_user_id) !== Number(candidateUserId)) {
      throw ApiError.forbidden('You do not have permission to start this interview');
    }

    // Single Attempt Enforcement
    if (['SUBMITTED', 'EVALUATED'].includes(interview.status)) {
      throw ApiError.badRequest('This assessment has already been submitted and cannot be retaken.');
    }

    if (interview.status === 'IN_PROGRESS') {
      return this.getRoom(candidateUserId, interviewId);
    }

    if (interview.status !== 'PUBLISHED') {
      throw ApiError.badRequest(`Cannot start interview in ${interview.status} status`);
    }

    const now = new Date();
    if (parseDbDate(interview.window_end) < now) {
      await aiInterviewsRepository.update(interviewId, { status: 'EXPIRED' });
      throw ApiError.forbidden('Assessment window has expired');
    }

    await aiInterviewsRepository.update(interviewId, {
      status: 'IN_PROGRESS',
      started_at: now,
      acknowledged_at: now,
    });

    return this.getRoom(candidateUserId, interviewId);
  }

  /**
   * Candidate: Autosave answer with server-side time and character limit enforcement
   */
  async autosaveAnswer(candidateUserId, interviewId, questionId, { answerText }) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('Interview not found');
    }
    if (Number(interview.candidate_user_id) !== Number(candidateUserId)) {
      throw ApiError.forbidden('You do not have permission to edit this interview');
    }
    if (interview.status !== 'IN_PROGRESS') {
      throw ApiError.badRequest('Answers can only be edited while assessment is IN_PROGRESS');
    }

    // Check timer
    const now = new Date();
    const elapsedMs = now.getTime() - parseDbDate(interview.started_at).getTime();
    const totalAllowedMs = interview.duration_minutes * 60 * 1000 + 60000; // 1 min grace
    if (elapsedMs > totalAllowedMs) {
      await this.submitInterview(candidateUserId, interviewId);
      throw ApiError.forbidden('Assessment duration has ended. Your answers have been locked and submitted.');
    }

    const cleanText = (answerText || '').slice(0, 2000);
    const answer = await aiInterviewsRepository.upsertAnswer({
      interviewId,
      questionId,
      answerText: cleanText,
      charCount: cleanText.length,
    });

    return {
      success: true,
      questionId,
      answerText: cleanText,
      charCount: answer.char_count,
      savedAt: new Date(),
    };
  }

  /**
   * Candidate: Submit interview
   * Ensures answers are committed and saved BEFORE evaluation begins.
   * If AI evaluation fails, answers remain safe and interview is marked SUBMITTED with evaluation FAILED for retry.
   */
  async submitInterview(candidateUserId, interviewId) {
    const interview = await aiInterviewsRepository.findById(interviewId);
    if (!interview) {
      throw ApiError.notFound('Interview not found');
    }
    if (Number(interview.candidate_user_id) !== Number(candidateUserId)) {
      throw ApiError.forbidden('You do not have permission to submit this interview');
    }

    // Single attempt enforcement: if already submitted or evaluated, reject retake
    if (['SUBMITTED', 'EVALUATED'].includes(interview.status)) {
      throw ApiError.badRequest('This AI assessment has already been submitted and cannot be retaken.');
    }

    const now = new Date();

    // 1. Mark answers submitted & session SUBMITTED in atomic transaction BEFORE calling AI
    await db.transaction(async (trx) => {
      await aiInterviewsRepository.markAnswersSubmitted(interviewId, trx);
      await aiInterviewsRepository.update(
        interviewId,
        {
          status: 'SUBMITTED',
          submitted_at: now,
        },
        trx
      );
      await aiInterviewsRepository.upsertEvaluation(
        interviewId,
        {
          evaluation_status: 'PENDING',
        },
        trx
      );
    });

    // 2. Trigger asynchronous AI Evaluation
    try {
      const questions = await aiInterviewsRepository.getQuestions(interviewId);
      const answers = await aiInterviewsRepository.getAnswers(interviewId);

      const questionsPayload = questions.map((q) => ({
        id: String(q.id),
        type: q.type,
        text: q.text,
        skill_tags: q.skill_tags || [],
        difficulty: q.difficulty,
        expected_points: q.expected_points || [],
        max_score: q.max_score,
      }));

      const answersPayload = answers.map((a) => ({
        question_id: String(a.question_id),
        answer_text: a.answer_text || '',
      }));

      const skills = typeof interview.job_skills === 'string'
        ? interview.job_skills.split(',').map((s) => s.trim()).filter(Boolean)
        : (interview.job_skills || []);

      const evalResponse = await aiMlClient.evaluateInterviewAnswers({
        questions: questionsPayload,
        answers: answersPayload,
        job: {
          title: interview.job_title,
          description: interview.job_description || '',
          requiredSkills: skills,
        },
      });

      const aggregate = evalResponse?.aggregate || {};
      await aiInterviewsRepository.upsertEvaluation(interviewId, {
        evaluation_status: 'EVALUATED',
        overall_score: aggregate.overall_score ?? aggregate.overall ?? 0,
        technical_score: aggregate.technical_score ?? aggregate.technical ?? 0,
        communication_score: aggregate.communication_score ?? aggregate.communication ?? 0,
        confidence_score: aggregate.indicative_confidence ?? aggregate.confidence_indicative ?? 0,
        recommendation: aggregate.recommendation || 'CONSIDER',
        rubric_version: aggregate.rubric_version || 'rubric-v1-untuned',
        model_version: aggregate.model_version || null,
        result_json: evalResponse?.evaluations || [],
        evaluated_at: new Date(),
      });

      await aiInterviewsRepository.update(interviewId, { status: 'EVALUATED' });

      // Notify recruiter that candidate completed assessment and evaluation is ready
      if (interview.created_by) {
        await notificationsService.createNotification({
          userId: interview.created_by,
          type: 'STATUS_CHANGED',
          message: `${interview.candidate_name || 'A candidate'} has completed their AI assessment for "${interview.job_title}". Evaluation report is ready for review.`,
          relatedEntityType: 'AI_INTERVIEW',
          relatedEntityId: interviewId,
        });
      }
    } catch (aiErr) {
      console.error(`[AiInterviewsService] Evaluation failed for interview ${interviewId}:`, aiErr.message);
      // Answers remain safely stored! Mark evaluation status as FAILED so recruiter can retry
      await aiInterviewsRepository.upsertEvaluation(interviewId, {
        evaluation_status: 'FAILED',
        error_message: aiErr.message || 'AI evaluation service unavailable',
      });
    }

    return {
      success: true,
      message: 'Assessment submitted successfully.',
      interviewId,
      status: 'SUBMITTED',
      submittedAt: now,
    };
  }

  /**
   * Retention Cleanup Job (Addendum 2): Clean up expired candidate answers and JSON payloads
   */
  async cleanupOldInterviews(retentionDays = env.AI_INTERVIEW_RETENTION_DAYS || 180) {
    const purgedCount = await aiInterviewsRepository.purgeOldInterviewDetails(retentionDays);
    console.log(`[AiInterviewsService] Retention cleanup completed: ${purgedCount} interviews purged.`);
    return { purgedCount, retentionDays };
  }
}

module.exports = new AiInterviewsService();
