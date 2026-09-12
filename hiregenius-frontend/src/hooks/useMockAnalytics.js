/**
 * useMockAnalytics.js — Mock data hook for Analytics Dashboard.
 *
 * Why this exists: Backend (Spring Boot) is not yet built (Architecture.md Phase 2).
 * This hook returns realistic-looking data in the exact same shape the real
 * analyticsService will return so the UI can be built and tested now.
 *
 * Rules.md §8: mock data is CLEARLY LABELLED here. When the backend ships,
 * replace `useMockAnalytics` calls with real `analyticsService` calls.
 *
 * @param {string} range - "7d" | "30d" | "90d"
 */

import { useState, useEffect, useCallback } from 'react';

/* ── Deterministic mock generators per range ──────────────────────── */

const makeSummary = (range) => {
  const multiplier = range === '7d' ? 1 : range === '30d' ? 4 : 10;
  return {
    totalResumesScreened:    { value: 48 * multiplier,  trend: +12.4 },
    avgResumeScore:          { value: 76,               trend: +3.1 },
    totalInterviews:         { value: 21 * multiplier,  trend: +8.7 },
    interviewSuccessRate:    { value: 63,               trend: -2.5 },
    activeJobPostings:       { value: 7,                trend: 0 },
  };
};

const makeHiringTrend = (range) => {
  const days = range === '7d' ? 7 : range === '30d' ? 12 : 24;
  const labels = range === '7d'
    ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    : range === '30d'
      ? ['Jan W1','Jan W2','Jan W3','Jan W4','Feb W1','Feb W2','Feb W3','Feb W4','Mar W1','Mar W2','Mar W3','Mar W4']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return labels.slice(0, days).map((name, i) => ({
    name,
    applications: Math.round(8 + Math.sin(i * 0.8) * 5 + Math.random() * 4),
    hires:        Math.round(2 + Math.cos(i * 0.7) * 1.5 + Math.random() * 2),
  }));
};

const makeScoreDistribution = () => [
  { range: '0–20',  count: 4  },
  { range: '21–40', count: 12 },
  { range: '41–60', count: 28 },
  { range: '61–75', count: 45 },
  { range: '76–90', count: 61 },
  { range: '91–100',count: 18 },
];

const makeInterviewOutcomes = () => [
  { name: 'Highly Recommended', value: 38, color: '#22C55E' },
  { name: 'Consider',           value: 29, color: '#F59E0B' },
  { name: 'Not a Fit',          value: 33, color: '#EF4444' },
];

const makeSkillDistribution = () => [
  { skill: 'React',          count: 82 },
  { skill: 'Node.js',        count: 74 },
  { skill: 'Python',         count: 67 },
  { skill: 'Java',           count: 58 },
  { skill: 'TypeScript',     count: 55 },
  { skill: 'SQL',            count: 49 },
  { skill: 'AWS',            count: 43 },
  { skill: 'Docker',         count: 37 },
  { skill: 'Spring Boot',    count: 31 },
  { skill: 'GraphQL',        count: 24 },
];

const makeCandidatesPerJob = () => [
  { job: 'Frontend Dev',   count: 34 },
  { job: 'Backend Dev',    count: 28 },
  { job: 'Data Engineer',  count: 22 },
  { job: 'DevOps',         count: 19 },
  { job: 'UI/UX Designer', count: 15 },
  { job: 'PM',             count: 12 },
];

const makeRecentActivity = (search = '') => {
  const rows = [
    { id: 1, candidate: 'Priya Sharma',    job: 'Frontend Developer',    type: 'Resume',    score: 88, recommendation: 'Recommended',  date: '2026-09-01' },
    { id: 2, candidate: 'Ravi Kumar',      job: 'Backend Engineer',       type: 'Interview', score: 87, recommendation: 'Recommended',  date: '2026-09-01' },
    { id: 3, candidate: 'Aisha Patel',     job: 'Data Engineer',          type: 'Resume',    score: 72, recommendation: 'Consider',     date: '2026-08-31' },
    { id: 4, candidate: 'James Wilson',    job: 'DevOps Engineer',        type: 'Interview', score: 54, recommendation: 'Not a Fit',    date: '2026-08-31' },
    { id: 5, candidate: 'Sara Lee',        job: 'UI/UX Designer',         type: 'Resume',    score: 91, recommendation: 'Recommended',  date: '2026-08-30' },
    { id: 6, candidate: 'Mohamed Hassan',  job: 'Frontend Developer',     type: 'Interview', score: 67, recommendation: 'Consider',     date: '2026-08-30' },
    { id: 7, candidate: 'Neha Gupta',      job: 'Backend Engineer',       type: 'Resume',    score: 83, recommendation: 'Recommended',  date: '2026-08-29' },
    { id: 8, candidate: 'Chris Brown',     job: 'Data Engineer',          type: 'Resume',    score: 41, recommendation: 'Not a Fit',    date: '2026-08-29' },
    { id: 9, candidate: 'Yuki Tanaka',     job: 'Frontend Developer',     type: 'Interview', score: 79, recommendation: 'Consider',     date: '2026-08-28' },
    { id: 10,candidate: 'Fatima Al-Zahra', job: 'Product Manager',        type: 'Resume',    score: 92, recommendation: 'Recommended',  date: '2026-08-28' },
  ];
  if (!search) return rows;
  const q = search.toLowerCase();
  return rows.filter(r =>
    r.candidate.toLowerCase().includes(q) ||
    r.job.toLowerCase().includes(q) ||
    r.type.toLowerCase().includes(q) ||
    r.recommendation.toLowerCase().includes(q),
  );
};

/* ── Hook ─────────────────────────────────────────────────────────── */

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const useMockAnalytics = (range) => {
  const [summary,           setSummary]           = useState(null);
  const [hiringTrend,       setHiringTrend]       = useState(null);
  const [scoreDistribution, setScoreDistribution] = useState(null);
  const [interviewOutcomes, setInterviewOutcomes] = useState(null);
  const [skillDistribution, setSkillDistribution] = useState(null);
  const [candidatesPerJob,  setCandidatesPerJob]  = useState(null);
  const [recentActivity,    setRecentActivity]    = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await delay(800); // simulate network latency
      setSummary(makeSummary(range));
      setHiringTrend(makeHiringTrend(range));
      setScoreDistribution(makeScoreDistribution());
      setInterviewOutcomes(makeInterviewOutcomes());
      setSkillDistribution(makeSkillDistribution());
      setCandidatesPerJob(makeCandidatesPerJob());
      setRecentActivity(makeRecentActivity());
    } catch (e) {
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return {
    summary, hiringTrend, scoreDistribution, interviewOutcomes,
    skillDistribution, candidatesPerJob, recentActivity,
    loading, error, refetch: load,
    makeRecentActivity, // expose for live search filter
  };
};

export default useMockAnalytics;
