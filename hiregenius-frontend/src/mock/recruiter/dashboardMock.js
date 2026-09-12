/**
 * Mock data for Recruiter Dashboard Home.
 * TODO: replace with GET /api/recruiter/dashboard/summary
 *
 * Shape mirrors DashboardSummaryDTO from Architecture.md:
 * {
 *   totalJobs: number,
 *   totalCandidates: number,
 *   pendingInterviews: number,
 *   avgResumeScore: number,
 *   recentActivity: Activity[]
 * }
 */

export const MOCK_DASHBOARD_SUMMARY = {
  totalJobs: 12,
  totalCandidates: 148,
  pendingInterviews: 7,
  avgResumeScore: 76,
};

/**
 * Activity shape: { id, type, message, timestamp, avatarInitials }
 * TODO: replace with GET /api/recruiter/activity?limit=10
 */
export const MOCK_ACTIVITY = [
  {
    id: 'act-001',
    type: 'APPLICATION',
    message: 'New application to Backend Developer',
    timestamp: '2026-09-02T04:30:00Z',
    avatarInitials: 'RS',
  },
  {
    id: 'act-002',
    type: 'INTERVIEW_COMPLETE',
    message: 'Interview completed for Priya S.',
    timestamp: '2026-09-02T03:15:00Z',
    avatarInitials: 'PS',
  },
  {
    id: 'act-003',
    type: 'SCREENING',
    message: 'Resume screened for ML Engineer role — Score: 84',
    timestamp: '2026-09-01T22:00:00Z',
    avatarInitials: 'AK',
  },
  {
    id: 'act-004',
    type: 'APPLICATION',
    message: 'New application to Product Manager',
    timestamp: '2026-09-01T20:45:00Z',
    avatarInitials: 'VN',
  },
  {
    id: 'act-005',
    type: 'SHORTLISTED',
    message: 'Candidate Rahul M. shortlisted for Frontend Engineer',
    timestamp: '2026-09-01T18:00:00Z',
    avatarInitials: 'RM',
  },
];
