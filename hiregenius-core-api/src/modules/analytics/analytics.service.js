const analyticsRepository = require('./analytics.repository');

class AnalyticsService {
  /**
   * Recruiter summary analytics
   * @param {number} recruiterId
   * @param {number|undefined} days
   */
  async getRecruiterSummary(recruiterId, days) {
    // 1. All-time metrics
    const allTimeJobs = await analyticsRepository.getRecruiterJobsStats(recruiterId, null);
    const allTimeApps = await analyticsRepository.getRecruiterApplicationsStats(recruiterId, null);
    const allTimeInterviews = await analyticsRepository.getRecruiterInterviewsScheduledStats(
      recruiterId,
      null,
    );

    const allTime = {
      totalJobs: allTimeJobs.totalJobs,
      openJobs: allTimeJobs.openJobs,
      closedJobs: allTimeJobs.closedJobs,
      totalApplications: allTimeApps.totalApplications,
      totalInterviewsScheduled: allTimeInterviews,
      applicationsByStatus: allTimeApps.applicationsByStatus,
    };

    // 2. Recent-window metrics (using specified days or default 30)
    const windowDays = days !== undefined ? Number(days) : 30;
    const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const recentJobs = await analyticsRepository.getRecruiterJobsStats(recruiterId, cutoffDate);
    const recentApps = await analyticsRepository.getRecruiterApplicationsStats(recruiterId, cutoffDate);
    const recentInterviews = await analyticsRepository.getRecruiterInterviewsScheduledStats(
      recruiterId,
      cutoffDate,
    );

    const recent = {
      days: windowDays,
      totalJobs: recentJobs.totalJobs,
      openJobs: recentJobs.openJobs,
      closedJobs: recentJobs.closedJobs,
      totalApplications: recentApps.totalApplications,
      totalInterviewsScheduled: recentInterviews,
      applicationsByStatus: recentApps.applicationsByStatus,
    };

    // If days parameter was passed, primary top-level figures reflect the requested window.
    // If omitted, primary figures reflect all-time totals.
    // In both cases, allTime and recent are clearly labeled separately.
    const primary = days !== undefined ? recent : allTime;

    return {
      totalJobs: primary.totalJobs,
      openJobs: primary.openJobs,
      closedJobs: primary.closedJobs,
      totalApplications: primary.totalApplications,
      totalInterviewsScheduled: primary.totalInterviewsScheduled,
      applicationsByStatus: primary.applicationsByStatus,
      ...(days !== undefined ? { days: windowDays } : {}),
      recent,
      allTime,
    };
  }

  /**
   * Recruiter per-job breakdown
   * @param {number} recruiterId
   */
  async getRecruiterJobsBreakdown(recruiterId) {
    return analyticsRepository.getRecruiterJobsBreakdown(recruiterId);
  }

  /**
   * Recruiter daily application trend over specified window with zero-filled gaps
   * @param {number} recruiterId
   * @param {number} days
   */
  async getRecruiterTrend(recruiterId, days = 30) {
    const windowDays = Number(days) || 30;

    const now = new Date();
    const trendDates = [];

    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      trendDates.push(`${year}-${month}-${day}`);
    }

    const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (windowDays - 1));
    const countsByDate = await analyticsRepository.getRecruiterApplicationTrend(recruiterId, cutoffDate);

    // Map each date in the continuous range, filling missing days with 0
    return trendDates.map((date) => ({
      date,
      count: countsByDate[date] || 0,
    }));
  }

  /**
   * Candidate summary analytics
   * @param {number} candidateUserId
   */
  async getCandidateSummary(candidateUserId) {
    return analyticsRepository.getCandidateSummary(candidateUserId);
  }

  /**
   * Admin platform-wide summary
   */
  async getAdminSummary() {
    return analyticsRepository.getAdminPlatformSummary();
  }

  /**
   * Admin top recruiters
   * @param {{ limit?: number, sortBy?: 'applications'|'jobs' }} options
   */
  async getTopRecruiters(options = {}) {
    return analyticsRepository.getTopRecruiters(options);
  }
}

module.exports = new AnalyticsService();
