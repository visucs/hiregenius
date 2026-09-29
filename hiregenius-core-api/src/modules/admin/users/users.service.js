const adminUsersRepository = require('./users.repository');
const ApiError = require('../../../utils/ApiError');

class AdminUsersService {
  async getUserDetail(id) {
    const user = await adminUsersRepository.getUserById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const baseProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.is_active),
      emailVerified: Boolean(user.email_verified),
      adminApproved: Boolean(user.admin_approved),
      canPostJobs: Boolean(user.can_post_jobs),
      canApplyToJobs: Boolean(user.can_apply_to_jobs),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    if (user.role === 'RECRUITER') {
      const [totalJobsPosted, recentJobs, totalApplicationsReceived] = await Promise.all([
        adminUsersRepository.getRecruiterJobCount(user.id),
        adminUsersRepository.getRecruiterRecentJobs(user.id, 5),
        adminUsersRepository.getRecruiterTotalApplications(user.id),
      ]);

      return {
        ...baseProfile,
        recruiterActivity: {
          totalJobsPosted,
          totalApplicationsReceived,
          recentJobs,
        },
      };
    }

    if (user.role === 'CANDIDATE') {
      const [totalApplicationsSubmitted, recentApplications, candidateProfile] = await Promise.all([
        adminUsersRepository.getCandidateApplicationCount(user.id),
        adminUsersRepository.getCandidateRecentApplications(user.id, 5),
        adminUsersRepository.getCandidateProfile(user.id),
      ]);

      return {
        ...baseProfile,
        candidateActivity: {
          totalApplicationsSubmitted,
          recentApplications,
          resume: {
            hasResume: Boolean(candidateProfile?.resume_path),
            originalFilename: candidateProfile?.resume_original_name || null,
            uploadDate: candidateProfile?.updated_at || candidateProfile?.created_at || null,
          },
        },
      };
    }

    return baseProfile;
  }

  async deleteUser(adminUserId, targetUserId) {
    if (Number(adminUserId) === Number(targetUserId)) {
      throw ApiError.badRequest('You cannot delete your own administrator account');
    }

    const user = await adminUsersRepository.getUserById(targetUserId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.role === 'ADMIN') {
      throw ApiError.badRequest('Administrator accounts cannot be deleted');
    }

    if (user.role === 'RECRUITER') {
      const openJobsCount = await adminUsersRepository.getRecruiterActiveJobsCount(user.id);
      if (openJobsCount > 0) {
        throw ApiError.badRequest('Cannot delete recruiter with active job postings. Close or delete all jobs first.');
      }

      const activeAppsCount = await adminUsersRepository.getRecruiterActiveApplicationsCount(user.id);
      if (activeAppsCount > 0) {
        throw ApiError.badRequest('Cannot delete recruiter with candidate applications in progress. All applications must be resolved (Hired or Rejected) first.');
      }

      await adminUsersRepository.deleteRecruiterAccount(user.id);
      return;
    }

    if (user.role === 'CANDIDATE') {
      const candidateProfile = await adminUsersRepository.getCandidateProfile(user.id);
      if (candidateProfile) {
        const activeAppsCount = await adminUsersRepository.getCandidateActiveApplicationsCount(candidateProfile.id);
        if (activeAppsCount > 0) {
          throw ApiError.badRequest('Cannot delete candidate with active applications in progress. Applications must be resolved (Hired or Rejected) first.');
        }
        await adminUsersRepository.deleteCandidateAccount(user.id, candidateProfile);
      } else {
        await adminUsersRepository.deleteUserAccount(user.id);
      }
      return;
    }

    await adminUsersRepository.deleteUserAccount(user.id);
  }
}

module.exports = new AdminUsersService();
