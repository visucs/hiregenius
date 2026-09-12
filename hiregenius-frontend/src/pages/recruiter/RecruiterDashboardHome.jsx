import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, useInView, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Briefcase, Users, CalendarDays, Star,
  PlusCircle, ArrowRight, Clock, CheckCircle2,
  FileSearch, Sparkles, TrendingUp, Zap,
  BarChart3, Trophy, ArrowUpRight, ChevronUp,
  Play, Target, Bell,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import { MOCK_DASHBOARD_SUMMARY, MOCK_ACTIVITY } from '../../mock/recruiter/dashboardMock';

/* ─── Activity config ─────────────────────────────────────── */
const ACTIVITY_META = {
  APPLICATION:        { icon: FileSearch,   color: '#60a5fa', label: 'Application' },
  INTERVIEW_COMPLETE: { icon: CheckCircle2, color: '#34d399', label: 'Interview'   },
  SCREENING:          { icon: Star,         color: '#f59e0b', label: 'Screening'   },
  SHORTLISTED:        { icon: Sparkles,     color: '#a78bfa', label: 'Shortlisted' },
};

/* ─── Quick actions ───────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Post a New Job',      to: '/recruiter/jobs',             icon: PlusCircle,  color: '#a3e635', bg: 'rgba(163,230,53,0.10)',  primary: true  },
  { label: 'View Candidates',    to: '/recruiter/candidates',        icon: Users,       color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'                   },
  { label: 'Screen Resumes',     to: '/recruiter/resume-screening',  icon: FileSearch,  color: '#34d399', bg: 'rgba(52,211,153,0.10)'                   },
  { label: 'Candidate Ranking',  to: '/recruiter/ranking',           icon: Trophy,      color: '#f59e0b', bg: 'rgba(245,158,11,0.10)'                   },
  { label: 'AI Interviews',      to: '/recruiter/ai-interview',      icon: Play,        color: '#a78bfa', bg: 'rgba(167,139,250,0.10)'                   },
  { label: 'Analytics',          to: '/recruiter/analytics',         icon: BarChart3,   color: '#ec4899', bg: 'rgba(236,72,153,0.10)'                   },
];

/* ─── Stat definitions ────────────────────────────────────── */
const STAT_DEFS = [
  { key: 'totalJobs',        label: 'Total Jobs',          suffix: '',  icon: Briefcase,   color: '#60a5fa', delta: '+2', deltaLabel: 'this month'   },
  { key: 'totalCandidates',  label: 'Total Candidates',    suffix: '',  icon: Users,       color: '#a78bfa', delta: '+18', deltaLabel: 'this week'   },
  { key: 'pendingInterviews',label: 'Pending Interviews',  suffix: '',  icon: CalendarDays,color: '#f59e0b', delta: '7',   deltaLabel: 'due today'   },
  { key: 'avgResumeScore',   label: 'Avg Resume Score',    suffix: '%', icon: Star,        color: '#34d399', delta: '↑4', deltaLabel: 'pts'          },
];

