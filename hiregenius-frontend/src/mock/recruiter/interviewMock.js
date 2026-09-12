/**
 * Mock data for AI Interview Page.
 * TODO: replace with GET /api/recruiter/interviews
 * TODO: POST /api/recruiter/interviews/generate  (generate interview for candidate)
 *
 * EligibleCandidateDTO:
 * {
 *   candidateId: string,
 *   candidateName: string,
 *   jobId: string,
 *   jobTitle: string,
 *   resumeScore: number,
 *   interviewStatus: 'PENDING' | 'GENERATED' | 'COMPLETED',
 * }
 *
 * InterviewResultDTO:
 * {
 *   interviewId: string,
 *   candidateId: string,
 *   questions: Question[],
 *   evaluation: EvaluationDTO,
 * }
 */

export const MOCK_INTERVIEW_CANDIDATES = [
  {
    candidateId: 'cand-001',
    candidateName: 'Priya Sharma',
    jobId: 'job-001',
    jobTitle: 'Senior Backend Developer',
    resumeScore: 89,
    interviewStatus: 'COMPLETED',
  },
  {
    candidateId: 'cand-003',
    candidateName: 'Anjali Kumar',
    jobId: 'job-003',
    jobTitle: 'ML Engineer',
    resumeScore: 94,
    interviewStatus: 'GENERATED',
  },
  {
    candidateId: 'cand-002',
    candidateName: 'Rahul Mehra',
    jobId: 'job-002',
    jobTitle: 'Frontend Engineer (React)',
    resumeScore: 75,
    interviewStatus: 'PENDING',
  },
  {
    candidateId: 'cand-005',
    candidateName: 'Sneha Patel',
    jobId: 'job-004',
    jobTitle: 'Product Manager',
    resumeScore: 82,
    interviewStatus: 'PENDING',
  },
];

/** Mock interview result shown after "Generate Interview" */
export const MOCK_INTERVIEW_RESULT = {
  interviewId: 'int-001',
  candidateId: 'cand-001',
  questions: [
    {
      id: 'q1',
      text: 'Explain the difference between optimistic and pessimistic locking in PostgreSQL.',
      category: 'Technical',
    },
    {
      id: 'q2',
      text: 'How would you design a rate-limiter service using Redis?',
      category: 'System Design',
    },
    {
      id: 'q3',
      text: 'Describe a time when you debugged a critical production issue. What was your approach?',
      category: 'Behavioral',
    },
    {
      id: 'q4',
      text: 'What is your experience with Spring Boot async processing and message queues?',
      category: 'Technical',
    },
    {
      id: 'q5',
      text: 'How do you ensure backward compatibility when deploying breaking API changes?',
      category: 'System Design',
    },
  ],
  evaluation: {
    communicationScore: 82,
    confidenceScore: 78,
    technicalScore: 91,
    overallScore: 84,
    recommendation: 'STRONG_YES',
    summary:
      'Priya demonstrated excellent technical depth in distributed systems and database management. Communication was clear and concise. Recommend proceeding to final round.',
  },
};
