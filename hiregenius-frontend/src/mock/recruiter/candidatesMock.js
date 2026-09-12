/**
 * Mock data for Recruiter Candidates Page.
 * TODO: replace with GET /api/recruiter/candidates
 *
 * Shape mirrors CandidateDTO from Architecture.md:
 * {
 *   id: string,
 *   name: string,
 *   email: string,
 *   appliedJobId: string,
 *   appliedJobTitle: string,
 *   resumeScore: number,
 *   status: 'SCREENED' | 'INTERVIEWED' | 'SHORTLISTED' | 'REJECTED',
 *   appliedAt: string,
 *   resumeUrl: string | null,
 *   skills: string[],
 *   education: Education[],
 *   experience: Experience[],
 *   scoreBreakdown: ScoreBreakdown,
 * }
 */

export const MOCK_CANDIDATES = [
  {
    id: 'cand-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    appliedJobId: 'job-001',
    appliedJobTitle: 'Senior Backend Developer',
    resumeScore: 89,
    status: 'SHORTLISTED',
    appliedAt: '2026-08-25T10:20:00Z',
    resumeUrl: '/mock/resumes/priya_sharma.pdf',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Kafka'],
    education: [
      { degree: 'B.Tech Computer Science', institution: 'IIT Bombay', year: 2019 },
    ],
    experience: [
      { title: 'Backend Engineer', company: 'Flipkart', years: 4 },
      { title: 'Software Intern', company: 'Infosys', years: 1 },
    ],
    scoreBreakdown: {
      skillsMatch: 92,
      experienceMatch: 88,
      educationMatch: 85,
      keywordMatch: 91,
      overall: 89,
    },
  },
  {
    id: 'cand-002',
    name: 'Rahul Mehra',
    email: 'rahul.mehra@email.com',
    appliedJobId: 'job-002',
    appliedJobTitle: 'Frontend Engineer (React)',
    resumeScore: 75,
    status: 'SCREENED',
    appliedAt: '2026-08-26T08:45:00Z',
    resumeUrl: '/mock/resumes/rahul_mehra.pdf',
    skills: ['React', 'JavaScript', 'CSS', 'Redux'],
    education: [
      { degree: 'B.E. Information Technology', institution: 'VIT Vellore', year: 2021 },
    ],
    experience: [
      { title: 'Frontend Developer', company: 'Startup X', years: 2 },
    ],
    scoreBreakdown: {
      skillsMatch: 78,
      experienceMatch: 70,
      educationMatch: 72,
      keywordMatch: 80,
      overall: 75,
    },
  },
  {
    id: 'cand-003',
    name: 'Anjali Kumar',
    email: 'anjali.kumar@email.com',
    appliedJobId: 'job-003',
    appliedJobTitle: 'ML Engineer',
    resumeScore: 94,
    status: 'INTERVIEWED',
    appliedAt: '2026-08-15T12:00:00Z',
    resumeUrl: '/mock/resumes/anjali_kumar.pdf',
    skills: ['Python', 'PyTorch', 'Scikit-learn', 'NLP', 'FastAPI'],
    education: [
      { degree: 'M.Tech AI & ML', institution: 'IISc Bangalore', year: 2022 },
      { degree: 'B.Tech ECE', institution: 'NIT Warangal', year: 2020 },
    ],
    experience: [
      { title: 'ML Research Intern', company: 'Google AI', years: 1 },
      { title: 'Data Scientist', company: 'Analytics India', years: 2 },
    ],
    scoreBreakdown: {
      skillsMatch: 96,
      experienceMatch: 92,
      educationMatch: 95,
      keywordMatch: 93,
      overall: 94,
    },
  },
  {
    id: 'cand-004',
    name: 'Vikram Nair',
    email: 'vikram.nair@email.com',
    appliedJobId: 'job-001',
    appliedJobTitle: 'Senior Backend Developer',
    resumeScore: 58,
    status: 'REJECTED',
    appliedAt: '2026-08-22T14:30:00Z',
    resumeUrl: null,
    skills: ['PHP', 'MySQL', 'Laravel'],
    education: [
      { degree: 'B.Sc Computer Science', institution: 'MG University', year: 2018 },
    ],
    experience: [
      { title: 'Web Developer', company: 'Agency XYZ', years: 3 },
    ],
    scoreBreakdown: {
      skillsMatch: 48,
      experienceMatch: 60,
      educationMatch: 65,
      keywordMatch: 55,
      overall: 58,
    },
  },
  {
    id: 'cand-005',
    name: 'Sneha Patel',
    email: 'sneha.patel@email.com',
    appliedJobId: 'job-004',
    appliedJobTitle: 'Product Manager',
    resumeScore: 82,
    status: 'SCREENED',
    appliedAt: '2026-08-30T09:00:00Z',
    resumeUrl: '/mock/resumes/sneha_patel.pdf',
    skills: ['Product Management', 'Agile', 'JIRA', 'Figma', 'Data Analysis'],
    education: [
      { degree: 'MBA', institution: 'IIM Ahmedabad', year: 2021 },
    ],
    experience: [
      { title: 'Associate PM', company: 'Meesho', years: 3 },
    ],
    scoreBreakdown: {
      skillsMatch: 85,
      experienceMatch: 80,
      educationMatch: 88,
      keywordMatch: 75,
      overall: 82,
    },
  },
];
