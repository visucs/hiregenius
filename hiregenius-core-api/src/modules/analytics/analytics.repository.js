const db = require('../../config/db');

const ALL_APPLICATION_STATUSES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'SHORTLISTED',
  'REJECTED',
  'HIRED',
];

function initEmptyStatusBreakdown() {
  const breakdown = {};
  for (const status of ALL_APPLICATION_STATUSES) {
    breakdown[status] = 0;
  }
  return breakdown;
}

function toSqlDateTime(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 19).replace('T', ' ');
  }
  return val;
}

class AnalyticsRepository {
  /**
   * Recruiter: Job counts (total, open, closed)
   * @param {number} recruiterId
   * @param {Date|null} cutoffDate
   */
  async getRecruiterJobsStats(recruiterId, cutoffDate = null) {
    const query = db('jobs')
      .where('jobs.recruiter_id', Number(recruiterId))
      .andWhere('jobs.is_deleted', false);

    if (cutoffDate) {
      query.andWhere('jobs.created_at', '>=', toSqlDateTime(cutoffDate));
    }

    const row = await query
      .select(
        db.raw('COUNT(*) as totalJobs'),
        db.raw("SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as openJobs"),
        db.raw("SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closedJobs"),
      )
      .first();

    return {
      totalJobs: Number(row?.totalJobs || 0),
      openJobs: Number(row?.openJobs || 0),
      closedJobs: Number(row?.closedJobs || 0),
    };
  }

  /**
   * Recruiter: Application counts & status breakdown
   * @param {number} recruiterId
   * @param {Date|null} cutoffDate
   */
  async getRecruiterApplicationsStats(recruiterId, cutoffDate = null) {
    const query = db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.recruiter_id', Number(recruiterId))
      .andWhere('jobs.is_deleted', false);

    if (cutoffDate) {
      query.andWhere('applications.applied_at', '>=', toSqlDateTime(cutoffDate));
    }

    const rows = await query
      .select('applications.status', db.raw('COUNT(applications.id) as count'))
      .groupBy('applications.status');

    const applicationsByStatus = initEmptyStatusBreakdown();
    let totalApplications = 0;

    for (const r of rows) {
      const count = Number(r.count || 0);
      if (applicationsByStatus[r.status] !== undefined) {
        applicationsByStatus[r.status] = count;
      }
      totalApplications += count;
    }

    return {
      totalApplications,
      applicationsByStatus,
    };
  }

  /**
   * Recruiter: Interviews scheduled count
   * @param {number} recruiterId
   * @param {Date|null} cutoffDate
   */
  async getRecruiterInterviewsScheduledStats(recruiterId, cutoffDate = null) {
    const query = db('interviews')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.recruiter_id', Number(recruiterId))
      .andWhere('jobs.is_deleted', false)
      .andWhere('interviews.status', 'SCHEDULED');

    if (cutoffDate) {
      query.andWhere('interviews.created_at', '>=', toSqlDateTime(cutoffDate));
    }

    const row = await query.count('interviews.id as count').first();
    return Number(row?.count || 0);
  }

  /**
   * Recruiter: Per-job breakdown
   * @param {number} recruiterId
   */
  async getRecruiterJobsBreakdown(recruiterId) {
    const rows = await db('jobs')
      .leftJoin('applications', 'applications.job_id', 'jobs.id')
      .leftJoin('interviews', 'interviews.application_id', 'applications.id')
      .where('jobs.recruiter_id', Number(recruiterId))
      .andWhere('jobs.is_deleted', false)
      .select(
        'jobs.id as jobId',
        'jobs.title',
        'jobs.status',
        db.raw('COUNT(DISTINCT applications.id) as applicationCount'),
        db.raw('COUNT(DISTINCT interviews.id) as interviewCount'),
      )
      .groupBy('jobs.id', 'jobs.title', 'jobs.status')
      .orderBy([
        { column: 'applicationCount', order: 'desc' },
        { column: 'jobs.id', order: 'desc' },
      ]);

    return rows.map((r) => ({
      jobId: Number(r.jobId),
      title: r.title,
      status: r.status,
      applicationCount: Number(r.applicationCount || 0),
      interviewCount: Number(r.interviewCount || 0),
    }));
  }

