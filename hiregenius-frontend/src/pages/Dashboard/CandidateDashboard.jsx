import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, useInView, animate, AnimatePresence } from 'framer-motion';
import {
  FileText, MessageSquare, Trophy, TrendingUp, Upload,
  Briefcase, ArrowRight, Sparkles, CheckCircle2, Clock,
  BarChart3, ChevronRight, Target, Zap, Star,
  ArrowUpRight, AlertCircle, Plus, BookOpen,
  Award, Flame, ChevronUp, Eye, Send, X,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import useResumeFileValidation from '../../hooks/useResumeFileValidation';

/* ══════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════ */
const MOCK_STATS = [
  { key: 'apps',       label: 'Applications',    value: 7,  suffix: '',  delta: '+2',  deltaLabel: 'this week',  icon: FileText,    color: '#60a5fa' },
  { key: 'interviews', label: 'AI Interviews',   value: 3,  suffix: '',  delta: '+1',  deltaLabel: 'new',        icon: MessageSquare, color: '#a78bfa' },
  { key: 'score',      label: 'Resume Score',    value: 82, suffix: '%', delta: '↑6',  deltaLabel: 'pts',        icon: Star,        color: '#34d399' },
  { key: 'pending',    label: 'Pending Actions', value: 2,  suffix: '',  delta: '!',   deltaLabel: 'urgent',     icon: AlertCircle, color: '#fbbf24' },
];

const APP_STAGES = [
  { label: 'Saved',        count: 4,  color: '#6366f1', width: 100 },
  { label: 'Applied',      count: 7,  color: '#60a5fa', width: 88  },
  { label: 'Interviewing', count: 2,  color: '#f59e0b', width: 29  },
  { label: 'Offer',        count: 1,  color: '#10b981', width: 14  },
];

const MOCK_JOBS = [
  { id: 'j1', title: 'Senior Frontend Engineer', company: 'TechCorp',    loc: 'Remote', match: 94, tag: 'Top Match',   tagColor: '#10b981', logo: 'TC' },
  { id: 'j2', title: 'Full Stack Developer',     company: 'StartupXYZ',  loc: 'Hybrid', match: 87, tag: 'New',         tagColor: '#6366f1', logo: 'SX' },
  { id: 'j3', title: 'React Developer',          company: 'FinanceHub',   loc: 'Remote', match: 81, tag: 'Closing soon',tagColor: '#f59e0b', logo: 'FH' },
];

const MOCK_ACTIVITY = [
  { id: 'a1', icon: Star,         text: 'Resume scored — Senior Frontend Eng',   meta: 'Score: 82/100',          time: '2h ago',  color: '#34d399' },
  { id: 'a2', icon: FileText,     text: 'Applied to Product Designer at Acme',   meta: 'Application submitted',  time: '1d ago',  color: '#60a5fa' },
  { id: 'a3', icon: MessageSquare,text: 'AI Interview: Full Stack Eng (TechStart)',meta: 'Score: 74/100',         time: '2d ago',  color: '#a78bfa' },
  { id: 'a4', icon: Briefcase,    text: 'Saved: Data Analyst at FinanceHub',      meta: 'Saved for later',       time: '3d ago',  color: '#f59e0b' },
  { id: 'a5', icon: Star,         text: 'Resume scored — UX Designer',            meta: 'Score: 61/100',         time: '5d ago',  color: '#ec4899' },
];

const QUICK_ACTIONS = [
  { label: 'New Resume Check',    icon: Upload,        to: '/candidate/resume-score',  color: '#34d399', bg: 'rgba(52,211,153,0.10)', primary: true  },
  { label: 'Start AI Interview',  icon: MessageSquare, to: '/candidate/interviews',    color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', primary: false },
  { label: 'Browse Jobs',         icon: Briefcase,     to: '/candidate/applications',  color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', primary: false },
  { label: 'My Scan History',     icon: BarChart3,     to: '/candidate/scan-history',  color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  primary: false },
];

/* ══════════════════════════════════════════════════════════════
   RESUME SCORE RING
══════════════════════════════════════════════════════════════ */
const ScoreRing = ({ score }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct  = score / 100;
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" viewBox="0 0 130 130" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <motion.circle
          cx="65" cy="65" r={r}
          fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - pct * circ }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1 }}>{score}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>/ 100</p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════════ */
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const Counter = ({ to, suffix = '' }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [val, setVal] = useState(0);
  const fired = useRef(false);
  if (inView && !fired.current) {
    fired.current = true;
    animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
  }
  return <span ref={ref}>{val}{suffix}</span>;
};

/* Shared card */
const Card = ({ children, style = {}, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      overflow: 'hidden', ...style,
    }}
  >
    {children}
  </motion.div>
);

const CardHead = ({ icon: Icon, iconColor = 'var(--primary)', title, subtitle, action, stripe }) => (
  <>
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `${iconColor}15`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
          {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  </>
);

const ViewAll = ({ to, label = 'View all' }) => (
  <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
    {label} <ChevronRight size={13} />
  </Link>
);

/* ══════════════════════════════════════════════════════════════
   CANDIDATE DASHBOARD — Main component
══════════════════════════════════════════════════════════════ */
const CandidateDashboard = () => {
  const user = useSelector(selectUser);
  const {
    file, fileInputRef, dragging,
    handleFileChange, handleDrop, handleDragOver, handleDragLeave,
    clearFile,
  } = useResumeFileValidation();

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ════════════════════════════════════════════════════
          HERO BAND
      ════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 50%, #0f1e06 100%)',
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                  <Sparkles size={11} /> Candidate Dashboard
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.20)', display: 'inline-block' }} /> AI-Powered
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                {greet()}, {user?.name?.split(' ')[0] ?? 'there'}! 🎯
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(190,220,140,0.65)', lineHeight: 1.6 }}>
                Your career intelligence hub — track, improve, and land the role.
              </p>
            </div>

            {/* Hero CTA — Resume Check */}
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <button
                onClick={() => document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth' })}
                id="hero-resume-check"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '12px 24px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  boxShadow: '0 6px 28px rgba(61,80,22,0.60)',
                  border: '1px solid rgba(107,138,58,0.35)',
                  cursor: 'pointer', letterSpacing: '-0.01em',
                }}
              >
                <Upload size={16} strokeWidth={2.5} />
                Check My Resume
                <ArrowUpRight size={14} />
              </button>
            </motion.div>
          </motion.div>

          {/* Stat cards — on dark band */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {MOCK_STATS.map((stat, i) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
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
                  <Counter to={stat.value} suffix={stat.suffix} />
                </p>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          CONTENT AREA
      ════════════════════════════════════════════════════ */}
      <div style={{ padding: '24px 36px 60px' }}>

        {/* ── Row A: Resume Score Card + App Tracker + Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.8fr', gap: 18, marginBottom: 18 }}>

          {/* Resume Score Card */}
          <Card delay={0.08}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #34d399, #059669)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '22px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Resume Score</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Senior Frontend Engineer</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>Excellent</span>
              </div>

              {/* Circular score ring on a dark mini-band */}
              <div style={{ background: 'linear-gradient(135deg, #18280a, #0c1505)', borderRadius: 16, padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
                <ScoreRing score={82} />
                <p style={{ fontSize: 12, color: 'rgba(163,230,53,0.7)', fontWeight: 600, marginTop: 12 }}>Top 15% of candidates</p>
              </div>

              {/* Score breakdown bars */}
              {[
                { label: 'Skills match',    value: 91, color: '#34d399' },
                { label: 'Experience',      value: 78, color: '#60a5fa' },
                { label: 'Keywords',        value: 82, color: '#a78bfa' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 11, color, fontWeight: 700 }}>{value}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                    />
                  </div>
                </div>
              ))}

              <Link to="/candidate/resume-score"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, padding: '10px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--step-inactive-bg)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                View full report <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          {/* Application Pipeline Tracker */}
          <Card delay={0.13}>
            <CardHead icon={Target} iconColor="#60a5fa" title="Application Tracker" subtitle={`${APP_STAGES[1].count} active applications`} action={<ViewAll to="/candidate/applications" />} />
            <div style={{ padding: '18px 22px 22px' }}>
              {APP_STAGES.map((stage, i) => (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.06 }}
                  style={{ marginBottom: i < APP_STAGES.length - 1 ? 16 : 0 }}
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
                      transition={{ duration: 1.0, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }}
                    />
                  </div>
                </motion.div>
              ))}

              {/* Application health */}
              <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={18} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>Strong momentum!</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>14% interview conversion rate</p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#10b981', flexShrink: 0 }}>Good</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card delay={0.18}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: '#a3e635' }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Quick Actions</p>
            </div>
            <div style={{ padding: '12px 12px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {QUICK_ACTIONS.map(({ label, icon: Icon, to, color, bg, primary }, i) => (
                <motion.div key={label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, delay: 0.22 + i * 0.05 }}>
                  <Link
                    to={to}
                    id={`cand-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11,
                      padding: primary ? '13px 15px' : '11px 15px', borderRadius: 14,
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
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: primary ? 'rgba(163,230,53,0.15)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} style={{ color: primary ? '#a3e635' : color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: primary ? 700 : 600, color: primary ? '#e5f5c8' : 'var(--text-primary)', flex: 1 }}>{label}</span>
                    <ArrowRight size={13} style={{ color: primary ? 'rgba(163,230,53,0.5)' : 'var(--text-muted)', flexShrink: 0 }} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row B: Recommended Jobs + Activity ─────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* Recommended Jobs */}
          <Card delay={0.23}>
            <CardHead icon={Flame} iconColor="#f59e0b" title="Recommended Jobs" subtitle="Matched to your profile & resume" action={<ViewAll to="/candidate/applications" label="Browse all" />} />
            <div style={{ padding: '12px 14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOCK_JOBS.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.26 + i * 0.07 }}
                  style={{
                    padding: '16px 18px', borderRadius: 16,
                    background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--step-inactive-bg)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Company logo */}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #18280a, #2d4010)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3e635', fontSize: 12, fontWeight: 900, flexShrink: 0, border: '1px solid rgba(107,138,58,0.25)' }}>
                    {job.logo}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 3 }}>{job.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job.company} · {job.loc}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: job.tagColor, background: `${job.tagColor}14`, padding: '2px 8px', borderRadius: 999, border: `1px solid ${job.tagColor}25`, marginBottom: 6 }}>{job.tag}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#34d399' }}>{job.match}% <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>match</span></span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card delay={0.28} style={{ display: 'flex', flexDirection: 'column' }}>
            <CardHead
              icon={BarChart3}
              iconColor="#60a5fa"
              title="Recent Activity"
              subtitle={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '1px 7px', borderRadius: 999 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live
                </span>
              }
              action={<ViewAll to="/candidate/scan-history" />}
            />
            <div style={{ flex: 1, padding: '8px 10px 16px', display: 'flex', flexDirection: 'column' }}>
              {MOCK_ACTIVITY.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, delay: 0.3 + i * 0.055 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'default', transition: 'background 0.13s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--card-row-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${item.color}12`, border: `1px solid ${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <item.icon size={14} style={{ color: item.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.text}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{item.meta} · {item.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row C: Resume Upload Panel (full width) ─────────── */}
        <Card delay={0.34} style={{ overflow: 'visible' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635, #6B8A3A)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '22px 28px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Upload size={17} style={{ color: 'var(--primary)' }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Resume Check</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Instant AI-powered analysis & scoring</p>
                </div>
              </div>
              {file && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.10)', padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={13} /> {file.name}
                  <button onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(52,211,153,0.7)', display: 'flex', padding: 0 }}>
                    <X size={13} />
                  </button>
                </span>
              )}
            </div>

            {/* Drop zone */}
            <div
              id="resume-upload-panel"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '40px 24px',
                border: `2px dashed ${dragging ? 'var(--primary)' : file ? '#34d399' : 'var(--border)'}`,
                borderRadius: 18, textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(61,80,22,0.06)' : file ? 'rgba(52,211,153,0.04)' : 'var(--card-row-bg)',
                transition: 'all 0.2s ease',
                transform: dragging ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} id="resume-upload-input" />

              <div style={{ width: 56, height: 56, borderRadius: 16, background: file ? 'rgba(52,211,153,0.12)' : 'var(--icon-circle-bg)', border: `1px solid ${file ? 'rgba(52,211,153,0.25)' : 'var(--border-hover)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                {file ? <CheckCircle2 size={26} style={{ color: '#34d399' }} /> : <Upload size={24} style={{ color: 'var(--primary)' }} />}
              </div>

              {file ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#34d399', marginBottom: 4 }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB · Ready to analyse</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Drop your resume here</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>or click to browse — PDF, DOC, DOCX accepted</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--pill-badge-bg)', padding: '5px 14px', borderRadius: 999, border: '1px solid var(--pill-badge-border)' }}>
                    <Sparkles size={11} /> Instant AI analysis · Free
                  </span>
                </>
              )}
            </div>

            {file && (
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', marginTop: 14, padding: '14px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 6px 24px rgba(61,80,22,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  letterSpacing: '-0.01em',
                }}
                id="resume-analyse-btn"
              >
                <Sparkles size={16} />
                Analyse Resume with AI
                <ArrowRight size={15} />
              </motion.button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CandidateDashboard;
