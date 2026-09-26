const interviewsService = require('./interviews.service');
const ApiResponse = require('../../utils/ApiResponse');

class InterviewsController {
  async schedule(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const interview = await interviewsService.scheduleInterview(recruiterId, req.body);
      return ApiResponse.created(res, interview, 'Interview scheduled successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getRecruiterInterviews(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const result = await interviewsService.getRecruiterInterviews(recruiterId, req.query);
      return ApiResponse.success(res, result, 'Interviews retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getInterviewById(req, res, next) {
    try {
      const interview = await interviewsService.getInterviewById(req.params.id, req.user);
      return ApiResponse.success(res, interview, 'Interview details retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async updateInterview(req, res, next) {
    try {
      const recruiterId = req.user.userId || req.user.id;
      const updated = await interviewsService.updateInterview(
        req.params.id,
        recruiterId,
        req.body,
      );
      return ApiResponse.success(res, updated, 'Interview updated successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getCandidateInterviews(req, res, next) {
    try {
      const candidateUserId = req.user.userId || req.user.id;
      const result = await interviewsService.getCandidateInterviews(candidateUserId);
      return ApiResponse.success(res, result, 'Candidate interviews retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new InterviewsController();
