import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { animate } from 'framer-motion';
import {
  Users, Briefcase, Video, UserCheck, ArrowRight,
  Shield, BarChart3, Key, Settings, Sparkles,
  TrendingUp, AlertTriangle, CheckCircle2, Activity,
  ChevronUp, ArrowUpRight, Zap,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import { MOCK_ADMIN_SUMMARY } from '../../mock/admin/adminMock';

/* ─── Stat definitions ────────────────────────────────────── */
const STAT_DEFS = [
  { key: 'totalRecruiters',          label: 'Total Recruiters',      icon: UserCheck, color: '#818cf8', delta: '+3 this week'   },
  { key: 'totalCandidates',          label: 'Total Candidates',      icon: Users,     color: '#22d3ee', delta: '+48 this week'  },
  { key: 'totalJobsPlatformWide',    label: 'Jobs Platform-wide',    icon: Briefcase, color: '#f59e0b', delta: '+12 this month' },
  { key: 'totalInterviewsConducted', label: 'Interviews Conducted',  icon: Video,     color: '#4ade80', delta: '+87 this month' },
];

/* ─── Quick actions ───────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'User Management',      sub: 'Enable, disable or review all accounts',  to: '/admin/users',     icon: Users,    color: '#818cf8', bg: 'rgba(129,140,248,0.10)' },
  { label: 'Platform Analytics',   sub: 'View aggregated hiring metrics',           to: '/admin/analytics', icon: BarChart3,color: '#22d3ee', bg: 'rgba(34,211,238,0.10)'  },
  { label: 'AI Provider Keys',     sub: 'Configure LLM API credentials',           to: '/admin/api-keys',  icon: Key,      color: '#f59e0b', bg: 'rgba(245,158,11,0.10)'  },
  { label: 'System Settings',      sub: 'Platform-wide configuration',             to: '/admin/settings',  icon: Settings, color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  },
];

/* ─── Animated counter ────────────────────────────────────── */
const Counter = ({ to }) => {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
  }, [to]);
  return <span ref={ref}>{val}</span>;
};

/* ════════════════════════════════════════════════════════════
   ADMIN DASHBOARD HOME
════════════════════════════════════════════════════════════ */
const AdminDashboardHome = () => {
  const user    = useSelector(selectUser);
  const summary = MOCK_ADMIN_SUMMARY;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Dark indigo hero band ──────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)',
        padding: '36px 36px 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: '20%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                    <Shield size={11} /> Admin Console
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live
                  </span>
                </div>
                <h1 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                  Platform Overview{user?.name ? ` — ${user.name.split(' ')[0]}` : ''}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(196,200,255,0.60)', lineHeight: 1.6 }}>
                  Real-time platform health across all recruiters and candidates.
                </p>
              </div>

              {/* Full access badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 16, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.30)', flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(79,70,229,0.50)' }}>
                  <Shield size={17} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Admin Access</p>
                  <p style={{ fontSize: 10, color: 'rgba(196,200,255,0.50)', fontWeight: 600 }}>Full Control</p>
                </div>
              </div>
            </div>

            {/* Stat cards on hero boundary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {STAT_DEFS.map((stat, i) => (
                <motion.div key={stat.key}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '18px 18px 0 0', padding: '20px 22px 26px', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.065)'}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${stat.color}00, ${stat.color}88, ${stat.color}00)` }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 13, background: `${stat.color}18`, border: `1px solid ${stat.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <stat.icon size={18} style={{ color: stat.color }} />
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(16,185,129,0.22)' }}>
                      <ChevronUp size={9} /> {stat.delta}
                    </span>
                  </div>
                  <p style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                    <Counter to={summary[stat.key]} />
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(196,200,255,0.55)' }}>{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={16} style={{ color: '#818cf8' }} />
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Admin Quick Actions</p>
          </div>
          <div style={{ padding: '14px 14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_ACTIONS.map(({ label, sub, to, icon: Icon, color, bg }, i) => (
              <motion.div key={to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 + i * 0.05 }}>
                <Link to={to}
                  id={`admin-home-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, textDecoration: 'none', background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', transition: 'all 0.16s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.transform = 'translateX(0)'; }}
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

        {/* Platform health row */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #4ade80)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={16} style={{ color: '#4ade80' }} />
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Platform Health</p>
          </div>
          <div style={{ padding: '16px 22px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: 'AI Screening',   status: 'Operational', color: '#4ade80', icon: CheckCircle2 },
              { label: 'AI Interviews',  status: 'Operational', color: '#4ade80', icon: CheckCircle2 },
              { label: 'Email Service',  status: 'Operational', color: '#4ade80', icon: CheckCircle2 },
              { label: 'Auth Service',   status: 'Operational', color: '#4ade80', icon: CheckCircle2 },
              { label: 'Database',       status: 'Operational', color: '#4ade80', icon: CheckCircle2 },
              { label: 'File Storage',   status: 'Degraded',    color: '#f59e0b', icon: AlertTriangle },
            ].map(({ label, status, color, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)' }}>
                <Icon size={15} style={{ color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
                  <p style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>{status}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
