import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, useInView, animate, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Users, CalendarDays, Star,
  ArrowUpRight, ChevronRight, Sparkles, BarChart3,
  Clock, CheckCircle2, TrendingUp, Zap, Plus,
  ArrowRight, Trophy, Target, Activity, Flame,
  MapPin, Timer, FileSearch, MessageSquare,
  ChevronUp, Eye, Send,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';

/* ══════════════════════════════════════════════════════════════
   MOCK DATA — replace with API calls
══════════════════════════════════════════════════════════════ */
const STATS = [
  { key: 'jobs',        label: 'Active Jobs',         value: 12,  suffix: '',  delta: '+2',   deltaLabel: 'this week', icon: Briefcase,    color: '#a3e635' },
  { key: 'candidates',  label: 'Total Candidates',    value: 148, suffix: '',  delta: '+14',  deltaLabel: 'new today', icon: Users,        color: '#60a5fa' },
  { key: 'interviews',  label: 'Interviews Pending',  value: 7,   suffix: '',  delta: '3',    deltaLabel: 'today',     icon: CalendarDays, color: '#fbbf24' },
  { key: 'score',       label: 'Avg Resume Score',    value: 76,  suffix: '%', delta: '↑4',   deltaLabel: 'pts',       icon: Star,         color: '#34d399' },
];

const PIPELINE = [
  { label: 'Applied',       count: 84, color: '#6366f1', width: 100 },
  { label: 'Screened',      count: 51, color: '#3D5016', width: 61  },
  { label: 'Interviewing',  count: 24, color: '#f59e0b', width: 29  },
  { label: 'Offer Sent',    count: 9,  color: '#10b981', width: 11  },
  { label: 'Hired',         count: 4,  color: '#4ade80', width: 5   },
];

const JOBS = [
  { id: 'j1', title: 'Senior Frontend Engineer', dept: 'Engineering', loc: 'Remote', apps: 38, newApps: 5,  days: 12, hot: true,  deptColor: '#6366f1' },
  { id: 'j2', title: 'Product Designer',          dept: 'Design',      loc: 'Hybrid', apps: 22, newApps: 2,  days: 8,  hot: false, deptColor: '#ec4899' },
  { id: 'j3', title: 'ML Engineer',               dept: 'AI/ML',       loc: 'Remote', apps: 51, newApps: 11, days: 20, hot: true,  deptColor: '#f59e0b' },
];

const INTERVIEWS = [
  { id: 'i1', name: 'Priya Sharma',   initials: 'PS', role: 'Frontend Eng',    time: 'Today · 3:00 PM',     score: 88, scoreColor: '#10b981' },
  { id: 'i2', name: 'Rahul Mehta',    initials: 'RM', role: 'ML Engineer',     time: 'Today · 5:30 PM',     score: 81, scoreColor: '#6366f1' },
  { id: 'i3', name: 'Anjali Kapoor',  initials: 'AK', role: 'Product Designer',time: 'Tomorrow · 11:00 AM', score: 76, scoreColor: '#f59e0b' },
];

const ACTIVITY = [
  { id: 'a1', text: 'New application — Backend Developer',   meta: 'Kavya Nair',     time: '9d ago',  tag: 'Application', tagColor: '#6366f1' },
  { id: 'a2', text: 'AI Interview completed — Priya S.',     meta: 'Score: 88/100',  time: '9d ago',  tag: 'Interview',   tagColor: '#10b981' },
  { id: 'a3', text: 'Resume screened — ML Engineer role',    meta: 'Score: 84/100',  time: '9d ago',  tag: 'Screening',   tagColor: '#f59e0b' },
  { id: 'a4', text: 'New application — Product Manager',     meta: 'Ananya Singh',   time: '10d ago', tag: 'Application', tagColor: '#6366f1' },
  { id: 'a5', text: 'Rahul M. shortlisted — Frontend Eng',  meta: 'Offer stage',    time: '10d ago', tag: 'Shortlisted', tagColor: '#4ade80' },
];

const HEALTH = [
  { label: 'Offer Acceptance',   value: 88, color: '#10b981', icon: CheckCircle2 },
  { label: 'Time to Hire',       value: 62, color: '#6366f1', icon: Timer        },
  { label: 'Pipeline Fill',      value: 74, color: '#f59e0b', icon: Target       },
  { label: 'Interview→Offer',    value: 41, color: '#ec4899', icon: Trophy       },
];

