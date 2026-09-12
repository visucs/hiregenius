import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, useInView, animate } from 'framer-motion';
import {
  Users, Key, BarChart3, ShieldCheck,
  Briefcase, MessageSquare, ArrowRight,
  ChevronRight, Shield, AlertTriangle,
  Activity, Server, Cpu, Database,
  CheckCircle2, XCircle, Clock, TrendingUp,
  ArrowUpRight, Settings,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';

/* ─── Mock platform stats ────────────────────────────────────────
   TODO: Replace with GET /api/admin/platform-stats
──────────────────────────────────────────────────────────────── */
const MOCK_STATS = {
  totalRecruiters: 48,
  totalCandidates: 3824,
  jobsPlatformWide: 291,
  interviewsConducted: 1547,
};

/* ─── Mock system health ─────────────────────────────────────── */
const SYSTEM_HEALTH = [
  { label: 'API Gateway',      status: 'ok',   latency: '42ms'  },
  { label: 'Resume AI Engine', status: 'ok',   latency: '210ms' },
  { label: 'Interview AI',     status: 'warn', latency: '680ms' },
  { label: 'Database Cluster', status: 'ok',   latency: '8ms'   },
];

/* ─── Admin Quick Actions ────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Manage Users',        desc: 'Enable, disable or review all accounts', icon: Users,      to: '/admin/users',     color: '#6366f1', bg: 'rgba(99,102,241,0.10)'  },
  { label: 'Platform Analytics',  desc: 'View aggregated hiring metrics',          icon: BarChart3,  to: '/admin/analytics', color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)'  },
  { label: 'AI Provider Keys',    desc: 'Configure LLM API credentials',           icon: Key,        to: '/admin/api-keys',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)'  },
  { label: 'System Settings',     desc: 'Platform-wide configuration',             icon: Settings,   to: '/admin/settings',  color: '#10b981', bg: 'rgba(16,185,129,0.10)'  },
];

/* ─── Stat cards config ──────────────────────────────────────── */
const STAT_CARDS = [
  { key: 'totalRecruiters',     label: 'Total Recruiters',        icon: Users,       color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  trend: '+3 this week' },
  { key: 'totalCandidates',     label: 'Total Candidates',        icon: Briefcase,   color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)',  trend: '+124 new' },
  { key: 'jobsPlatformWide',    label: 'Jobs Platform-wide',      icon: Database,    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  trend: '+18 posted' },
  { key: 'interviewsConducted', label: 'Interviews Conducted',    icon: MessageSquare,color:'#10b981', bg: 'rgba(16,185,129,0.10)',  trend: '+91 today' },
];

/* ─── Time greeting ──────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ─── Animated counter ───────────────────────────────────────── */
const AnimatedCounter = ({ value, suffix = '' }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [display, setDisplay] = useState(0);
  const ran    = useRef(false);

  if (inView && !ran.current) {
    ran.current = true;
    animate(0, value, {
      duration: 1.4, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
  }
  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
};

/* ─── Framer variants ────────────────────────────────────────── */
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Admin color tokens (must match AdminShell identity) ─────── */
const ADMIN = {
  accent:     '#6366f1',
  accentSoft: 'rgba(99,102,241,0.10)',
  accentBorder:'rgba(99,102,241,0.22)',
  accentText: '#6366f1',
};

/* ═══════════════════════════════════════════════════════════════
   AdminDashboard
══════════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const user = useSelector(selectUser);

  return (
    <div className="dash-page">

      {/* ── Welcome Header ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
      >
        <div>
          {/* Role badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: ADMIN.accentText,
              background: ADMIN.accentSoft, padding: '3px 10px',
              borderRadius: 999, border: `1px solid ${ADMIN.accentBorder}`,
            }}>
              <Shield size={11} />
              Admin Console
            </span>
            {/* Live status */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, color: '#10b981',
              background: 'rgba(16,185,129,0.10)', padding: '3px 10px',
              borderRadius: 999, border: '1px solid rgba(16,185,129,0.22)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.22)' }} />
              All systems operational
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.1 }}>
            Platform Overview{user?.name ? ` — ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Real-time platform health across all recruiters and candidates.
          </p>
        </div>

        {/* Analytics CTA */}
        <Link
          to="/admin/analytics"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 14,
            background: `linear-gradient(135deg, #4f46e5, #7c3aed)`,
            fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(79,70,229,0.35)', flexShrink: 0,
            alignSelf: 'flex-start', transition: 'box-shadow 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(79,70,229,0.50)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          id="admin-dashboard-analytics"
        >
          <BarChart3 size={15} />
          View Analytics
          <ArrowUpRight size={14} />
        </Link>
      </motion.div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="dash-stat-grid"
      >
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, trend }) => (
          <motion.div
            key={key}
            variants={cardVariants}
            className="dashboard-card"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            {/* Top accent bar with matching color */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '18px 22px 20px' }}>
              {/* Icon + trend */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={19} style={{ color }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.10)', padding: '2px 8px', borderRadius: 999 }}>
                  {trend}
                </span>
              </div>
              {/* Value */}
              <p style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em', color, marginBottom: 4 }}>
                <AnimatedCounter value={MOCK_STATS[key]} />
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main content grid ────────────────────────────────── */}
      <div className="dash-grid-2">

        {/* ── Admin Quick Actions ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
          className="dashboard-card"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: ADMIN.accentSoft, border: `1px solid ${ADMIN.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={17} style={{ color: ADMIN.accent }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Admin Quick Actions</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Jump to key control panels</p>
            </div>
          </div>

          {/* Action rows */}
          <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_ACTIONS.map(({ label, desc, icon: Icon, to, color, bg }, idx) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 14,
                    background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
                    textDecoration: 'none', transition: 'all 0.16s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--step-inactive-bg)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  id={`admin-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</p>
                  </div>
                  <ArrowRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Right column ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="dashboard-card"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            {/* Top stripe — indigo */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Server size={17} style={{ color: ADMIN.accent }} />
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>System Health</h2>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                  background: 'rgba(16,185,129,0.10)', color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.20)',
                }}>
                  3/4 Healthy
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SYSTEM_HEALTH.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.20 + idx * 0.06 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 12,
                      background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
                    }}
                  >
                    {/* Status icon */}
                    <div style={{ flexShrink: 0 }}>
                      {item.status === 'ok'
                        ? <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                        : <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</p>
                    </div>
                    {/* Latency pill */}
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
                      background: item.status === 'ok' ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
                      color: item.status === 'ok' ? '#10b981' : '#f59e0b',
                      border: `1px solid ${item.status === 'ok' ? 'rgba(16,185,129,0.20)' : 'rgba(245,158,11,0.20)'}`,
                      flexShrink: 0,
                    }}>
                      {item.latency}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Platform Growth card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="dashboard-card"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            <div style={{ height: 3, background: 'linear-gradient(90deg, #0ea5e9, #6366f1)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <TrendingUp size={17} style={{ color: '#0ea5e9' }} />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Platform Growth</h3>
              </div>

              {[
                { label: 'Recruiter activation rate', value: 92, color: '#6366f1' },
                { label: 'Candidate completion rate',  value: 78, color: '#0ea5e9' },
                { label: 'AI interview success rate',  value: 85, color: '#10b981' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}%</span>
                  </div>
                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                    />
                  </div>
                </div>
              ))}

              <Link
                to="/admin/analytics"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, color: ADMIN.accent, fontWeight: 700, textDecoration: 'none', marginTop: 4,
                }}
              >
                Full analytics <ChevronRight size={13} />
              </Link>
            </div>
          </motion.div>

          {/* Phase note */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              border: `1px solid ${ADMIN.accentBorder}`, background: ADMIN.accentSoft,
            }}
          >
            <Activity size={16} style={{ color: ADMIN.accent, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Phase 2 coming:</strong>{' '}
              Full user management console, AI key rotation history, platform audit logs, and real-time system monitoring will be available here.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
