import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, useInView, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, CalendarDays, PlusCircle, Plus,
  ArrowRight, Clock, CheckCircle2, FileSearch, Sparkles,
  TrendingUp, Zap, BarChart3, Trophy, ArrowUpRight,
  Play, RefreshCw, AlertCircle, Award,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { selectUser } from '../../features/auth/authSlice';
import analyticsService from '../../services/analyticsService';

/* ─── Quick actions ───────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Post a New Job',     to: '/recruiter/jobs',             icon: PlusCircle, color: '#a3e635', bg: 'rgba(163,230,53,0.10)', primary: true },
  { label: 'View Candidates',   to: '/recruiter/candidates',       icon: Users,      color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
  { label: 'Screen Resumes',    to: '/recruiter/resume-screening', icon: FileSearch, color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
  { label: 'Candidate Ranking', to: '/recruiter/ranking',          icon: Trophy,     color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  { label: 'AI Interviews',     to: '/recruiter/ai-interview',     icon: Play,       color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
  { label: 'Full Analytics',    to: '/recruiter/analytics',        icon: BarChart3,  color: '#ec4899', bg: 'rgba(236,72,153,0.10)' },
];

/* ─── Date range options ─────────────────────────────────── */
const DATE_RANGES = [
  { label: 'Last 7 Days',  days: 7  },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'All Time',     days: null },
];

/* ─── Funnel stage visual colors ─────────────────────────── */
const STAGE_CONFIG = [
  { key: 'APPLIED',     label: 'Applied',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { key: 'SCREENING',   label: 'Screening',   color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#a3e635', bg: 'rgba(163,230,53,0.12)' },
  { key: 'INTERVIEW',   label: 'Interview',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'HIRED',       label: 'Hired',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'REJECTED',    label: 'Rejected',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
];

/* ─── Helpers ─────────────────────────────────────────────── */
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/* ─── Animated counter ────────────────────────────────────── */
const Counter = ({ to, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(0, to || 0, {
        duration: 1.0,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => setVal(Math.round(v)),
      });
      return () => controls.stop();
    }
    setVal(to || 0);
  }, [inView, to]);

  return <span ref={ref}>{(val || 0).toLocaleString()}{suffix}</span>;
};

/* ─── Card shell ──────────────────────────────────────────── */
const Card = ({ children, style = {}, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      overflow: 'hidden', ...style,
    }}
  >
    {children}
  </motion.div>
);

/* ─── Custom tooltip for trend chart ─────────────────────── */
const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0F1420',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10,
      padding: '8px 12px',
      color: '#F8FAFC',
      fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontWeight: 800, color: '#a3e635' }}>
        {payload[0].value} {payload[0].value === 1 ? 'application' : 'applications'}
      </p>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   RECRUITER DASHBOARD HOME — 100% REAL CORE API ANALYTICS