/* ══════════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════════ */
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/* Animated count-up */
const Counter = ({ to, suffix = '' }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [val, setVal] = useState(0);
  const fired = useRef(false);
  if (inView && !fired.current) {
    fired.current = true;
    animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
  }
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

/* Shared card wrapper */
const Card = ({ children, style = {}, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
    style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </motion.div>
);

/* Card section header */
const CardHead = ({ icon: Icon, iconColor = 'var(--primary)', title, subtitle, action, stripe }) => (
  <>
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `${iconColor}15`, border: `1px solid ${iconColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  </>
);

const ViewAll = ({ to, label = 'View all' }) => (
  <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
    {label} <ChevronRight size={13} />
  </Link>
);

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

/* ─── Hero Stat Card (on dark band) ─────────────────────────── */
const HeroStatCard = ({ stat, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: 'rgba(255,255,255,0.065)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '18px 18px 0 0',
      padding: '22px 22px 26px',
      cursor: 'default',
      transition: 'background 0.2s',
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.065)'}
  >
    {/* Subtle top accent */}
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
      <Counter to={stat.value} suffix={stat.suffix} />
    </p>
    <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)', letterSpacing: '0.01em' }}>{stat.label}</p>
  </motion.div>
);

/* ─── Pipeline Row ──────────────────────────────────────────── */
const PipelineRow = ({ stage, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35, delay: 0.14 + index * 0.055 }}
    style={{ marginBottom: index < PIPELINE.length - 1 ? 16 : 0 }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color, boxShadow: `0 0 0 3px ${stage.color}28`, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{stage.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: stage.color }}>{stage.count}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--card-row-bg)', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>{stage.width}%</span>
      </div>
    </div>
    <div style={{ height: 6, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${stage.width}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.0, delay: 0.2 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }}
      />
    </div>
  </motion.div>
);

/* ─── Interview Row ─────────────────────────────────────────── */
const InterviewRow = ({ item, index }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: 0.18 + index * 0.07 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 13,
      padding: '12px 14px', borderRadius: 14,
      background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
      cursor: 'pointer', transition: 'all 0.15s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--step-inactive-bg)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.transform = 'translateX(0)'; }}
  >
    <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #2d4010, #4a6b25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3e635', fontSize: 12, fontWeight: 800, boxShadow: '0 2px 8px rgba(61,80,22,0.35)' }}>
      {item.initials}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.name}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.role}</p>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
        <Clock size={9} /> {item.time}
      </p>
      <span style={{ fontSize: 11, fontWeight: 800, color: item.scoreColor, background: `${item.scoreColor}15`, padding: '2px 8px', borderRadius: 999, border: `1px solid ${item.scoreColor}28` }}>
        {item.score}
      </span>
    </div>
  </motion.div>
);

/* ─── Job Card ──────────────────────────────────────────────── */
const JobCard = ({ job, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.32, delay: 0.22 + index * 0.07 }}
    style={{
      padding: '16px 18px', borderRadius: 16, position: 'relative', overflow: 'hidden',
      background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
      cursor: 'pointer', transition: 'all 0.16s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--step-inactive-bg)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    {/* Left accent bar */}
    <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 999, background: job.deptColor }} />

    {job.hot && (
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.10)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.22)' }}>
        <Flame size={10} /> Hot
      </div>
    )}

    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 5, paddingRight: job.hot ? 52 : 0, paddingLeft: 10 }}>{job.title}</p>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13, paddingLeft: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: job.deptColor, background: `${job.deptColor}14`, padding: '2px 8px', borderRadius: 999 }}>{job.dept}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <MapPin size={9} /> {job.loc}
      </span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Users size={11} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{job.apps}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>applicants</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#3D5016', background: 'rgba(61,80,22,0.08)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(61,80,22,0.12)' }}>
        +{job.newApps} new
      </span>
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
        <Clock size={9} /> {job.days}d left
      </span>
    </div>
  </motion.div>
);

/* ─── Activity Row ──────────────────────────────────────────── */
const ActivityRow = ({ item, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.28, delay: 0.28 + index * 0.055 }}
    style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 12px', borderRadius: 12,
      cursor: 'default', transition: 'background 0.13s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--card-row-bg)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.tagColor, boxShadow: `0 0 0 3px ${item.tagColor}22`, marginTop: 5, flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.text}</p>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{item.meta} · {item.time}</p>
    </div>
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${item.tagColor}12`, color: item.tagColor, border: `1px solid ${item.tagColor}28`, flexShrink: 0 }}>
      {item.tag}
    </span>
  </motion.div>
);

/* ─── Quick Action Link ─────────────────────────────────────── */
const QuickAction = ({ label, icon: Icon, to, color, bg, primary, index }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.26, delay: 0.32 + index * 0.05 }}
  >
    <Link
      to={to}
      id={`rec-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: primary ? '13px 15px' : '11px 15px',
        borderRadius: 14, textDecoration: 'none',
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
      <div style={{ width: 34, height: 34, borderRadius: 10, background: primary ? 'rgba(163,230,53,0.15)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color: primary ? '#a3e635' : color }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: primary ? 700 : 600, color: primary ? '#e5f5c8' : 'var(--text-primary)', flex: 1, lineHeight: 1 }}>{label}</span>
      <ArrowRight size={13} style={{ color: primary ? 'rgba(163,230,53,0.5)' : 'var(--text-muted)', flexShrink: 0 }} />
    </Link>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════
   RECRUITER DASHBOARD — Main component
══════════════════════════════════════════════════════════════ */
const RecruiterDashboard = () => {
  const user = useSelector(selectUser);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ══════════════════════════════════════════════════════
          HERO BAND — dark forest, stat cards sit on it
      ══════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 50%, #0f1e06 100%)',
        padding: '36px 36px 0',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header row */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                  <Sparkles size={11} /> Recruiter Portal
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.20)', display: 'inline-block' }} /> Live
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                {greet()}, {user?.name?.split(' ')[0] ?? 'there'}! 👋
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(190,220,140,0.65)', lineHeight: 1.6 }}>
                Here's your hiring command center for today.
              </p>
            </div>

            {/* CTA */}
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/recruiter/jobs"
                id="rec-hero-cta"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '12px 24px', borderRadius: 14, textDecoration: 'none',
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  boxShadow: '0 6px 28px rgba(61,80,22,0.60)',
                  border: '1px solid rgba(107,138,58,0.35)',
                  letterSpacing: '-0.01em',
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Post New Job
                <ArrowUpRight size={14} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Stat cards — bleed into content area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {STATS.map((stat, i) => <HeroStatCard key={stat.key} stat={stat} index={i} />)}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENT AREA
      ══════════════════════════════════════════════════════ */}
      <div style={{ padding: '24px 36px 60px' }}>

        {/* ── Row A: Pipeline (wide) + Interviews ───────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* Hiring Pipeline */}
          <Card delay={0.08}>
            <CardHead icon={Target} iconColor="#3D5016" title="Hiring Pipeline" subtitle={`${PIPELINE[0].count} total candidates tracked`} action={<ViewAll to="/recruiter/candidates" />} />
            <div style={{ padding: '18px 22px 22px' }}>
              {PIPELINE.map((s, i) => <PipelineRow key={s.label} stage={s} index={i} />)}
            </div>
          </Card>

          {/* Upcoming Interviews */}
          <Card delay={0.13} style={{ display: 'flex', flexDirection: 'column' }}>
            <CardHead icon={Timer} iconColor="#6366f1" title="Upcoming Interviews" subtitle="3 sessions scheduled today" action={<ViewAll to="/recruiter/scheduler" label="Schedule" />} stripe="linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)" />
            <div style={{ padding: '12px 14px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {INTERVIEWS.map((item, i) => <InterviewRow key={item.id} item={item} index={i} />)}
            </div>
          </Card>
        </div>

        {/* ── Row B: Jobs (wide) + Activity + Quick Actions ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1.05fr 0.75fr', gap: 18, marginBottom: 18 }}>

          {/* Active Jobs */}
          <Card delay={0.18}>
            <CardHead icon={Briefcase} iconColor="#3D5016" title="Active Job Postings" subtitle="12 open positions" action={<ViewAll to="/recruiter/jobs" label="All jobs" />} />
            <div style={{ padding: '12px 14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {JOBS.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card delay={0.23} style={{ display: 'flex', flexDirection: 'column' }}>
            <CardHead
              icon={Activity}
              iconColor="#3D5016"
              title="Recent Activity"
              subtitle={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '1px 7px', borderRadius: 999 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live feed
                </span>
              }
            />
            <div style={{ flex: 1, padding: '8px 10px 16px', display: 'flex', flexDirection: 'column' }}>
              {ACTIVITY.map((item, i) => <ActivityRow key={item.id} item={item} index={i} />)}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card delay={0.28}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: '#a3e635' }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Quick Actions</p>
            </div>
            <div style={{ padding: '12px 12px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { label: 'Post a New Job',      icon: Plus,         to: '/recruiter/jobs',            color: '#3D5016', bg: 'rgba(61,80,22,0.10)',   primary: true  },
                { label: 'View Candidates',     icon: Users,        to: '/recruiter/candidates',       color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  primary: false },
                { label: 'Screen Resumes',      icon: FileSearch,   to: '/recruiter/resume-screening', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  primary: false },
                { label: 'Schedule Interview',  icon: CalendarDays, to: '/recruiter/scheduler',        color: '#10b981', bg: 'rgba(16,185,129,0.10)',  primary: false },
                { label: 'View Rankings',       icon: Trophy,       to: '/recruiter/ranking',          color: '#ec4899', bg: 'rgba(236,72,153,0.10)',  primary: false },
              ].map((a, i) => <QuickAction key={a.label} {...a} index={i} />)}
            </div>
          </Card>
        </div>

        {/* ── Row C: Health Metrics (full width) ─────────────── */}
        <Card delay={0.34}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635, #6B8A3A, #3D5016)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '18px 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={17} style={{ color: 'var(--primary)' }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Hiring Health Metrics</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Platform-wide performance this quarter</p>
                </div>
              </div>
              <Link to="/recruiter/analytics" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', padding: '7px 14px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--step-inactive-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card-row-bg)'; }}
              >
                <BarChart3 size={13} /> Full Analytics
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {HEALTH.map(({ label, value, color, icon: Icon }, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.36, delay: idx * 0.07 }}
                  style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', transition: 'all 0.15s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--step-inactive-bg)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}14`, padding: '2px 7px', borderRadius: 999 }}>Q3 2026</span>
                  </div>
                  <p style={{ fontSize: 34, fontWeight: 900, color, letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>{value}%</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>{label}</p>
                  <div style={{ height: 5, borderRadius: 999, background: `${color}18`, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.0, delay: 0.2 + idx * 0.08 }}
                      style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}77)` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
