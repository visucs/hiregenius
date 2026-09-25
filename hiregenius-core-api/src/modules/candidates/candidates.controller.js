const candidatesService = require('./candidates.service');
const ApiResponse = require('../../utils/ApiResponse');

class CandidatesController {
  async uploadResume(req, res, next) {
    try {
      const { candidate, isNew } = await candidatesService.uploadResume(req.user.userId, req.file);
      if (isNew) {
        return ApiResponse.created(res, candidate, 'Resume uploaded successfully');
      }
      return ApiResponse.success(res, candidate, 'Resume updated successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const candidate = await candidatesService.getMyProfile(req.user.userId);
      return ApiResponse.success(res, candidate, 'Candidate profile retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getCandidateById(req, res, next) {
    try {
      const candidate = await candidatesService.getCandidateByIdForRecruiter(
        req.params.id,
        req.user.userId,
      );
      return ApiResponse.success(res, candidate, 'Candidate details retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new CandidatesController();
