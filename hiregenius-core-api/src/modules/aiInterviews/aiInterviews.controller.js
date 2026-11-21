const aiInterviewsService = require('./aiInterviews.service');
const ApiResponse = require('../../utils/ApiResponse');

class AiInterviewsController {
  // ==========================================
  // Recruiter Handlers
  // ==========================================

  async generate(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.generateInterview(recruiterId, req.body);
      return ApiResponse.created(res, result, 'AI interview questions generated successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getDetail(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.getInterviewDetailForRecruiter(recruiterId, req.params.id);
      return ApiResponse.success(res, result, 'AI interview details retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async updateQuestions(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.updateDraftQuestions(recruiterId, req.params.id, req.body);
      return ApiResponse.success(res, result, 'Draft questions updated successfully');
    } catch (err) {
      return next(err);
    }
  }

  async publish(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.publishInterview(recruiterId, req.params.id, req.body);
      return ApiResponse.success(res, result, 'AI interview published and candidate notified');
    } catch (err) {
      return next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.cancelInterview(recruiterId, req.params.id);
      return ApiResponse.success(res, result, 'AI interview cancelled successfully');
    } catch (err) {
      return next(err);
    }
  }

  async releaseFeedback(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const released = req.body && typeof req.body.released === 'boolean' ? req.body.released : true;
      const result = await aiInterviewsService.releaseFeedback(recruiterId, req.params.id, released);
      return ApiResponse.success(res, result, `Feedback ${released ? 'released to' : 'hidden from'} candidate`);
    } catch (err) {
      return next(err);
    }
  }

  async retryEvaluation(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.retryEvaluation(recruiterId, req.params.id);
      return ApiResponse.success(res, result, 'AI evaluation re-triggered successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getJobInterviews(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.getJobAiInterviews(recruiterId, req.params.jobId);
      return ApiResponse.success(res, result, 'Job AI interviews retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  // ==========================================
  // Candidate Handlers
  // ==========================================

  async getCandidateInterviews(req, res, next) {
    try {
      const candidateUserId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.getCandidateAiInterviews(candidateUserId);
      return ApiResponse.success(res, result, 'Candidate AI interviews retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getRoom(req, res, next) {
    try {
      const candidateUserId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.getRoom(candidateUserId, req.params.id);
      return ApiResponse.success(res, result, 'Interview room loaded');
    } catch (err) {
      return next(err);
    }
  }

  async start(req, res, next) {
    try {
      const candidateUserId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.startInterview(candidateUserId, req.params.id, req.body);
      return ApiResponse.success(res, result, 'Interview started; timer running');
    } catch (err) {
      return next(err);
    }
  }

  async autosaveAnswer(req, res, next) {
    try {
      const candidateUserId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.autosaveAnswer(
        candidateUserId,
        req.params.id,
        req.params.questionId,
        req.body
      );
      return ApiResponse.success(res, result, 'Answer autosaved');
    } catch (err) {
      return next(err);
    }
  }

  async submit(req, res, next) {
    try {
      const candidateUserId = req.user.userId || req.user.id;
      const result = await aiInterviewsService.submitInterview(candidateUserId, req.params.id);
      return ApiResponse.success(res, result, 'Interview submitted successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AiInterviewsController();