/* ─── Helpers ─────────────────────────────────────────────── */
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const relativeTime = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* ─── Animated counter ────────────────────────────────────── */
const Counter = ({ to, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [val, setVal] = useState(0);
  const fired = useRef(false);
  if (inView && !fired.current) {
    fired.current = true;
    animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
  }
  return <span ref={ref}>{val}{suffix}</span>;
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

/* ════════════════════════════════════════════════════════════
   RECRUITER DASHBOARD HOME
════════════════════════════════════════════════════════════ */
const RecruiterDashboardHome = () => {
  const user     = useSelector(selectUser);
  const summary  = MOCK_DASHBOARD_SUMMARY;
  const activity = MOCK_ACTIVITY;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ══════════════════════════════════════════════════════
          DARK HERO BAND
      ══════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: '36px 36px 0',
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
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                  <Sparkles size={11} /> Recruiter Portal
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.20)', display: 'inline-block', animation: 'pulse 2s infinite' }} /> Live
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                {greet()}, {user?.name?.split(' ')[0] ?? 'Recruiter'}! 👋
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(190,220,140,0.65)', lineHeight: 1.6 }}>
                Here's your hiring snapshot — track, screen, and hire smarter.
              </p>
            </div>

            {/* Post Job CTA */}
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/recruiter/jobs"
                id="rec-home-post-job"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '12px 24px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  boxShadow: '0 6px 28px rgba(61,80,22,0.60)',
                  border: '1px solid rgba(107,138,58,0.35)',
                  textDecoration: 'none', letterSpacing: '-0.01em',
                }}
              >
                <PlusCircle size={16} strokeWidth={2.5} />
                Post New Job
                <ArrowUpRight size={14} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Stat cards — straddling hero/content boundary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {STAT_DEFS.map((stat, i) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '18px 18px 0 0', padding: '22px 22px 26px',
                  cursor: 'default', transition: 'background 0.2s', position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.065)'}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${stat.color}00, ${stat.color}88, ${stat.color}00)` }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 13, background: `${stat.color}18`, border: `1px solid ${stat.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <stat.icon size={18} style={{ color: stat.color }} />
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.14)', padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(16,185,129,0.22)' }}>
                    <ChevronUp size={10} /> {stat.delta} {stat.deltaLabel}
                  </span>
                </div>
                <p style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                  <Counter to={summary[stat.key]} suffix={stat.suffix} />
                </p>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENT AREA
      ══════════════════════════════════════════════════════ */}
      <div style={{ padding: '24px 36px 60px' }}>

        {/* ── Row A: Activity + Quick Actions ──────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* Recent Activity */}
          <Card delay={0.10}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #34d399)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={17} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Recent Activity</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '1px 7px', borderRadius: 999 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live feed
                  </span>
                </div>
              </div>
              <Link to="/recruiter/candidates" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div style={{ padding: '8px 12px 16px' }}>
              {activity.map((act, i) => {
                const meta = ACTIVITY_META[act.type] ?? ACTIVITY_META.APPLICATION;
                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, delay: 0.12 + i * 0.055 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'default', transition: 'background 0.13s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--card-row-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${meta.color}12`, border: `1px solid ${meta.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <meta.icon size={15} style={{ color: meta.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{act.message}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                        <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{relativeTime(act.timestamp)}</span>
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}22`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {meta.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card delay={0.16}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: '#a3e635' }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Quick Actions</p>
            </div>
            <div style={{ padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_ACTIONS.map(({ label, to, icon: Icon, color, bg, primary }, i) => (
                <motion.div key={label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, delay: 0.20 + i * 0.05 }}>
                  <Link
                    to={to}
                    id={`rec-home-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11,
                      padding: primary ? '12px 14px' : '10px 14px', borderRadius: 13,
                      textDecoration: 'none',
                      background: primary ? 'linear-gradient(135deg, #2d4010, #4a6b25)' : 'var(--card-row-bg)',
                      border: primary ? '1px solid rgba(107,138,58,0.30)' : '1px solid var(--card-row-border)',
                      boxShadow: primary ? '0 4px 16px rgba(61,80,22,0.30)' : 'none',
                      transition: 'all 0.16s ease',
                    }}
                    onMouseEnter={e => {
                      if (primary) { e.currentTarget.style.boxShadow = '0 6px 24px rgba(61,80,22,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }
                      else { e.currentTarget.style.background = 'var(--step-inactive-bg)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateX(4px)'; }
                    }}
                    onMouseLeave={e => {
                      if (primary) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(61,80,22,0.30)'; e.currentTarget.style.transform = 'translateY(0)'; }
                      else { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.transform = 'translateX(0)'; }
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: primary ? 'rgba(163,230,53,0.15)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} style={{ color: primary ? '#a3e635' : color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: primary ? 700 : 600, color: primary ? '#e5f5c8' : 'var(--text-primary)', flex: 1 }}>{label}</span>
                    <ArrowRight size={13} style={{ color: primary ? 'rgba(163,230,53,0.5)' : 'var(--text-muted)', flexShrink: 0 }} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row B: Pipeline overview (visual funnel) ──────── */}
        <Card delay={0.22}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635, #6B8A3A)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(163,230,53,0.10)', border: '1px solid rgba(163,230,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={17} style={{ color: '#a3e635' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Hiring Pipeline</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Real-time funnel across all active roles</p>
              </div>
            </div>
            <Link to="/recruiter/candidates" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Manage <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {[
                { label: 'Applied',      count: 148, width: 100, color: '#60a5fa', icon: Users       },
                { label: 'Screened',     count: 86,  width: 58,  color: '#a78bfa', icon: FileSearch  },
                { label: 'Shortlisted',  count: 34,  width: 23,  color: '#f59e0b', icon: Target      },
                { label: 'Interviewed',  count: 12,  width: 8,   color: '#34d399', icon: Play        },
                { label: 'Offered',      count: 3,   width: 2,   color: '#a3e635', icon: Trophy      },
              ].map((stage, i) => (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.26 + i * 0.07 }}
                  style={{ textAlign: 'center', padding: '16px 12px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--step-inactive-bg)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${stage.color}14`, border: `1px solid ${stage.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <stage.icon size={18} style={{ color: stage.color }} />
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 900, color: stage.color, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 4 }}>{stage.count}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>{stage.label}</p>
                  <div style={{ height: 5, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${stage.width}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.0, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}70)` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
    </div>
  );
};

export default RecruiterDashboardHome;
