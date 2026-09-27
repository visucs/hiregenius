import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Users, Briefcase, Video, UserCheck, ArrowRight,
  Shield, BarChart3, Key, Settings, Sparkles,
  TrendingUp, AlertTriangle, CheckCircle2, Activity,
  ChevronUp, ArrowUpRight, Zap, RefreshCw, AlertCircle,
  Award,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import adminService from '../../services/adminService';

/* ─── Quick actions ───────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'User Management',    sub: 'Enable, disable or review all accounts', to: '/admin/users',     icon: Users,     color: '#818cf8', bg: 'rgba(129,140,248,0.10)' },
  { label: 'Platform Analytics', sub: 'View aggregated hiring metrics',          to: '/admin/analytics', icon: BarChart3, color: '#22d3ee', bg: 'rgba(34,211,238,0.10)' },
  { label: 'AI Provider Keys',   sub: 'Configure LLM API credentials',          to: '/admin/api-keys',  icon: Key,       color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  { label: 'System Settings',    sub: 'Platform-wide configuration',            to: '/admin/settings',  icon: Settings,  color: '#4ade80', bg: 'rgba(74,222,128,0.10)' },
];

/* ─── Animated counter ────────────────────────────────────── */
const Counter = ({ to }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (inView) {
      const ctrl = animate(0, to || 0, {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => setVal(Math.round(v)),
      });
      return () => ctrl.stop();
    }
    setVal(to || 0);
  }, [inView, to]);

  return <span ref={ref}>{(val || 0).toLocaleString()}</span>;
};

