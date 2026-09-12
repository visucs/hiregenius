/**
 * Mock data for Candidate Ranking Page.
 * TODO: replace with GET /api/recruiter/ranking?jobId={jobId}
 *
 * RankedCandidateDTO:
 * {
 *   rank: number,
 *   candidateId: string,
 *   candidateName: string,
 *   matchScore: number,
 *   aiReasoning: string,
 *   resumeScore: number,
 *   interviewScore: number | null,
 * }
 */

export const MOCK_RANKINGS = {
  'job-001': [
    {
      rank: 1,
      candidateId: 'cand-001',
      candidateName: 'Priya Sharma',
      matchScore: 92,
      aiReasoning:
        'Strong Java & Spring Boot background with 4 years at Flipkart. Exceptional PostgreSQL and Docker expertise matches job requirements almost perfectly.',
      resumeScore: 89,
      interviewScore: 84,
    },
    {
      rank: 2,
      candidateId: 'cand-006',
      candidateName: 'Kiran Reddy',
      matchScore: 71,
      aiReasoning:
        'Solid Java developer with good Spring Boot exposure. Missing Docker and Redis experience, which are key for this role, reduces overall match.',
      resumeScore: 68,
      interviewScore: null,
    },
    {
      rank: 3,
      candidateId: 'cand-004',
      candidateName: 'Vikram Nair',
      matchScore: 43,
      aiReasoning:
        'Primarily PHP/Laravel stack — minimal overlap with Java/PostgreSQL requirements. Not recommended for this role without retraining.',
      resumeScore: 58,
      interviewScore: null,
    },
  ],
  'job-002': [
    {
      rank: 1,
      candidateId: 'cand-002',
      candidateName: 'Rahul Mehra',
      matchScore: 78,
      aiReasoning:
        'Good React and Redux skills. Lacks TypeScript and Tailwind CSS experience explicitly listed in JD. Strong candidate with some upskilling needed.',
      resumeScore: 75,
      interviewScore: null,
    },
  ],
  'job-003': [
    {
      rank: 1,
      candidateId: 'cand-003',
      candidateName: 'Anjali Kumar',
      matchScore: 96,
      aiReasoning:
        'Outstanding fit. IISc M.Tech + Google AI research + 2 years production ML. Covers all listed skills except GCP, which is quickly learnable.',
      resumeScore: 94,
      interviewScore: null,
    },
  ],
  'job-004': [
    {
      rank: 1,
      candidateId: 'cand-005',
      candidateName: 'Sneha Patel',
      matchScore: 85,
      aiReasoning:
        'IIM MBA with solid PM tenure at Meesho. Agile, JIRA, and Figma skills align well. Product Strategy expertise is implied but not explicitly evidenced.',
      resumeScore: 82,
      interviewScore: null,
    },
  ],
};