════════════════════════════════════════════════════════════ */
const RecruiterDashboardHome = () => {
  const user = useSelector(selectUser);

  // Filter state (days=null means All Time summary, 7/30/90 pass ?days=)
  const [selectedDays, setSelectedDays] = useState(30);

  // Backend data states
  const [summary, setSummary]             = useState(null);
  const [jobsBreakdown, setJobsBreakdown] = useState([]);
  const [trend, setTrend]                 = useState([]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Fetch real analytics data from Core API
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch summary with selected days filter
      // 2. Fetch jobs breakdown (ordered by applicationCount DESC)
      // 3. Fetch trend (using selectedDays or default 30)
      const trendDays = selectedDays || 30;
      const [sumRes, breakdownRes, trendRes] = await Promise.all([
        analyticsService.getRecruiterSummary(selectedDays),
        analyticsService.getRecruiterJobsBreakdown(),
        analyticsService.getRecruiterTrend(trendDays),
      ]);

      setSummary(sumRes?.data ?? null);
      setJobsBreakdown(breakdownRes?.data ?? []);
      setTrend(trendRes?.data ?? []);
    } catch (err) {
      console.error('[RecruiterDashboardHome] Analytics fetch error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load recruitment analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics from real API response
  const totalJobs = summary?.totalJobs ?? 0;
  const openJobs  = summary?.openJobs ?? 0;
  const closedJobs = summary?.closedJobs ?? 0;
  const totalApplications = summary?.totalApplications ?? 0;
  const totalInterviews = summary?.totalInterviewsScheduled ?? 0;

  // Pipeline counts from real summary response
  const rawStatus = summary?.applicationsByStatus ?? {};
  const statusCounts = useMemo(() => ({
    APPLIED: Number(rawStatus.APPLIED || 0),
    SCREENING: Number(rawStatus.SCREENING || 0),
    SHORTLISTED: Number(rawStatus.SHORTLISTED || 0),
    INTERVIEW: Number(rawStatus.INTERVIEW || 0),
    HIRED: Number(rawStatus.HIRED || 0),
    REJECTED: Number(rawStatus.REJECTED || 0),
  }), [rawStatus]);

  // Total candidates across active pipeline
  const activePipelineTotal = statusCounts.APPLIED + statusCounts.SCREENING + statusCounts.SHORTLISTED + statusCounts.INTERVIEW;

  // Format trend data for Recharts (e.g. "Sep 27")
  const chartData = useMemo(() => {
    return trend.map((item) => {
      let label = item.date;
      if (item.date) {
        const parts = item.date.split('-');
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
      return {
        date: label,
        rawDate: item.date,
        count: item.count,
      };
    });
  }, [trend]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ══════════════════════════════════════════════════════
          DARK HERO BAND
      ══════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 36px) 0',
      }}>
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        {/* Blobs */}
        <div style={{ position: 'absolute', top: -80, right: '20%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header row */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                  <Sparkles size={11} /> Recruiter Portal
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Core API Live
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                {greet()}, {user?.name?.split(' ')[0] ?? 'Recruiter'}! 👋
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(190,220,140,0.65)', lineHeight: 1.6 }}>
                Live recruitment telemetry aggregated directly across your jobs, applications, and scheduled interviews.
              </p>
            </div>

            {/* Actions: Date range selector + Post Job button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Date range filter tabs */}
              <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(107,138,58,0.25)' }}>
                {DATE_RANGES.map((r) => {
                  const isActive = selectedDays === r.days;
                  return (
                    <button
                      key={r.label}
                      id={`rec-range-${r.days || 'all'}`}
                      onClick={() => setSelectedDays(r.days)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                        background: isActive ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'transparent',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.60)',
                        boxShadow: isActive ? '0 2px 10px rgba(61,80,22,0.45)' : 'none',
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>

              {/* Refresh button */}
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={fetchDashboardData}
                disabled={loading}
                title="Refresh Analytics"
                style={{
                  minHeight: 38, minWidth: 38, borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(107,138,58,0.25)',
                  color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </motion.button>

              {/* Post Job CTA */}
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/recruiter/jobs"
                  id="rec-home-post-job"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '9px 18px', minHeight: 38, borderRadius: 12,
                    background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                    color: '#fff', fontSize: 13, fontWeight: 800,
                    boxShadow: '0 4px 20px rgba(61,80,22,0.60)',
                    border: '1px solid rgba(107,138,58,0.35)',
                    textDecoration: 'none', letterSpacing: '-0.01em',
                  }}
                >
                  <PlusCircle size={15} strokeWidth={2.5} />
                  Post Job
                  <ArrowUpRight size={13} />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 14, padding: '12px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={18} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600 }}>{error}</span>
              </div>
              <button
                onClick={fetchDashboardData}
                style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              HERO STAT CARDS (REAL Phase 5 Aggregations)
          ══════════════════════════════════════════════════════ */}
          <div className="rec-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>

            {/* Card 1: Total Jobs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: '20px 22px 24px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #60a5fa00, #60a5fa88, #60a5fa00)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(96,165,250,0.18)', border: '1px solid rgba(96,165,250,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={18} style={{ color: '#60a5fa' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={11} /> Real Data
                </span>
              </div>
              <p style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                {loading ? '...' : <Counter to={totalJobs} />}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>
                <span>Total Jobs Posted</span>
                <span style={{ color: '#4ade80', fontWeight: 600 }}>{openJobs} open • {closedJobs} closed</span>
              </div>
            </motion.div>

            {/* Card 2: Total Applications */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: '20px 22px 24px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #a78bfa00, #a78bfa88, #a78bfa00)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} style={{ color: '#a78bfa' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={10} /> {selectedDays ? `Last ${selectedDays}d` : 'All time'}
                </span>
              </div>
              <p style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                {loading ? '...' : <Counter to={totalApplications} />}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>
                <span>Total Applications</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {summary?.recent?.totalApplications ?? 0} in 30d • {summary?.allTime?.totalApplications ?? totalApplications} all-time
                </span>
              </div>
            </motion.div>

            {/* Card 3: Interviews Scheduled */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: '20px 22px 24px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #f59e0b00, #f59e0b88, #f59e0b00)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDays size={18} style={{ color: '#f59e0b' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={10} /> Real Data
                </span>
              </div>
              <p style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                {loading ? '...' : <Counter to={totalInterviews} />}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>
                <span>Interviews Scheduled</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {summary?.recent?.totalInterviewsScheduled ?? 0} in 30d • {summary?.allTime?.totalInterviewsScheduled ?? totalInterviews} all-time
                </span>
              </div>
            </motion.div>

            {/* Card 4: Shortlisted / In Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: '20px 22px 24px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #34d39900, #34d39988, #34d39900)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} style={{ color: '#34d399' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={10} /> Real Pipeline
                </span>
              </div>
              <p style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                {loading ? '...' : <Counter to={activePipelineTotal} />}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>
                <span>Active Candidates</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{statusCounts.HIRED} hired to date</span>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENT AREA
      ══════════════════════════════════════════════════════ */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Row A: Applications Trend Chart + Quick Actions ── */}
        <div className="rec-row-a" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>

          {/* Applications Trend Chart (GET /api/analytics/recruiter/trend) */}
          <Card delay={0.10}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(163,230,53,0.12)', border: '1px solid rgba(163,230,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={17} style={{ color: '#a3e635' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                    Applications Trend
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    Daily applicant volume over the last {selectedDays || 30} days (zero-filled)
                  </p>
                </div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '2px 8px', borderRadius: 999 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live Trend
              </span>
            </div>

            <div style={{ padding: '20px 16px 12px' }}>
              {loading ? (
                <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading application trend...</p>
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <BarChart3 size={32} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No application trend data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="recAppGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Applications"
                      stroke="#a3e635"
                      strokeWidth={2.5}
                      fill="url(#recAppGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card delay={0.16}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: '#a3e635' }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>Quick Actions</p>
            </div>
            <div style={{ padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_ACTIONS.map(({ label, to, icon: Icon, color, bg, primary }, i) => (
                <motion.div key={label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, delay: 0.20 + i * 0.04 }}>
                  <Link
                    to={to}
                    id={`rec-home-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11,
                      padding: primary ? '11px 14px' : '9px 14px', borderRadius: 12,
                      textDecoration: 'none',
                      background: primary ? 'linear-gradient(135deg, #2d4010, #4a6b25)' : 'var(--card-row-bg)',
                      border: primary ? '1px solid rgba(107,138,58,0.30)' : '1px solid var(--card-row-border)',
                      boxShadow: primary ? '0 4px 16px rgba(61,80,22,0.30)' : 'none',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: primary ? 'rgba(163,230,53,0.15)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} style={{ color: primary ? '#a3e635' : color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: primary ? 700 : 600, color: primary ? '#e5f5c8' : 'var(--text-primary)', flex: 1 }}>{label}</span>
                    <ArrowRight size={13} style={{ color: primary ? 'rgba(163,230,53,0.5)' : 'var(--text-muted)', flexShrink: 0 }} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row B: Per-Job Breakdown Table + Hiring Pipeline Funnel ── */}
        <div className="rec-row-b" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

          {/* Per-Job Breakdown Table (GET /api/analytics/recruiter/jobs-breakdown) */}
          <Card delay={0.20}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(107,138,58,0.14)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={17} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                    Per-Job Application Breakdown
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    Sorted by candidate traction (applications received descending)
                  </p>
                </div>
              </div>
              <Link to="/recruiter/jobs" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ padding: '12px 16px' }}>
              {loading ? (
                <div style={{ padding: '36px 0', textAlign: 'center' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading per-job analytics...</p>
                </div>
              ) : jobsBreakdown.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <Briefcase size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No jobs posted yet</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Create your first job listing to start receiving candidate applications.</p>
                  <Link
                    to="/recruiter/jobs"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                  >
                    <Plus size={13} /> Post First Job
                  </Link>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>JOB TITLE</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>STATUS</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textAlign: 'right' }}>APPLICATIONS</th>
                        <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textAlign: 'right' }}>INTERVIEWS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobsBreakdown.map((j) => (
                        <tr
                          key={j.jobId}
                          style={{
                            borderBottom: '1px solid var(--card-row-border)',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{j.title}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>ID #{j.jobId}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <span
                              style={{
                                fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
                                background: j.status === 'OPEN' ? 'rgba(52,211,153,0.14)' : 'rgba(239,68,68,0.14)',
                                color: j.status === 'OPEN' ? '#10b981' : '#ef4444',
                              }}
                            >
                              {j.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                              <Users size={13} style={{ color: 'var(--primary)' }} />
                              {j.applicationCount}
                            </span>
                          </td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                              <CalendarDays size={13} style={{ color: '#f59e0b' }} />
                              {j.interviewCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Hiring Pipeline Funnel (applicationsByStatus from summary) */}
          <Card delay={0.24}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(163,230,53,0.10)', border: '1px solid rgba(163,230,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={17} style={{ color: '#a3e635' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                    Hiring Pipeline Funnel
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    Candidate distribution across all 6 stages
                  </p>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 8px', borderRadius: 999 }}>
                {totalApplications} Total
              </span>
            </div>

            <div style={{ padding: '16px 20px 20px' }}>
              {loading ? (
                <div style={{ padding: '36px 0', textAlign: 'center' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading pipeline breakdown...</p>
                </div>
              ) : totalApplications === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Pipeline is Empty</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No candidate applications have been received yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {STAGE_CONFIG.map((stage) => {
                    const count = statusCounts[stage.key] || 0;
                    const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
                    return (
                      <div key={stage.key}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {stage.label}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: stage.color }}>
                            {count} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</span>
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              borderRadius: 999,
                              background: stage.color,
                              transition: 'width 0.6s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1023px) {
          .rec-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .rec-row-a { grid-template-columns: 1fr !important; }
          .rec-row-b { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .rec-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default RecruiterDashboardHome;
