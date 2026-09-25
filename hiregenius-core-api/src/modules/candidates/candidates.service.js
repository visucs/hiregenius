const path = require('path');
const candidatesRepository = require('./candidates.repository');
const ApiError = require('../../utils/ApiError');

class CandidatesService {
  /**
   * Upload or update resume reference for the authenticated candidate
   * Single current resume per candidate for this phase
   */
  async uploadResume(userId, file) {
    if (!file) {
      throw ApiError.badRequest('Resume file is required');
    }

    // Store relative path with forward slashes for cross-platform consistency
    const projectRoot = path.resolve(__dirname, '../../../');
    const relativePath = path.relative(projectRoot, file.path).replace(/\\/g, '/');
    const resumePath = relativePath.startsWith('uploads') ? relativePath : file.path.replace(/\\/g, '/');

    const existingCandidate = await candidatesRepository.findByUserId(userId);

    if (existingCandidate) {
      const updated = await candidatesRepository.updateResume(existingCandidate.id, {
        resume_path: resumePath,
        resume_original_name: file.originalname,
      });
      return { candidate: updated, isNew: false };
    }

    const created = await candidatesRepository.create({
      user_id: Number(userId),
      resume_path: resumePath,
      resume_original_name: file.originalname,
    });
    return { candidate: created, isNew: true };
  }

  /**
   * Get authenticated candidate's own profile and resume info
   * Returns 404 if no profile or resume uploaded yet
   */
  async getMyProfile(userId) {
    const candidate = await candidatesRepository.findByUserId(userId);
    if (!candidate || !candidate.resume_path) {
      throw ApiError.notFound('Candidate profile not found. Please upload your resume first.');
    }
    return candidate;
  }

  /**
   * Get candidate detail for a recruiter
   * Enforces ownership-adjacent check: recruiter can only view if candidate
   * has applied to one of THIS recruiter's jobs.
   */
  async getCandidateByIdForRecruiter(candidateId, recruiterId) {
    const candidate = await candidatesRepository.findById(candidateId);
    if (!candidate) {
      throw ApiError.notFound('Candidate not found');
    }

    const hasLink = await candidatesRepository.hasApplicationToRecruiter(candidateId, recruiterId);
    if (!hasLink) {
      throw ApiError.forbidden('Forbidden: You do not have permission to view this candidate profile');
    }

    const detailed = await candidatesRepository.findDetailWithUser(candidateId);
    return detailed || candidate;
  }
}

module.exports = new CandidatesService();
