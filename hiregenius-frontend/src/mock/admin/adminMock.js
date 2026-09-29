/**
 * UserDTO for User Management page (retained until User Management phase).
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
    email: 'admin.mock@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-07-01T00:00:00Z',
    lastLoginAt: '2026-09-02T05:50:00Z',
  },
];