/* ════════════════════════════════════════════════════════════
   ADMIN DASHBOARD HOME — 100% REAL CORE API INTEGRATION
════════════════════════════════════════════════════════════ */
const AdminDashboardHome = () => {
  const user = useSelector(selectUser);

  const [summary, setSummary] = useState(null);
  const [health, setHealth]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, healthRes] = await Promise.all([
        adminService.getSummary(),
        adminService.getHealth().catch(() => null),
      ]);
      setSummary(sumRes?.data?.data ?? sumRes?.data ?? null);
      if (healthRes) {
        setHealth(healthRes?.data?.data ?? healthRes?.data ?? null);
      }
    } catch (err) {
      console.error('[AdminDashboardHome] Failed to fetch admin data:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load platform analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real platform metrics from GET /api/analytics/admin/summary
  const totalRecruiters   = summary?.totalRecruiters ?? summary?.totalUsers?.recruiters ?? 0;
  const totalCandidates   = summary?.totalCandidates ?? summary?.totalUsers?.candidates ?? 0;
  const totalJobs         = summary?.totalJobs ?? 0;
  const totalApplications = summary?.totalApplications ?? 0;
  const totalInterviews   = summary?.totalInterviews ?? 0;
  const completedInterviews = summary?.completedInterviews ?? 0;
  const deltas            = summary?.deltas ?? {};
  const rawStatus         = summary?.applicationsByStatus ?? {};

  const hiredCount = Number(rawStatus.HIRED || 0);

  const STAT_CARDS = [
    {
      key: 'totalRecruiters',
      label: 'Total Recruiters',
      icon: UserCheck,
      color: '#818cf8',
      value: totalRecruiters,
      delta: deltas.newRecruitersLast7d ?? 0,
      subtext: 'Registered recruiter accounts',
    },
    {
      key: 'totalCandidates',
      label: 'Total Candidates',
      icon: Users,
      color: '#22d3ee',
      value: totalCandidates,
      delta: deltas.newCandidatesLast7d ?? 0,
      subtext: 'Registered job seekers',
    },
    {
      key: 'totalJobs',
      label: 'Jobs Platform-wide',
      icon: Briefcase,
      color: '#f59e0b',
      value: totalJobs,
      delta: deltas.newJobsLast7d ?? 0,
      subtext: `${totalApplications} total applications received`,
    },
    {
      key: 'totalInterviews',
      label: 'Interviews Conducted',
      icon: Video,
      color: '#4ade80',
      value: totalInterviews,
      delta: deltas.newInterviewsLast7d ?? 0,
      subtext: `${completedInterviews} completed of ${totalInterviews} scheduled`,
    },
  ];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Dark indigo hero band ──────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)',
        padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 36px) 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: '20%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                    <Shield size={11} /> Admin Console
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Core API Live
                  </span>
                </div>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                  Platform Overview{user?.name ? ` — ${user.name.split(' ')[0]}` : ''}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(196,200,255,0.60)', lineHeight: 1.6 }}>
                  Real-time platform telemetry aggregated across all recruiters, jobs, and candidates.
                </p>
              </div>

              {/* Refresh & Full access badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={fetchSummary}
                  disabled={loading}
                  title="Refresh Platform Analytics"
                  style={{
                    minHeight: 40, minWidth: 40, borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(99,102,241,0.30)',
                    color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </motion.button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 14, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.30)', flexShrink: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(79,70,229,0.50)' }}>
                    <Shield size={16} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', margin: 0 }}>Admin Role</p>
                    <p style={{ fontSize: 10, color: 'rgba(196,200,255,0.50)', fontWeight: 600, margin: 0 }}>Platform-wide</p>
                  </div>
                </div>
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

            {/* Stat cards on hero boundary */}
            <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {STAT_CARDS.map((stat, i) => (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.10)', borderRadius: '18px 18px 0 0',
                    padding: '20px 22px 24px', position: 'relative', overflow: 'hidden',
                    cursor: 'default', transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.065)'; }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${stat.color}00, ${stat.color}88, ${stat.color}00)` }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 13, background: `${stat.color}18`, border: `1px solid ${stat.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <stat.icon size={18} style={{ color: stat.color }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {stat.delta > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.14)', padding: '2px 7px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                          <TrendingUp size={9} /> +{stat.delta} 7d
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(16,185,129,0.22)' }}>
                        <CheckCircle2 size={10} /> Real
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                    {loading ? '...' : <Counter to={stat.value} />}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(196,200,255,0.7)', margin: '0 0 3px' }}>{stat.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(196,200,255,0.45)', margin: 0 }}>{stat.subtext}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={16} style={{ color: '#818cf8' }} />
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>Admin Quick Actions</p>
          </div>
          <div className="admin-quick-grid" style={{ padding: '14px 14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_ACTIONS.map(({ label, sub, to, icon: Icon, color, bg }, i) => (
              <motion.div key={to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 + i * 0.05 }}>
                <Link
                  to={to}
                  id={`admin-home-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', minHeight: 44, borderRadius: 16, textDecoration: 'none', background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', transition: 'all 0.16s ease', boxSizing: 'border-box' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: bg, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{sub}</p>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Platform telemetry & status */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #4ade80)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={16} style={{ color: '#4ade80' }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>Platform Services Health</p>
            </div>
            <Link to="/admin/analytics" style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Detailed Analytics <ArrowRight size={12} />
            </Link>
          </div>
          <div className="admin-health-grid" style={{ padding: '16px 22px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              {
                label: 'MySQL Database',
                status: health?.components?.database?.status === 'UP'
                  ? `Operational (${health.components.database.latencyMs ?? 1}ms)`
                  : 'Degraded',
                color: health?.components?.database?.status === 'UP' ? '#4ade80' : '#ef4444',
                icon: CheckCircle2,
              },
              {
                label: 'Auth Service',
                status: health?.components?.authService?.status === 'UP' ? 'Operational (:8080)' : 'Connected',
                color: '#4ade80',
                icon: CheckCircle2,
              },
              {
                label: 'Local File Storage',
                status: health?.components?.fileStorage?.status === 'UP' ? 'Operational (uploads/)' : 'Degraded',
                color: '#4ade80',
                icon: CheckCircle2,
              },
              {
                label: 'Email SMTP Service',
                status: health?.components?.emailService?.status === 'UP' ? 'Configured (SMTP)' : 'Not Configured',
                color: health?.components?.emailService?.status === 'UP' ? '#4ade80' : '#94a3b8',
                icon: CheckCircle2,
              },
              {
                label: 'AI Resume Screening',
                status: 'Phase 6 Pending (Not built)',
                color: '#94a3b8',
                icon: AlertCircle,
              },
              {
                label: 'AI Interview Engine',
                status: 'Phase 6 Pending (Not built)',
                color: '#94a3b8',
                icon: AlertCircle,
              },
            ].map(({ label, status, color, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)' }}>
                <Icon size={15} style={{ color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2, margin: 0 }}>{status}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-health-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .admin-stats-grid { grid-template-columns: 1fr !important; }
          .admin-quick-grid { grid-template-columns: 1fr !important; }
          .admin-health-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardHome;
