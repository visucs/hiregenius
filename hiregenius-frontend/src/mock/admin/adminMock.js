/**
 * Mock data for Admin Dashboard.
 * TODO: replace with GET /api/admin/dashboard/summary
 *
 * AdminDashboardSummaryDTO:
 * {
 *   totalRecruiters: number,
 *   totalCandidates: number,
 *   totalJobsPlatformWide: number,
 *   totalInterviewsConducted: number,
 * }
 */

export const MOCK_ADMIN_SUMMARY = {
  totalRecruiters: 48,
  totalCandidates: 3824,
  totalJobsPlatformWide: 291,
  totalInterviewsConducted: 1547,
};

/**
 * UserDTO for User Management page.
 * TODO: replace with GET /api/admin/users?page=0&size=20
 * {
 *   id: string,
 *   name: string,
 *   email: string,
 *   role: 'RECRUITER' | 'CANDIDATE' | 'ADMIN',
 *   status: 'ACTIVE' | 'DISABLED',
 *   createdAt: string,
 *   lastLoginAt: string | null,
 * }
 */
export const MOCK_USERS = [
  {
    id: 'usr-001',
    name: 'Aisha Verma',
    email: 'aisha.verma@techcorp.com',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '2026-07-10T08:00:00Z',
    lastLoginAt: '2026-09-01T18:30:00Z',
  },
  {
    id: 'usr-002',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    createdAt: '2026-08-01T10:00:00Z',
    lastLoginAt: '2026-08-31T12:00:00Z',
  },
  {
    id: 'usr-003',
    name: 'Rahul Mehra',
    email: 'rahul.mehra@email.com',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    createdAt: '2026-08-10T11:00:00Z',
    lastLoginAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 'usr-004',
    name: 'Suresh Nair',
    email: 'suresh.nair@hiregroup.io',
    role: 'RECRUITER',
    status: 'DISABLED',
    createdAt: '2026-06-15T07:00:00Z',
    lastLoginAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 'usr-005',
    name: 'Meena Iyer',
    email: 'meena.iyer@startupx.in',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '2026-07-25T09:00:00Z',
    lastLoginAt: '2026-09-02T06:00:00Z',
  },
  {
    id: 'usr-006',
    name: 'Dev Admin',
    email: 'admin@hiregenius.ai',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-07-01T00:00:00Z',
    lastLoginAt: '2026-09-02T05:50:00Z',
  },
];

/**
 * Platform Analytics data (aggregated across all recruiters).
 * TODO: replace with GET /api/admin/analytics?range=30d
 */
export const MOCK_PLATFORM_ANALYTICS = {
  hiringTrend: [
    { month: 'Mar', applications: 180, hires: 14 },
    { month: 'Apr', applications: 240, hires: 22 },
    { month: 'May', applications: 310, hires: 31 },
    { month: 'Jun', applications: 420, hires: 44 },
    { month: 'Jul', applications: 530, hires: 58 },
    { month: 'Aug', applications: 680, hires: 72 },
    { month: 'Sep', applications: 720, hires: 80 },
  ],
  scoreDistribution: [
    { range: '0-20', count: 45 },
    { range: '21-40', count: 120 },
    { range: '41-60', count: 580 },
    { range: '61-80', count: 1840 },
    { range: '81-100', count: 1239 },
  ],
  topSkillsDemand: [
    { skill: 'Python', count: 380 },
    { skill: 'React', count: 340 },
    { skill: 'Java', count: 310 },
    { skill: 'SQL', count: 280 },
    { skill: 'AWS', count: 240 },
    { skill: 'Docker', count: 210 },
  ],
};
