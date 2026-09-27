import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  BarChart3, Users, Briefcase, Video, Star,
  TrendingUp, Award, ArrowUpRight, RefreshCw,
  AlertCircle, Shield, ChevronDown, CheckCircle2,
  ArrowUpDown, Filter,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { selectUserRole } from '../../features/auth/authSlice';
import analyticsService from '../../services/analyticsService';

/* ─── Funnel stages ───────────────────────────────────────── */
const FUNNEL_STAGES = [
  { key: 'APPLIED',     label: 'Applied',     color: '#818cf8' },
  { key: 'SCREENING',   label: 'Screening',   color: '#22d3ee' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#a78bfa' },
  { key: 'INTERVIEW',   label: 'Interview',   color: '#f59e0b' },
  { key: 'HIRED',       label: 'Hired',       color: '#4ade80' },
  { key: 'REJECTED',    label: 'Rejected',    color: '#ef4444' },
];

/* ─── Animated counter ────────────────────────────────────── */
const Counter = ({ to, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (inView) {
      const ctrl = animate(0, to || 0, {
        duration: 1.0,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => setVal(Math.round(v)),
      });
      return () => ctrl.stop();
    }
    setVal(to || 0);
  }, [inView, to]);

  return <span ref={ref}>{(val || 0).toLocaleString()}{suffix}</span>;
};