  /**
   * Recruiter: Daily application trend counts within cutoff
   * @param {number} recruiterId
   * @param {Date} cutoffDate
   */
  async getRecruiterApplicationTrend(recruiterId, cutoffDate) {
    const formattedCutoff = cutoffDate instanceof Date
      ? cutoffDate.toISOString().slice(0, 19).replace('T', ' ')
      : cutoffDate;

    const query = db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.recruiter_id', Number(recruiterId))
      .andWhere('jobs.is_deleted', false)
      .andWhere('applications.applied_at', '>=', formattedCutoff)
      .select(
        db.raw('DATE(applications.applied_at) as date'),
        db.raw('COUNT(applications.id) as count'),
      )
      .groupBy(db.raw('DATE(applications.applied_at)'));

    const rows = await query;

    const countsByDate = {};
    for (const r of rows) {
      let dateStr = null;
      if (r.date instanceof Date) {
        const year = r.date.getFullYear();
        const month = String(r.date.getMonth() + 1).padStart(2, '0');
        const day = String(r.date.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      } else if (typeof r.date === 'string') {
        dateStr = r.date.slice(0, 10);
      }
      if (dateStr) {
        countsByDate[dateStr] = Number(r.count || 0);
      }
    }
    return countsByDate;
  }

  /**
   * Candidate: Applications & interview stats for candidate user ID
   * @param {number} candidateUserId
   */
  async getCandidateSummary(candidateUserId) {
    const applicationsByStatus = initEmptyStatusBreakdown();

    // 1. Resolve candidate record by user_id
    const candidate = await db('candidates')
      .where('user_id', Number(candidateUserId))
      .first();

    if (!candidate) {
      return {
        totalApplications: 0,
        applicationsByStatus,
        totalInterviewsScheduled: 0,
        totalInterviewsCompleted: 0,
      };
    }

    // 2. Aggregate applications
    const appRows = await db('applications')
      .where('candidate_id', candidate.id)
      .select('status', db.raw('COUNT(id) as count'))
      .groupBy('status');

    let totalApplications = 0;
    for (const r of appRows) {
      const count = Number(r.count || 0);
      if (applicationsByStatus[r.status] !== undefined) {
        applicationsByStatus[r.status] = count;
      }
      totalApplications += count;
    }

    // 3. Aggregate interviews
    const interviewRows = await db('interviews')
      .join('applications', 'interviews.application_id', 'applications.id')
      .where('applications.candidate_id', candidate.id)
      .select('interviews.status', db.raw('COUNT(interviews.id) as count'))
      .groupBy('interviews.status');

    let totalInterviewsScheduled = 0;
    let totalInterviewsCompleted = 0;

    for (const r of interviewRows) {
      const count = Number(r.count || 0);
      if (r.status === 'SCHEDULED') {
        totalInterviewsScheduled = count;
      } else if (r.status === 'COMPLETED') {
        totalInterviewsCompleted = count;
      }
    }

    return {
      totalApplications,
      applicationsByStatus,
      totalInterviewsScheduled,
      totalInterviewsCompleted,
    };
  }

  /**
   * Admin: Platform-wide summary
   */
  async getAdminPlatformSummary() {
    // 1. Total users broken down by role
    let totalUsers = {
      total: 0,
      recruiters: 0,
      candidates: 0,
      admins: 0,
    };

    try {
      const hasUsersTable = await db.schema.hasTable('users');
      if (hasUsersTable) {
        const userRows = await db('users')
          .select('role', db.raw('COUNT(id) as count'))
          .groupBy('role');

        let total = 0;
        let recruiters = 0;
        let candidates = 0;
        let admins = 0;

        for (const r of userRows) {
          const count = Number(r.count || 0);
          total += count;
          if (r.role === 'RECRUITER') recruiters = count;
          else if (r.role === 'CANDIDATE') candidates = count;
          else if (r.role === 'ADMIN') admins = count;
        }

        totalUsers = { total, recruiters, candidates, admins };
      }
    } catch {
      // Fallback for isolated test DBs
    }

    // 2. Total non-deleted jobs
    const jobsRow = await db('jobs')
      .where('is_deleted', false)
      .count('id as count')
      .first();
    const totalJobs = Number(jobsRow?.count || 0);

    // 3. Total applications
    const appsRow = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.is_deleted', false)
      .count('applications.id as count')
      .first();
    const totalApplications = Number(appsRow?.count || 0);

    // 4. Total interviews
    const interviewsRow = await db('interviews')
      .count('id as count')
      .first();
    const totalInterviews = Number(interviewsRow?.count || 0);

    // 5. Platform-wide applicationsByStatus
    const appRows = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.is_deleted', false)
      .select('applications.status', db.raw('COUNT(applications.id) as count'))
      .groupBy('applications.status');

    const applicationsByStatus = initEmptyStatusBreakdown();
    for (const r of appRows) {
      const count = Number(r.count || 0);
      if (applicationsByStatus[r.status] !== undefined) {
        applicationsByStatus[r.status] = count;
      }
    }

    return {
      totalUsers,
      usersByRole: {
        recruiters: totalUsers.recruiters,
        candidates: totalUsers.candidates,
        admins: totalUsers.admins,
      },
      totalRecruiters: totalUsers.recruiters,
      totalCandidates: totalUsers.candidates,
      totalJobs,
      totalApplications,
      totalInterviews,
      applicationsByStatus,
    };
  }

  /**
   * Admin: Top recruiters ranked by total applications (or jobs)
   * Read-only join to users table for name/email (never passwords or hashes)
   * @param {{ limit?: number, sortBy?: 'applications'|'jobs' }} options
   */
  async getTopRecruiters({ limit = 10, sortBy = 'applications' } = {}) {
    // 1. Fetch recruiters with active jobs & applications
    const jobStats = await db('jobs')
      .where('jobs.is_deleted', false)
      .leftJoin('applications', 'applications.job_id', 'jobs.id')
      .select('jobs.recruiter_id as recruiterId')
      .countDistinct('jobs.id as jobsCount')
      .countDistinct('applications.id as applicationsCount')
      .groupBy('jobs.recruiter_id');

    const recruiterMap = new Map();
    for (const row of jobStats) {
      const id = Number(row.recruiterId);
      recruiterMap.set(id, {
        recruiterId: id,
        name: null,
        email: null,
        jobsCount: Number(row.jobsCount || 0),
        totalJobs: Number(row.jobsCount || 0),
        applicationsCount: Number(row.applicationsCount || 0),
        totalApplications: Number(row.applicationsCount || 0),
      });
    }

    // 2. If users table exists, attach name and email, and include any RECRUITER users with 0 jobs
    try {
      const hasUsersTable = await db.schema.hasTable('users');
      if (hasUsersTable) {
        const users = await db('users')
          .where('role', 'RECRUITER')
          .select('id', 'name', 'email');

        for (const u of users) {
          const id = Number(u.id);
          if (recruiterMap.has(id)) {
            const entry = recruiterMap.get(id);
            entry.name = u.name || null;
            entry.email = u.email || null;
          } else {
            recruiterMap.set(id, {
              recruiterId: id,
              name: u.name || null,
              email: u.email || null,
              jobsCount: 0,
              totalJobs: 0,
              applicationsCount: 0,
              totalApplications: 0,
            });
          }
        }

        // For any recruiterId in jobs not returned by role = RECRUITER (e.g. mock test IDs)
        const missingUserIds = Array.from(recruiterMap.keys()).filter((id) => !recruiterMap.get(id).email);
        if (missingUserIds.length > 0) {
          const fallbackUsers = await db('users')
            .whereIn('id', missingUserIds)
            .select('id', 'name', 'email');
          for (const fu of fallbackUsers) {
            const entry = recruiterMap.get(Number(fu.id));
            if (entry) {
              entry.name = fu.name || null;
              entry.email = fu.email || null;
            }
          }
        }
      }
    } catch {
      // Fallback if users table is unavailable
    }

    const recruiters = Array.from(recruiterMap.values());

    // 3. Sort recruiters
    recruiters.sort((a, b) => {
      if (sortBy === 'jobs') {
        if (b.jobsCount !== a.jobsCount) return b.jobsCount - a.jobsCount;
        if (b.applicationsCount !== a.applicationsCount) return b.applicationsCount - a.applicationsCount;
      } else {
        // Default primary sort: applicationsCount descending
        if (b.applicationsCount !== a.applicationsCount) return b.applicationsCount - a.applicationsCount;
        if (b.jobsCount !== a.jobsCount) return b.jobsCount - a.jobsCount;
      }
      return a.recruiterId - b.recruiterId;
    });

    return recruiters.slice(0, limit);
  }
}

module.exports = new AnalyticsRepository();
