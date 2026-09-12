/**
 * Mock data for Interview Scheduler Page.
 * TODO: replace with GET /api/recruiter/scheduler/interviews
 * TODO: POST /api/recruiter/scheduler/interviews  (schedule new)
 *
 * ScheduledInterviewDTO:
 * {
 *   id: string,
 *   candidateId: string,
 *   candidateName: string,
 *   jobId: string,
 *   jobTitle: string,
 *   scheduledAt: string (ISO 8601),
 *   durationMinutes: number,
 *   meetingLink: string,
 *   status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
 * }
 */

export const MOCK_SCHEDULED_INTERVIEWS = [
  {
    id: 'si-001',
    candidateId: 'cand-001',
    candidateName: 'Priya Sharma',
    jobId: 'job-001',
    jobTitle: 'Senior Backend Developer',
    scheduledAt: '2026-09-03T10:00:00Z',
    durationMinutes: 60,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    status: 'SCHEDULED',
  },
  {
    id: 'si-002',
    candidateId: 'cand-003',
    candidateName: 'Anjali Kumar',
    jobId: 'job-003',
    jobTitle: 'ML Engineer',
    scheduledAt: '2026-09-04T14:00:00Z',
    durationMinutes: 45,
    meetingLink: 'https://zoom.us/j/123456789',
    status: 'SCHEDULED',
  },
  {
    id: 'si-003',
    candidateId: 'cand-005',
    candidateName: 'Sneha Patel',
    jobId: 'job-004',
    jobTitle: 'Product Manager',
    scheduledAt: '2026-09-05T11:30:00Z',
    durationMinutes: 60,
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/xyz',
    status: 'SCHEDULED',
  },
  {
    id: 'si-004',
    candidateId: 'cand-002',
    candidateName: 'Rahul Mehra',
    jobId: 'job-002',
    jobTitle: 'Frontend Engineer (React)',
    scheduledAt: '2026-08-30T15:00:00Z',
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/zyx-abcd-123',
    status: 'COMPLETED',
  },
];