/* ─── Custom tooltip for BarChart ────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0F1420', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '8px 12px', color: '#F8FAFC', fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Stage: {label}</p>
      <p style={{ margin: '4px 0 0', fontWeight: 800, color: '#38bdf8' }}>
        {payload[0].value} applications
      </p>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   ADMIN PLATFORM ANALYTICS PAGE — 100% REAL CORE API INTEGRATION
════════════════════════════════════════════════════════════ */
const AdminPlatformAnalyticsPage = () => {
  const role = useSelector(selectUserRole);

  // Sort state for top recruiters: 'applications' | 'jobs'
  const [sortBy, setSortBy] = useState('applications');

  // Backend state
  const [summary, setSummary]             = useState(null);
  const [topRecruiters, setTopRecruiters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Fetch real summary & top recruiters
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, topRes] = await Promise.all([
        analyticsService.getAdminSummary(),
        analyticsService.getAdminTopRecruiters({ sortBy }),
      ]);

      setSummary(sumRes?.data ?? null);
      setTopRecruiters(topRes?.data ?? []);
    } catch (err) {
      console.error('[AdminPlatformAnalyticsPage] Analytics query error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load platform analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Derived metrics from GET /api/analytics/admin/summary
  const totalUsers        = summary?.totalUsers?.total ?? (summary?.totalRecruiters ?? 0) + (summary?.totalCandidates ?? 0);
  const totalRecruiters   = summary?.totalRecruiters ?? summary?.totalUsers?.recruiters ?? 0;
  const totalCandidates   = summary?.totalCandidates ?? summary?.totalUsers?.candidates ?? 0;
  const totalAdmins       = summary?.totalUsers?.admins ?? 0;
  const totalJobs         = summary?.totalJobs ?? 0;
  const totalApplications = summary?.totalApplications ?? 0;
  const totalInterviews   = summary?.totalInterviews ?? 0;

  const rawStatus = summary?.applicationsByStatus ?? {};
  const funnelData = useMemo(() => {
    return FUNNEL_STAGES.map((s) => ({
      stage: s.label,
      key: s.key,
      count: Number(rawStatus[s.key] || 0),
      color: s.color,
    }));
  }, [rawStatus]);

  const hiredCount = Number(rawStatus.HIRED || 0);

  // Guard against non-admin rendering
  if (role && role !== 'ADMIN') {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-primary)' }}>
        <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Access Restricted</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          This analytics console is restricted to administrators.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Dark Indigo Hero ───────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)',
        padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                    <BarChart3 size={11} /> Platform Analytics
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Core API Live
                  </span>
                </div>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>
                  Platform Analytics
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)', margin: 0 }}>
                  Aggregated hiring intelligence across all recruiters, jobs, and candidates computed from source tables.
                </p>
              </div>

              {/* Refresh button */}
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={fetchAnalytics}
                disabled={loading}
                title="Refresh Analytics"
                style={{
                  minHeight: 38, minWidth: 38, borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(99,102,241,0.30)',
                  color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </motion.button>
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
                  onClick={fetchAnalytics}
                  style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Snapshot Stat Cards */}
            <div className="admin-analytics-snapshots" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, paddingBottom: 28 }}>
              {/* Card 1: Total Users */}
              <div style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18,
                padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #818cf800, #818cf888, #818cf800)' }} />
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(129,140,248,0.18)', border: '1px solid rgba(129,140,248,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Users size={16} style={{ color: '#818cf8' }} />
                </div>
                <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 5px' }}>
                  {loading ? '...' : <Counter to={totalUsers} />}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(196,200,255,0.7)', margin: '0 0 2px' }}>Total Registered Users</p>
                <p style={{ fontSize: 11, color: 'rgba(196,200,255,0.45)', margin: 0 }}>
                  {totalRecruiters} recruiters • {totalCandidates} candidates • {totalAdmins} admins
                </p>
              </div>

              {/* Card 2: Total Jobs */}
              <div style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18,
                padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #f59e0b00, #f59e0b88, #f59e0b00)' }} />
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Briefcase size={16} style={{ color: '#f59e0b' }} />
                </div>
                <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 5px' }}>
                  {loading ? '...' : <Counter to={totalJobs} />}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(196,200,255,0.7)', margin: '0 0 2px' }}>Platform-Wide Jobs</p>
                <p style={{ fontSize: 11, color: 'rgba(196,200,255,0.45)', margin: 0 }}>
                  Non-deleted listings across all recruiters
                </p>
              </div>

              {/* Card 3: Total Applications */}
              <div style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18,
                padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #22d3ee00, #22d3ee88, #22d3ee00)' }} />
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(34,211,238,0.18)', border: '1px solid rgba(34,211,238,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <TrendingUp size={16} style={{ color: '#22d3ee' }} />
                </div>
                <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 5px' }}>
                  {loading ? '...' : <Counter to={totalApplications} />}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(196,200,255,0.7)', margin: '0 0 2px' }}>Total Applications</p>
                <p style={{ fontSize: 11, color: 'rgba(196,200,255,0.45)', margin: 0 }}>
                  Received across active recruitment jobs
                </p>
              </div>

              {/* Card 4: Total Interviews */}
              <div style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18,
                padding: '18px 20px 22px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #4ade8000, #4ade8088, #4ade8000)' }} />
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Video size={16} style={{ color: '#4ade80' }} />
                </div>
                <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 5px' }}>
                  {loading ? '...' : <Counter to={totalInterviews} />}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(196,200,255,0.7)', margin: '0 0 2px' }}>Interviews Conducted</p>
                <p style={{ fontSize: 11, color: '#4ade80', margin: 0, fontWeight: 600 }}>
                  {hiredCount} candidates successfully hired
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content Area ──────────────────────────────── */}
      <div style={{ padding: 'clamp(20px, 3vw, 28px) clamp(16px, 4vw, 36px) 60px', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Top Recruiters Leaderboard (GET /api/analytics/admin/top-recruiters) ── */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)', borderRadius: '20px 20px 0 0' }} />
          <div style={{
            padding: '18px 24px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Top Recruiters Leaderboard
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                GET /api/analytics/admin/top-recruiters — ranked by candidate engagement & job volume
              </p>
            </div>

            {/* Sort Toggle: applications vs jobs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Rank by:</span>
              <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                <button
                  id="admin-sort-applications"
                  onClick={() => setSortBy('applications')}
                  style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                    background: sortBy === 'applications' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                    color: sortBy === 'applications' ? '#fff' : 'var(--text-secondary)',
                    boxShadow: sortBy === 'applications' ? '0 2px 8px rgba(79,70,229,0.35)' : 'none',
                  }}
                >
                  Applications
                </button>
                <button
                  id="admin-sort-jobs"
                  onClick={() => setSortBy('jobs')}
                  style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                    background: sortBy === 'jobs' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                    color: sortBy === 'jobs' ? '#fff' : 'var(--text-secondary)',
                    boxShadow: sortBy === 'jobs' ? '0 2px 8px rgba(79,70,229,0.35)' : 'none',
                  }}
                >
                  Jobs Posted
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 16px' }}>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: '#818cf8', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading recruiter rankings...</p>
              </div>
            ) : topRecruiters.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                <Award size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No Recruiters Found</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No recruiter accounts have posted jobs or received applications yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>RANK</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>RECRUITER</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textAlign: 'right' }}>TOTAL JOBS</th>
                      <th style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textAlign: 'right' }}>APPLICATIONS RECEIVED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRecruiters.map((r, index) => {
                      const isTop3 = index < 3;
                      const badgeColor = index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : null;
                      return (
                        <tr
                          key={r.recruiterId}
                          style={{ borderBottom: '1px solid var(--card-row-border)', transition: 'background 0.15s ease' }}
                        >
                          <td style={{ padding: '14px 14px', fontWeight: 800 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 24, height: 24, borderRadius: '50%',
                              background: badgeColor ? `${badgeColor}22` : 'var(--card-row-bg)',
                              color: badgeColor || 'var(--text-muted)',
                              fontSize: 11, border: badgeColor ? `1px solid ${badgeColor}44` : '1px solid var(--border)',
                            }}>
                              {index + 1}
                            </span>
                          </td>
                          <td style={{ padding: '14px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                {r.name || `Recruiter #${r.recruiterId}`}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {r.email || `recruiter_${r.recruiterId}@platform.local`}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                              <Briefcase size={13} style={{ color: '#f59e0b' }} />
                              {r.jobsCount}
                            </span>
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                              <Users size={13} style={{ color: '#818cf8' }} />
                              {r.applicationsCount}
                            </span>
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

        {/* ── Row: Platform-Wide Funnel BarChart + Role Breakdown ── */}
        <div className="admin-analytics-charts" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

          {/* Platform Application Funnel */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Platform-Wide Application Funnel
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Distribution of candidate applications across all 6 pipeline stages
              </p>
            </div>
            <div style={{ padding: '18px 16px 12px' }}>
              {loading ? (
                <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={22} className="animate-spin" style={{ color: '#818cf8' }} />
                </div>
              ) : totalApplications === 0 ? (
                <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <BarChart3 size={30} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No applications recorded on the platform</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {funnelData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* User Role Distribution Snapshot */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #22d3ee, #4ade80)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Platform Population Breakdown
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                Account distribution by user role
              </p>
            </div>
            <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Recruiters', count: totalRecruiters, color: '#818cf8', pct: totalUsers > 0 ? Math.round((totalRecruiters / totalUsers) * 100) : 0 },
                { label: 'Candidates', count: totalCandidates, color: '#22d3ee', pct: totalUsers > 0 ? Math.round((totalCandidates / totalUsers) * 100) : 0 },
                { label: 'Administrators', count: totalAdmins, color: '#4ade80', pct: totalUsers > 0 ? Math.round((totalAdmins / totalUsers) * 100) : 0 },
              ].map((roleItem) => (
                <div key={roleItem.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {roleItem.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: roleItem.color }}>
                      {roleItem.count} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>({roleItem.pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${roleItem.pct}%`,
                        borderRadius: 999,
                        background: roleItem.color,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              ))}

              <div style={{
                marginTop: 10, padding: '12px 14px', borderRadius: 12,
                background: 'var(--card-row-bg)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Accounts</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)' }}>{totalUsers}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .admin-analytics-snapshots { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-analytics-charts { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .admin-analytics-snapshots { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminPlatformAnalyticsPage;
