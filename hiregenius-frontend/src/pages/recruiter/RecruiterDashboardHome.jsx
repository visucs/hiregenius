import { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, useInView, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, CalendarDays, Star,
  PlusCircle, Plus, ArrowRight, Clock, CheckCircle2,
  FileSearch, Sparkles, TrendingUp, Zap,
  BarChart3, Trophy, ArrowUpRight, ChevronUp,
  Play, Target, Bell, Info, RefreshCw,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import jobsService from '../../services/jobsService';

/* ─── Quick actions ───────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Post a New Job',      to: '/recruiter/jobs',             icon: PlusCircle,  color: '#a3e635', bg: 'rgba(163,230,53,0.10)',  primary: true, status: 'Active' },
  { label: 'View Candidates',    to: '/recruiter/candidates',        icon: Users,       color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  status: 'Active' },
  { label: 'Screen Resumes',     to: '/recruiter/resume-screening',  icon: FileSearch,  color: '#34d399', bg: 'rgba(52,211,153,0.10)',  status: 'Pending' },
  { label: 'Candidate Ranking',  to: '/recruiter/ranking',           icon: Trophy,      color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  status: 'Pending' },
  { label: 'AI Interviews',      to: '/recruiter/ai-interview',      icon: Play,        color: '#a78bfa', bg: 'rgba(167,139,250,0.10)',  status: 'Pending' },
  { label: 'Analytics',          to: '/recruiter/analytics',         icon: BarChart3,   color: '#ec4899', bg: 'rgba(236,72,153,0.10)',  status: 'Pending' },
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
  const fired = useRef(false);
  useEffect(() => {
    if (inView && !fired.current) {
      fired.current = true;
      animate(0, to, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
    }
  }, [inView, to]);
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
  const user = useSelector(selectUser);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Fetch real jobs from Core API (GET /api/jobs/mine)
  useEffect(() => {
    let isMounted = true;
    jobsService.getMyJobs({ limit: 50 })
      .then(res => {
        if (isMounted) {
          setJobs(res?.data?.jobs ?? []);
        }
      })
      .catch(err => {
        console.warn('[DashboardHome] Core API jobs query warning:', err?.message);
      })
      .finally(() => {
        if (isMounted) setLoadingJobs(false);
      });
    return () => { isMounted = false; };
  }, []);

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(j => j.status === 'OPEN').length;

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
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                  <Sparkles size={11} /> Recruiter Portal
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.20)', display: 'inline-block' }} /> Core API Live
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                {greet()}, {user?.name?.split(' ')[0] ?? 'Recruiter'}! 👋
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(190,220,140,0.65)', lineHeight: 1.6 }}>
                Here's your real-time recruitment snapshot — Jobs module is connected to live Core API.
              </p>
            </div>

            {/* Post Job CTA */}
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/recruiter/jobs"
                id="rec-home-post-job"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  padding: '12px 24px', minHeight: 44, borderRadius: 14,
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

          {/* Stat cards — Real data for Jobs; Honest placeholder for pending backends */}
          <div className="rec-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {/* Card 1: Total Jobs (REAL) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: 'clamp(16px, 3vw, 22px) clamp(16px, 3vw, 22px) clamp(20px, 3vw, 26px)',
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
              <p style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                {loadingJobs ? '...' : <Counter to={totalJobs} />}
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>
                Total Jobs ({openJobs} open)
              </p>
            </motion.div>

            {/* Card 2: Candidates & Applicants (Phase 3 Live) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: 'clamp(16px, 3vw, 22px) clamp(16px, 3vw, 22px) clamp(20px, 3vw, 26px)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #a78bfa00, #a78bfa88, #a78bfa00)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} style={{ color: '#a78bfa' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={10} /> Phase 3 Live
                </span>
              </div>
              <p style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                <Link to="/recruiter/candidates" style={{ color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Manage <ArrowUpRight size={18} style={{ color: '#a78bfa' }} />
                </Link>
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>
                Candidate Pipeline
              </p>
            </motion.div>

            {/* Card 3: Pending Interviews (Pending Phase 3 backend) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: 'clamp(16px, 3vw, 22px) clamp(16px, 3vw, 22px) clamp(20px, 3vw, 26px)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #f59e0b00, #f59e0b88, #f59e0b00)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDays size={18} style={{ color: '#f59e0b' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.22)' }}>
                  <Clock size={10} /> Pending Backend
                </span>
              </div>
              <p style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                —
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>
                Pending Interviews (Phase 3)
              </p>
            </motion.div>

            {/* Card 4: Avg Resume Score (Pending Phase 3 backend) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: 'clamp(16px, 3vw, 22px) clamp(16px, 3vw, 22px) clamp(20px, 3vw, 26px)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #34d39900, #34d39988, #34d39900)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={18} style={{ color: '#34d399' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.22)' }}>
                  <Clock size={10} /> Pending Backend
                </span>
              </div>
              <p style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                —
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>
                Avg Resume Score (ML)
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENT AREA
      ══════════════════════════════════════════════════════ */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px' }}>

        {/* ── Row A: Real Jobs Overview + Quick Actions ──────── */}
        <div className="rec-row-a" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* Active Job Listings (Real Data) */}
          <Card delay={0.10}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(107,138,58,0.14)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={17} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Your Active Jobs</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '1px 7px', borderRadius: 999 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live from Core API
                  </span>
                </div>
              </div>
              <Link to="/recruiter/jobs" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ padding: '12px 16px' }}>
              {loadingJobs ? (
                <div style={{ padding: '36px 0', textAlign: 'center' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading active listings...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <Briefcase size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No jobs posted yet</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Create your first job listing to get started.</p>
                  <Link
                    to="/recruiter/jobs"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                  >
                    <Plus size={13} /> Post First Job
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {jobs.slice(0, 4).map((j) => (
                    <div
                      key={j.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 12, background: 'var(--card-row-bg)',
                        border: '1px solid var(--border)', gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {j.title}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {j.company} • {j.location || 'Remote'}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
                          background: j.status === 'OPEN' ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                          color: j.status === 'OPEN' ? '#10b981' : '#ef4444',
                        }}
                      >
                        {j.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
              {QUICK_ACTIONS.map(({ label, to, icon: Icon, color, bg, primary, status }, i) => (
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
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: primary ? 'rgba(163,230,53,0.15)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} style={{ color: primary ? '#a3e635' : color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: primary ? 700 : 600, color: primary ? '#e5f5c8' : 'var(--text-primary)', flex: 1 }}>{label}</span>
                    {status === 'Active' ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(74,222,128,0.20)', color: '#4ade80' }}>Active</span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>Pending</span>
                    )}
                    <ArrowRight size={13} style={{ color: primary ? 'rgba(163,230,53,0.5)' : 'var(--text-muted)', flexShrink: 0 }} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row B: Hiring Pipeline Placeholder (Honest State) ── */}
        <Card delay={0.22}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635, #6B8A3A)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(163,230,53,0.10)', border: '1px solid rgba(163,230,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={17} style={{ color: '#a3e635' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Hiring Pipeline Funnel</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Applications & Candidates modules connection status</p>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.25)' }}>
              Phase 3 Upcoming
            </span>
          </div>

          <div style={{ padding: 'clamp(24px, 4vw, 36px) 24px', textAlign: 'center' }}>
            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(107,138,58,0.12)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--primary)' }}>
                <Clock size={22} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Hiring Funnel Activates in Phase 3
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>
                The multi-stage recruitment funnel (Applied → Screened → Shortlisted → Interviewed → Offered) will populate automatically when candidate applications and screening microservices are connected.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} />
                <span>Jobs module is live ({totalJobs} listing{totalJobs !== 1 ? 's' : ''} active)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1023px) {
          .rec-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .rec-row-a { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .rec-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default RecruiterDashboardHome;
