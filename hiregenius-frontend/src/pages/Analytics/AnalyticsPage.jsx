import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import {
  BarChart3, RefreshCw, Briefcase, Users, CalendarDays,
  Award, TrendingUp, AlertCircle, ChevronUp, CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import analyticsService from '../../services/analyticsService';

/* ─── Date range presets ─────────────────────────────────── */
const RANGE_OPTIONS = [
  { label: 'Last 7 Days',  days: 7    },
  { label: 'Last 30 Days', days: 30   },
  { label: 'Last 90 Days', days: 90   },
  { label: 'All Time',     days: null },
];

/* ─── Funnel stage visual colors ─────────────────────────── */
const STAGES = [
  { key: 'APPLIED',     label: 'Applied',     color: '#60a5fa' },
  { key: 'SCREENING',   label: 'Screening',   color: '#34d399' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#a3e635' },
  { key: 'INTERVIEW',   label: 'Interview',   color: '#f59e0b' },
  { key: 'HIRED',       label: 'Hired',       color: '#10b981' },
  { key: 'REJECTED',    label: 'Rejected',    color: '#ef4444' },
];

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

/* ─── Custom Recharts tooltips ───────────────────────────── */
const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0F1420', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '8px 12px', color: '#F8FAFC', fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontWeight: 800, color: '#a3e635' }}>
        {payload[0].value} {payload[0].value === 1 ? 'application' : 'applications'}
      </p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0F1420', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '8px 12px', color: '#F8FAFC', fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Stage: {label}</p>
      <p style={{ margin: '4px 0 0', fontWeight: 800, color: '#38bdf8' }}>
        {payload[0].value} candidates
      </p>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   RECRUITER ANALYTICS PAGE — 100% REAL CORE API INTEGRATION
════════════════════════════════════════════════════════════ */
const AnalyticsPage = () => {
  const [selectedDays, setSelectedDays] = useState(30);

  const [summary, setSummary]             = useState(null);
  const [trend, setTrend]                 = useState([]);
  const [jobsBreakdown, setJobsBreakdown] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trendDays = selectedDays || 30;
      const [sumRes, trendRes, jobsRes] = await Promise.all([
        analyticsService.getRecruiterSummary(selectedDays),
        analyticsService.getRecruiterTrend(trendDays),
        analyticsService.getRecruiterJobsBreakdown(),
      ]);

      setSummary(sumRes?.data ?? null);
      setTrend(trendRes?.data ?? []);
      setJobsBreakdown(jobsRes?.data ?? []);
    } catch (err) {
      console.error('[AnalyticsPage] Failed to fetch recruiter analytics:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load analytics data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived metrics
  const totalJobs         = summary?.totalJobs ?? 0;
  const openJobs          = summary?.openJobs ?? 0;
  const closedJobs        = summary?.closedJobs ?? 0;
  const totalApplications = summary?.totalApplications ?? 0;
  const totalInterviews   = summary?.totalInterviewsScheduled ?? 0;

  // Pipeline counts from summary
  const rawStatus = summary?.applicationsByStatus ?? {};
  const statusData = useMemo(() => {
    return STAGES.map((s) => ({
      stage: s.label,
      key: s.key,
      count: Number(rawStatus[s.key] || 0),
      color: s.color,
    }));
  }, [rawStatus]);

  const hiredCount = Number(rawStatus.HIRED || 0);

  // Format trend for Recharts
  const formattedTrend = useMemo(() => {
    return trend.map((t) => {
      let label = t.date;
      if (t.date) {
        const parts = t.date.split('-');
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
      return {
        date: label,
        count: t.count,
      };
    });
  }, [trend]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <BarChart3 size={11} /> Recruitment Insights
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live Analytics
                  </span>
                </div>
                <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>
                  Analytics & Reporting
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', margin: 0 }}>
                  Hiring pipeline volume, conversion rates, and per-job traction computed in real time.
                </p>
              </div>

              {/* Controls: Date range selector & Refresh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(107,138,58,0.25)' }}>
                  {RANGE_OPTIONS.map((r) => {
                    const isActive = selectedDays === r.days;
                    return (
                      <button
                        key={r.label}
                        id={`analytics-range-${r.days || 'all'}`}
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

                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={fetchData}
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
              </div>
            </div>

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
                  onClick={fetchData}
                  style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Stat Cards Grid */}
            <div className="analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, paddingBottom: 28 }}>
              {/* Card 1: Total Jobs */}
              <div style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18,
                padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #60a5fa00, #60a5fa88, #60a5fa00)' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(96,165,250,0.18)', border: '1px solid rgba(96,165,250,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={16} style={{ color: '#60a5fa' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '2px 8px', borderRadius: 999 }}>
                    Real Data
                  </span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 6px' }}>
                  {loading ? '...' : <Counter to={totalJobs} />}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(180,215,130,0.60)', fontWeight: 500 }}>
                  <span>Active & Closed Jobs</span>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>{openJobs} Open • {closedJobs} Closed</span>
                </div>
              </div>

              {/* Card 2: Applications */}
              <div style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18,
                padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #a78bfa00, #a78bfa88, #a78bfa00)' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} style={{ color: '#a78bfa' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '2px 8px', borderRadius: 999 }}>
                    {selectedDays ? `${selectedDays}d Window` : 'All Time'}
                  </span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 6px' }}>
                  {loading ? '...' : <Counter to={totalApplications} />}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(180,215,130,0.60)', fontWeight: 500 }}>
                  <span>Applications Received</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {summary?.recent?.totalApplications ?? 0} in 30d • {summary?.allTime?.totalApplications ?? totalApplications} total
                  </span>
                </div>
              </div>

              {/* Card 3: Interviews */}
              <div style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18,
                padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #f59e0b00, #f59e0b88, #f59e0b00)' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={16} style={{ color: '#f59e0b' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '2px 8px', borderRadius: 999 }}>
                    Real Data
                  </span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 6px' }}>
                  {loading ? '...' : <Counter to={totalInterviews} />}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(180,215,130,0.60)', fontWeight: 500 }}>
                  <span>Scheduled Interviews</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {summary?.recent?.totalInterviewsScheduled ?? 0} in 30d • {summary?.allTime?.totalInterviewsScheduled ?? totalInterviews} total
                  </span>
                </div>
              </div>

              {/* Card 4: Total Hires */}
              <div style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18,
                padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #34d39900, #34d39988, #34d39900)' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={16} style={{ color: '#34d399' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '2px 8px', borderRadius: 999 }}>
                    Hired
                  </span>
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 6px' }}>
                  {loading ? '...' : <Counter to={hiredCount} />}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(180,215,130,0.60)', fontWeight: 500 }}>
                  <span>Candidates Hired</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>
                    {totalApplications > 0 ? Math.round((hiredCount / totalApplications) * 100) : 0}% Conversion
                  </span>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* ── Content area ────────────────────────────────────── */}
      <div style={{ padding: 'clamp(20px, 3vw, 28px) clamp(16px, 4vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Charts Grid: Trend + Funnel BarChart ──────────── */}
        <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

          {/* Chart 1: Applications Over Time */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Daily Application Volume
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Chronological application receipts across the selected {selectedDays || 30}-day window
              </p>
            </div>
            <div style={{ padding: '18px 16px 12px' }}>
              {loading ? (
                <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
              ) : formattedTrend.length === 0 ? (
                <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <TrendingUp size={30} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No application trend data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={formattedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pageAppGrad" x1="0" y1="0" x2="0" y2="1">
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
                      stroke="#a3e635"
                      strokeWidth={2.5}
                      fill="url(#pageAppGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Applications by Pipeline Stage */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #38bdf8)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Hiring Pipeline Distribution
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Candidate distribution across all 6 recruitment stages
              </p>
            </div>
            <div style={{ padding: '18px 16px 12px' }}>
              {loading ? (
                <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
              ) : totalApplications === 0 ? (
                <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <Users size={30} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pipeline is currently empty</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {statusData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* ── Per-Job Breakdown Table ────────────────────────── */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Per-Job Recruitment Traction Breakdown
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                GET /api/analytics/recruiter/jobs-breakdown — ranked by candidate application volume
              </p>
            </div>
            <Link to="/recruiter/jobs" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Manage Jobs <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ padding: '12px 16px' }}>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading per-job analytics...</p>
              </div>
            ) : jobsBreakdown.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                <Briefcase size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No Jobs Posted Yet</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Create your first job listing to track per-job analytics.</p>
                <Link
                  to="/recruiter/jobs"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                >
                  Post First Job
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>JOB TITLE</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>STATUS</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textAlign: 'right' }}>APPLICATIONS</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textAlign: 'right' }}>INTERVIEWS</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textAlign: 'right' }}>CONVERSION RATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobsBreakdown.map((j) => {
                      const conversion = j.applicationCount > 0 ? Math.round((j.interviewCount / j.applicationCount) * 100) : 0;
                      return (
                        <tr
                          key={j.jobId}
                          style={{ borderBottom: '1px solid var(--card-row-border)' }}
                        >
                          <td style={{ padding: '14px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{j.title}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>ID #{j.jobId}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 14px' }}>
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
                          <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                              <Users size={13} style={{ color: 'var(--primary)' }} />
                              {j.applicationCount}
                            </span>
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                              <CalendarDays size={13} style={{ color: '#f59e0b' }} />
                              {j.interviewCount}
                            </span>
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: 800, color: conversion > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                            {conversion}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .analytics-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .analytics-charts-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .analytics-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;
