/**
 * candidateMock.js — Mock data for Candidate Portal pages.
 *
 * Entity shapes match Spring Boot DTO specs (Architecture.md & PRD.md).
 * Every fetch point in the components includes:
 *   // TODO: replace with GET /api/candidate/...
 */

export const MOCK_CANDIDATE_APPLICATIONS = [
  {
    id: 'app-101',
    jobTitle: 'Senior Frontend Engineer',
    company: 'Stripe Technologies',
    location: 'Remote · San Francisco, CA',
    appliedDate: '2026-08-28',
    status: 'INTERVIEW', // APPLIED | SCREENING | INTERVIEW | OFFER | REJECTED
    resumeScore: 92,
    jobDescriptionSnippet:
      'We are looking for a Senior Frontend Engineer proficient in React, TypeScript, state management, and building high-performance design systems for enterprise SaaS applications.',
    interviewStatus: 'Completed · 88% Score (Recommended)',
    scoreBreakdown: {
      skillsMatch: 92,
      matchedSkills: ['React', 'TypeScript', 'Redux', 'TailwindCSS', 'Jest'],
      missingSkills: ['GraphQL', 'WebAssembly'],
      experienceMatch: 95,
      educationMatch: 90,
      projectsMatch: 88,
    },
    timeline: [
      { stage: 'Applied', date: 'Aug 28, 2026', completed: true, current: false },
      { stage: 'Screened', date: 'Aug 29, 2026', completed: true, current: false },
      { stage: 'Interviewed', date: 'Sep 02, 2026', completed: true, current: true },
      { stage: 'Decision Pending', date: 'Expected Sep 10', completed: false, current: false },
    ],
  },
  {
    id: 'app-102',
    jobTitle: 'Full Stack Engineer',
    company: 'Vercel Inc.',
    location: 'Remote · New York, NY',
    appliedDate: '2026-08-25',
    status: 'OFFER',
    resumeScore: 95,
    jobDescriptionSnippet:
      'Architect and build real-time developer web tools using React, Next.js, Node.js, and serverless edge functions with zero latency requirements.',
    interviewStatus: 'Completed · 94% Score (Highly Recommended)',
    scoreBreakdown: {
      skillsMatch: 96,
      matchedSkills: ['Next.js', 'React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      missingSkills: ['Kubernetes'],
      experienceMatch: 94,
      educationMatch: 92,
      projectsMatch: 96,
    },
    timeline: [
      { stage: 'Applied', date: 'Aug 25, 2026', completed: true, current: false },
      { stage: 'Screened', date: 'Aug 26, 2026', completed: true, current: false },
      { stage: 'Interviewed', date: 'Aug 30, 2026', completed: true, current: false },
      { stage: 'Offer Extended', date: 'Sep 04, 2026', completed: true, current: true },
    ],
  },
  {
    id: 'app-103',
    jobTitle: 'Lead Product Designer & Developer',
    company: 'Figma',
    location: 'Hybrid · San Francisco, CA',
    appliedDate: '2026-08-20',
    status: 'SCREENING',
    resumeScore: 84,
    jobDescriptionSnippet:
      'Bridge product design and web engineering. Build prototype tools, component libraries, and interactive design token systems.',
    interviewStatus: 'Invited · Scheduled for Sep 10',
    scoreBreakdown: {
      skillsMatch: 84,
      matchedSkills: ['Figma', 'React', 'CSS Modules', 'Design Systems'],
      missingSkills: ['WebGPU', 'C++'],
      experienceMatch: 86,
      educationMatch: 80,
      projectsMatch: 85,
    },
    timeline: [
      { stage: 'Applied', date: 'Aug 20, 2026', completed: true, current: false },
      { stage: 'Screening', date: 'Aug 22, 2026', completed: true, current: true },
      { stage: 'Interview', date: 'Scheduled Sep 10', completed: false, current: false },
      { stage: 'Decision', date: 'Pending', completed: false, current: false },
    ],
  },
  {
    id: 'app-104',
    jobTitle: 'UI/UX Frontend Specialist',
    company: 'Airbnb',
    location: 'Remote · Seattle, WA',
    appliedDate: '2026-08-15',
    status: 'APPLIED',
    resumeScore: 78,
    jobDescriptionSnippet:
      'Craft delightful booking flows and accessible design systems across web and mobile platforms with strict internationalization standards.',
    interviewStatus: 'N/A',
    scoreBreakdown: {
      skillsMatch: 78,
      matchedSkills: ['HTML5/CSS3', 'React', 'Accessibility (a11y)'],
      missingSkills: ['React Native', 'GraphQL', 'Swift'],
      experienceMatch: 80,
      educationMatch: 75,
      projectsMatch: 78,
    },
    timeline: [
      { stage: 'Applied', date: 'Aug 15, 2026', completed: true, current: true },
      { stage: 'Screened', date: 'Pending review', completed: false, current: false },
      { stage: 'Interview', date: 'Pending', completed: false, current: false },
      { stage: 'Decision', date: 'Pending', completed: false, current: false },
    ],
  },
  {
    id: 'app-105',
    jobTitle: 'Senior Software Engineer - Web Platform',
    company: 'Cloudflare',
    location: 'Remote · Austin, TX',
    appliedDate: '2026-08-10',
    status: 'REJECTED',
    resumeScore: 68,
    jobDescriptionSnippet:
      'Build edge cloud management applications in WebAssembly, Rust, and React with extreme sub-millisecond reliability standards.',
    interviewStatus: 'Not selected following initial resume screen',
    scoreBreakdown: {
      skillsMatch: 68,
      matchedSkills: ['React', 'JavaScript'],
      missingSkills: ['Rust', 'WebAssembly', 'Go', 'Linux Kernel'],
      experienceMatch: 70,
      educationMatch: 75,
      projectsMatch: 60,
    },
    timeline: [
      { stage: 'Applied', date: 'Aug 10, 2026', completed: true, current: false },
      { stage: 'Screened', date: 'Aug 12, 2026', completed: true, current: false },
      { stage: 'Decision', date: 'Aug 14, 2026 (Not selected)', completed: true, current: true },
    ],
  },
];

export const MOCK_CANDIDATE_INTERVIEWS = {
  upcoming: [
    {
      id: 'int-up-1',
      jobTitle: 'Lead Product Designer & Developer',
      company: 'Figma',
      scheduledDate: 'September 10, 2026',
      scheduledTime: '2:00 PM EST',
      duration: '45 mins',
      format: 'AI Interactive Voice/Text Session',
      status: 'SCHEDULED',
    },
    {
      id: 'int-up-2',
      jobTitle: 'Frontend Platform Specialist',
      company: 'Datadog',
      scheduledDate: 'September 14, 2026',
      scheduledTime: '11:00 AM EST',
      duration: '30 mins',
      format: 'AI Technical Screening',
      status: 'INVITED',
    },
  ],
  completed: [
    {
      id: 'int-comp-1',
      jobTitle: 'Senior Frontend Engineer',
      company: 'Stripe Technologies',
      dateTaken: 'September 02, 2026',
      overallRecommendation: 'RECOMMENDED', // RECOMMENDED | CONSIDER | NOT_A_FIT
      overallScore: 88,
      scores: {
        communication: 92,
        confidence: 86,
        technical: 88,
      },
      questions: [
        {
          num: 'Q1',
          question: 'Explain how you approach state management in a high-concurrency SaaS dashboard.',
          candidateAnswer:
            'I evaluate global state requirements carefully. For server state, I rely on React Query or RTK Query for automatic caching, revalidation, and optimistic updates. For local UI state, React hooks work best. Redux Toolkit provides clean immutable updates for shared workspace state.',
          aiNote: 'Excellent distinction between client and server state. Showed clear mastery of caching and state normalization.',
          score: 95,
        },
        {
          num: 'Q2',
          question: 'How do you optimize render performance when dealing with large datasets or dynamic tables?',
          candidateAnswer:
            'I implement windowing/virtualization using react-window or tanstack-table, memoize heavy computations with useMemo, and enforce memoization on list item components using React.memo with customized comparison functions.',
          aiNote: 'Solid technical depth. Correctly identified virtualization as the primary strategy for large list performance.',
          score: 88,
        },
        {
          num: 'Q3',
          question: 'Describe a situation where you had to debug a tricky React re-render issue in production.',
          candidateAnswer:
            'We noticed high latency on input typing in a complex form. I used React DevTools Profiler to trace unnecessary subtree renders caused by inline object references passed to context providers. Wrapping provider values in useMemo resolved it instantly.',
          aiNote: 'Demonstrated real-world practical debugging skills with concrete devtool metrics.',
          score: 90,
        },
      ],
      aiFeedback:
        'Candidate demonstrated strong technical mastery of React internal reconciliation, performance profiling, and modern state architectures. Communication was clear, structured, and confident.',
    },
    {
      id: 'int-comp-2',
      jobTitle: 'Full Stack Engineer',
      company: 'Vercel Inc.',
      dateTaken: 'August 30, 2026',
      overallRecommendation: 'RECOMMENDED',
      overallScore: 94,
      scores: {
        communication: 95,
        confidence: 92,
        technical: 96,
      },
      questions: [
        {
          num: 'Q1',
          question: 'What are the key trade-offs between Server Components (RSC) and Client Components in Next.js App Router?',
          candidateAnswer:
            'Server Components execute exclusively on the server, zeroing out client bundle size and allowing direct database access without expose API keys. Client Components enable interactivity, event listeners, and browser APIs.',
          aiNote: 'Flawless technical explanation. Clearly articulated bundle impact and security boundary advantages.',
          score: 98,
        },
        {
          num: 'Q2',
          question: 'Walk me through designing a fault-tolerant webhook processing consumer.',
          candidateAnswer:
            'I use an idempotent consumer with message queues (e.g. SQS/RabbitMQ). Each incoming webhook payload is validated, assigned an idempotency key stored in Redis/Postgres, processed asynchronously with automatic retry exponential backoff, and routed to a DLQ on permanent failure.',
          aiNote: 'Deep system design understanding covering idempotency, backoff retries, and dead-letter queues.',
          score: 94,
        },
      ],
      aiFeedback:
        'Exceptional performance across all technical criteria. The candidate exhibits senior-level architectural reasoning and concise, articulate technical communication.',
    },
    {
      id: 'int-comp-3',
      jobTitle: 'Senior Software Engineer - Web Platform',
      company: 'Cloudflare',
      dateTaken: 'August 12, 2026',
      overallRecommendation: 'CONSIDER',
      overallScore: 72,
      scores: {
        communication: 80,
        confidence: 70,
        technical: 68,
      },
      questions: [
        {
          num: 'Q1',
          question: 'How does WebAssembly interface with JavaScript memory buffers?',
          candidateAnswer:
            'WebAssembly operates on a linear memory ArrayBuffer shared with JS. Data is passed by pointer offsets rather than deep object copies.',
          aiNote: 'Basic theoretical understanding present, but lacked practical experience with Rust/wasm-bindgen tooling.',
          score: 70,
        },
      ],
      aiFeedback:
        'Strong web developer fundamentals, but lower score on WebAssembly low-level systems programming requirements specific to Cloudflare Workers internals.',
    },
  ],
};

export const MOCK_LATEST_RESUME_SCORE = {
  id: 'scan-2026-09-06',
  scanDate: 'September 06, 2026',
  jobTitle: 'Senior Frontend Engineer',
  targetCompany: 'Stripe / Enterprise SaaS',
  score: 88,
  recommendation: 'RECOMMENDED', // RECOMMENDED | CONSIDER | NOT_A_FIT
  skillsMatch: 92,
  matchedSkills: [
    'React 18',
    'TypeScript',
    'Redux Toolkit',
    'TailwindCSS',
    'Jest / RTL',
    'Vite / Webpack',
    'REST APIs',
    'Framer Motion',
  ],
  missingSkills: ['GraphQL', 'Kubernetes', 'Redis Caching'],
  extractedSummary: {
    experience: '5+ years as Frontend/Full Stack Developer across high-growth Tech & Fintech startups.',
    education: 'B.S. in Computer Science (GPA 3.8 / 4.0)',
    projects: 'Built high-throughput SaaS dashboards, design systems, and AI-assisted workflows.',
    certifications: 'AWS Certified Cloud Practitioner, Meta Frontend Developer Professional',
  },
  suggestions: [
    {
      id: 'sug-1',
      category: 'Impact Metrics',
      text: 'Add concrete performance numbers to your Stripe project bullet point (e.g. "Reduced initial bundle size by 38% and improved LCP by 1.2s").',
      impact: 'High',
    },
    {
      id: 'sug-2',
      category: 'Keyword Matching',
      text: 'Include mention of GraphQL or REST API query optimization techniques to match senior candidate benchmarks.',
      impact: 'High',
    },
    {
      id: 'sug-3',
      category: 'Formatting & Layout',
      text: 'Ensure all technology acronyms (AWS, CI/CD, RTL) are explicitly spelled out in key skills section for optimal ATS parser extraction.',
      impact: 'Medium',
    },
  ],
};

export const MOCK_SCAN_HISTORY = [
  {
    id: 'scan-001',
    scanDate: 'September 06, 2026',
    jobTitle: 'Senior Frontend Engineer',
    company: 'Stripe Technologies',
    score: 88,
    skillsMatch: 92,
    recommendation: 'RECOMMENDED',
    matchedSkills: ['React', 'TypeScript', 'Redux', 'TailwindCSS', 'Jest'],
    missingSkills: ['GraphQL', 'Kubernetes'],
    extractedSummary: {
      experience: '5+ years experience in React & TypeScript SaaS applications.',
      education: 'B.S. Computer Science',
      projects: 'HireGenius AI platform, Design System UI library',
      certifications: 'AWS Cloud Practitioner',
    },
    suggestions: [
      { id: '1', category: 'Metrics', text: 'Quantify lighthouse performance optimization results.', impact: 'High' },
      { id: '2', category: 'Keywords', text: 'Add GraphQL schema definition experience.', impact: 'Medium' },
    ],
  },
  {
    id: 'scan-002',
    scanDate: 'August 28, 2026',
    jobTitle: 'Full Stack Engineer',
    company: 'Vercel Inc.',
    score: 94,
    skillsMatch: 96,
    recommendation: 'RECOMMENDED',
    matchedSkills: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'TypeScript'],
    missingSkills: ['Docker'],
    extractedSummary: {
      experience: '4+ years building Next.js web applications and serverless APIs.',
      education: 'B.S. Computer Science',
      projects: 'Real-time collaborative markdown editor',
      certifications: 'Vercel Next.js Master Series',
    },
    suggestions: [
      { id: '1', category: 'Infrastructure', text: 'Mention Docker or containerization workflows.', impact: 'Medium' },
    ],
  },
  {
    id: 'scan-003',
    scanDate: 'August 18, 2026',
    jobTitle: 'Lead Product Designer & Developer',
    company: 'Figma',
    score: 82,
    skillsMatch: 84,
    recommendation: 'RECOMMENDED',
    matchedSkills: ['Figma', 'React', 'CSS Modules', 'Design Systems'],
    missingSkills: ['WebGPU', 'C++'],
    extractedSummary: {
      experience: '3+ years design system development and UX engineering.',
      education: 'B.S. Computer Science',
      projects: 'Enterprise token system and Figma plugin',
      certifications: 'UX Design Specialization',
    },
    suggestions: [
      { id: '1', category: 'Graphics', text: 'Add Canvas 2D or WebGL rendering experience if available.', impact: 'High' },
    ],
  },
  {
    id: 'scan-004',
    scanDate: 'August 08, 2026',
    jobTitle: 'Senior Software Engineer - Web Platform',
    company: 'Cloudflare',
    score: 68,
    skillsMatch: 68,
    recommendation: 'CONSIDER',
    matchedSkills: ['React', 'JavaScript'],
    missingSkills: ['Rust', 'WebAssembly', 'Go'],
    extractedSummary: {
      experience: 'General frontend engineering focus.',
      education: 'B.S. Computer Science',
      projects: 'Web management dashboard',
      certifications: 'None listed',
    },
    suggestions: [
      { id: '1', category: 'Low-Level Systems', text: 'Highlight any Rust or C/C++ background for edge runtimes.', impact: 'High' },
    ],
  },
];

export const MOCK_CANDIDATE_PROFILE = {
  id: 'cand-1',
  name: 'Arjun Mehta',
  email: 'arjun.mehta@example.com',
  isEmailVerified: true,
  phone: '+1 (555) 234-5678',
  title: 'Senior Frontend & Full Stack Developer',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  notifications: {
    statusEmail: true,
    interviewInviteEmail: true,
    resumeTipsEmail: false,
  },
};
