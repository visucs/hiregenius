import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion';
import {
  Sparkles, ArrowRight, CheckCircle2, FileSearch, BrainCircuit,
  Users, BarChart3, Upload, Cpu, MessageSquare, Trophy,
  Zap, Shield, TrendingUp, Star, ChevronDown, ChevronRight,
  Globe, Mail, Bookmark, Search, Video, Play, Check, Activity, Briefcase,
  CircleDot, Layers, Clock, Target, Award, Rocket, ChevronUp,
} from 'lucide-react';
import LandingNavbar from '../../components/Navbar/LandingNavbar';
import GradientButton from '../../components/GradientButton/GradientButton';
import AnimatedCounter from '../../components/AnimatedCounter/AnimatedCounter';
import robotHead from '../../assets/robot-head.png';

/* ── Animation variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Data ────────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  { icon: Upload, step: '01', title: 'Post a Job', desc: 'Create a job posting with required skills, experience, and role details. Our AI understands natural language JDs out of the box.' },
  { icon: Cpu, step: '02', title: 'AI Screens Resumes', desc: 'Every uploaded resume is parsed, scored, and matched against your job in under 10 seconds — no manual reading required.' },
  { icon: MessageSquare, step: '03', title: 'AI Conducts Interviews', desc: 'Role-specific questions are auto-generated. Candidates answer in-platform and the AI evaluates depth, clarity, and confidence.' },
  { icon: Trophy, step: '04', title: 'Get Ranked Shortlist', desc: 'Our Ranking Agent uses RAG over your candidate pool to surface the best fits with full explainability — not just scores.' },
];

const FEATURES = [
  {
    icon: FileSearch, tag: 'Core', title: 'Resume Screening',
    desc: 'Upload PDF or DOCX resumes and receive an AI-generated score, skills gap analysis, and clear recommendation within seconds.',
    tags: ['Skills Match', 'Gap Analysis', 'Recommendation'], href: '/products/resume-screening',
    size: 'large', accent: '#3D5016',
  },
  {
    icon: BrainCircuit, tag: 'Most Popular', title: 'AI Interview',
    desc: 'Automatically generate role-specific interview questions and evaluate candidate responses at scale.',
    tags: ['Auto Q&A', 'Communication Score', 'Tech Depth'], href: '/products/ai-interview',
    size: 'large', accent: '#4A7C3F',
  },
  {
    icon: Users, tag: 'Intelligence', title: 'Candidate Ranking',
    desc: 'RAG-powered ranking surfaces your best candidates with detailed explanatory reasoning.',
    tags: ['RAG Ranking', 'Explainability'], href: '/products/candidate-ranking',
    size: 'small', accent: '#6B8A3A',
  },
  {
    icon: BarChart3, tag: 'Insights', title: 'Analytics',
    desc: 'Track hiring trends, score distributions, and interview success rates in real time.',
    tags: ['Trend Charts', 'Export'], href: '/products/analytics',
    size: 'small', accent: '#8AAF50',
  },
];

const BENEFITS = [
  { icon: Zap, title: 'Screen 10x Faster', desc: 'What once took a recruiter 3 days of reading now takes HireGenius AI under 30 minutes for 100 resumes. Reclaim your week.', metric: '10×', metricLabel: 'faster' },
  { icon: Shield, title: 'Reduce Bias', desc: 'Objective AI scoring runs alongside human review so every candidate is evaluated on skills and experience — not subjective impressions.', metric: '91%', metricLabel: 'accuracy' },
  { icon: TrendingUp, title: 'Actionable Insights', desc: 'From score distributions to skill gap trends, our analytics help you refine job descriptions and improve hiring quality over time.', metric: '60%', metricLabel: 'time-to-hire ↓' },
];

const FAQS = [
  { q: 'How accurate is the AI resume scoring?', a: 'Our scoring model evaluates skills match, experience level, and keyword alignment against your job description. In internal testing across 50,000+ resumes, it achieved 91% agreement with senior recruiter decisions on shortlisting.' },
  { q: 'What file types are supported for resume upload?', a: 'We support PDF and DOCX formats. Our parser handles a wide variety of resume layouts including multi-column, table-based, and creative formats.' },
  { q: 'Can I customise the AI interview questions?', a: 'Yes. By default, the AI generates role-specific questions from your JD. You can also add mandatory questions, adjust difficulty, and set a question count before triggering the interview.' },
  { q: 'How does the candidate ranking work?', a: 'Our Ranking Agent uses Retrieval-Augmented Generation (RAG) over your entire applicant pool. It retrieves the most relevant candidate profiles against the JD and ranks them with a natural language explanation for each placement.' },
  { q: 'Is candidate data kept private?', a: 'All resume data is stored with AES-256 encryption at rest. Data is scoped per organisation and never used to train shared models without explicit opt-in.' },
  { q: 'Is there a free plan?', a: 'HireGenius AI offers a free tier that includes up to 10 resume screenings and 3 AI interview evaluations per month, with no credit card required to start.' },
];

const STATS = [
  { value: 10, suffix: 'x', label: 'Faster screening' },
  { value: 98, suffix: '%', label: 'Recruiter satisfaction' },
  { value: 60, suffix: '%', label: 'Reduction in time-to-hire' },
  { value: 500, suffix: '+', label: 'Hiring teams onboarded' },
];

const TRUSTED = ['Google', 'Microsoft', 'Shopify', 'Spotify', 'Airbnb', 'Stripe', 'Notion', 'Linear'];

const FOOTER_LINKS = {
  Product: ['Resume Screening', 'AI Interview', 'Candidate Ranking', 'Analytics', 'Changelog'],
  Company: ['About Us', 'Blog', 'Careers', 'Press'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Security'],
};

/* ── Reusable Components ─────────────────────────────────────── */
const EyebrowBadge = ({ children }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '5px 14px', borderRadius: 999,
    background: 'rgba(61,80,22,0.08)', border: '1px solid rgba(61,80,22,0.18)',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
    color: '#3D5016', marginBottom: 20,
  }}>
    <CircleDot size={10} style={{ color: '#6B8A3A' }} />
    {children}
  </div>
);

const SectionTitle = ({ eyebrow, title, subtitle, centered = true }) => (
  <div style={{ textAlign: centered ? 'center' : 'left', marginBottom: 64 }}>
    <EyebrowBadge>{eyebrow}</EyebrowBadge>
    <h2 style={{
      fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.1,
      color: '#1A1F0E', letterSpacing: '-0.03em', marginBottom: 16,
    }}>
      {title}
    </h2>
    {subtitle && (
      <p style={{
        fontSize: 17, lineHeight: 1.7, color: '#4A5239',
        maxWidth: centered ? 560 : 'none', margin: centered ? '0 auto' : 0,
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

/* ── Main Page ───────────────────────────────────────────────── */
const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div style={{ backgroundColor: '#0A0E05', color: '#F0EDE4', overflowX: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <LandingNavbar />

      {/* ══════════════════════════════════════════════════════
          HERO — Full-viewport with bento floating cards
      ══════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Gradient mesh background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(107,138,58,0.22) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(61,80,22,0.14) 0%, transparent 60%), #0A0E05',
        }} />
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4,
          backgroundImage: 'radial-gradient(rgba(107,138,58,0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Top glow orb */}
        <div style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,138,58,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          {/* ── Hero copy — centered ── */}
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            style={{ textAlign: 'center', marginBottom: 72 }}
          >
            <motion.div variants={fadeUp}>
              <EyebrowBadge>AI-Powered Recruitment Platform</EyebrowBadge>
            </motion.div>

            <motion.h1 variants={fadeUp} style={{
              fontSize: 'clamp(44px, 6vw, 84px)', fontWeight: 900, lineHeight: 1.04,
              letterSpacing: '-0.04em', marginBottom: 24, color: '#F0EDE4',
            }}>
              Hire smarter with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #6B8A3A 0%, #a3c55a 50%, #6B8A3A 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                animation: 'shimmer 3s linear infinite',
              }}>
                AI agents
              </span>
              {' '}that<br />screen, interview &amp; rank.
            </motion.h1>

            <motion.p variants={fadeUp} style={{
              fontSize: 18, lineHeight: 1.7, color: 'rgba(240,237,228,0.65)',
              maxWidth: 560, margin: '0 auto 40px',
            }}>
              Post a job, let AI score every resume in under 10 seconds,
              auto-generate interviews, and surface your top candidates — all in one platform.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" id="hero-cta" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                color: '#fff', textDecoration: 'none',
                boxShadow: '0 0 0 1px rgba(107,138,58,0.4), 0 8px 32px rgba(61,80,22,0.45)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1px rgba(107,138,58,0.6), 0 12px 40px rgba(61,80,22,0.60)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 1px rgba(107,138,58,0.4), 0 8px 32px rgba(61,80,22,0.45)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Start Screening Free <ArrowRight size={16} />
              </Link>
              <Link to="/register" id="hero-demo" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                color: 'rgba(240,237,228,0.80)', textDecoration: 'none',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(240,237,228,0.80)'; }}
              >
                <Play size={13} fill="currentColor" /> Watch Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Floating Dashboard Bento ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hero-bento-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gridTemplateRows: 'auto',
              gap: 16,
              position: 'relative',
            }}
          >
            {/* Card: AI Score Ring */}
            <motion.div
              animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="bento-card-score"
              style={{
                gridColumn: '1 / 4', gridRow: '1',
                background: 'rgba(20,28,10,0.85)', border: '1px solid rgba(107,138,58,0.22)',
                borderRadius: 20, padding: 24, backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(163,197,90,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Resume Score</span>
              <div style={{ position: 'relative', width: 88, height: 88 }}>
                <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(107,138,58,0.15)" strokeWidth="7" />
                  <circle cx="44" cy="44" r="36" fill="none"
                    stroke="url(#sg1)" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={226} strokeDashoffset={226 - (92 / 100) * 226}
                  />
                  <defs>
                    <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3D5016" />
                      <stop offset="100%" stopColor="#a3c55a" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#F0EDE4' }}>92%</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4A7C3F', fontSize: 12, fontWeight: 700 }}>
                <Check size={13} strokeWidth={3} /> Highly Recommended
              </div>
              <span style={{ fontSize: 10, color: 'rgba(240,237,228,0.35)' }}>Scored in 8.2 seconds</span>
            </motion.div>

            {/* Card: Candidate Dashboard */}
            <div className="bento-card-candidates" style={{
              gridColumn: '4 / 10', gridRow: '1',
              background: 'rgba(18,24,10,0.90)', border: '1px solid rgba(107,138,58,0.18)',
              borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(20px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}>
              {/* Topbar */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(107,138,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F0EDE4' }}>Top Candidates</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: '#4A7C3F', background: 'rgba(74,124,63,0.12)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(74,124,63,0.25)' }}>
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>●</motion.span> Live
                </div>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Arjun Mehta', role: 'Full Stack Developer', match: 92, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop' },
                  { name: 'Priya Sharma', role: 'Frontend Developer', match: 88, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop' },
                  { name: 'Rohan Verma', role: 'Backend Developer', match: 85, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop' },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 12, background: 'rgba(107,138,58,0.07)', border: '1px solid rgba(107,138,58,0.12)' }}>
                    <img src={c.avatar} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#F0EDE4', lineHeight: 1.2 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(240,237,228,0.45)' }}>{c.role}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#4A7C3F' }}>{c.match}% Match</span>
                    <Bookmark size={12} style={{ color: 'rgba(240,237,228,0.30)' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Card: AI Interview Badge */}
            <motion.div
              animate={{ y: [0, 6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="bento-card-interview"
              style={{
                gridColumn: '10 / 13', gridRow: '1',
                background: 'linear-gradient(135deg, #1a2d0a 0%, #0e1906 100%)',
                border: '1px solid rgba(107,138,58,0.30)',
                borderRadius: 20, padding: '20px 16px', backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(107,138,58,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={15} style={{ color: '#6B8A3A' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F0EDE4' }}>AI Interview</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: 'rgba(74,124,63,0.15)', border: '1px solid rgba(74,124,63,0.25)' }}>
                <Check size={12} strokeWidth={3} style={{ color: '#4A7C3F' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4A7C3F' }}>Completed</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(240,237,228,0.35)', lineHeight: 1.5 }}>
                12 Q&A evaluated<br />Score: 87/100
              </div>
            </motion.div>

            {/* Card: Pipeline */}
            <div className="bento-card-pipeline" style={{
              gridColumn: '1 / 8', gridRow: '2',
              background: 'rgba(18,24,10,0.90)', border: '1px solid rgba(107,138,58,0.18)',
              borderRadius: 20, padding: 22, backdropFilter: 'blur(20px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F0EDE4', marginBottom: 18 }}>Hiring Pipeline</div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 clamp(2px, 1vw, 8px)', overflowX: 'auto' }}>
                <div style={{ position: 'absolute', top: 16, left: 20, right: 20, height: 2, background: 'linear-gradient(90deg, #3D5016 60%, rgba(107,138,58,0.2) 60%)', zIndex: 0 }} />
                {[
                  { label: 'Job Posted', icon: Briefcase, done: true },
                  { label: 'Screening', icon: Search, done: true },
                  { label: 'AI Interview', icon: Video, done: true, current: true },
                  { label: 'Shortlisted', icon: TrendingUp, done: false },
                  { label: 'Hired', icon: Check, done: false },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, minWidth: 44 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: s.current ? '#3D5016' : s.done ? 'rgba(61,80,22,0.30)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${s.current ? '#6B8A3A' : s.done ? 'rgba(107,138,58,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: s.current ? '#fff' : s.done ? '#6B8A3A' : 'rgba(240,237,228,0.25)',
                      boxShadow: s.current ? '0 0 20px rgba(107,138,58,0.5)' : 'none',
                    }}>
                      <s.icon size={14} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: s.done ? 700 : 500, color: s.done ? 'rgba(240,237,228,0.70)' : 'rgba(240,237,228,0.25)', textAlign: 'center', maxWidth: 52 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Stats */}
            <motion.div
              animate={{ y: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="bento-card-stats"
              style={{
                gridColumn: '8 / 13', gridRow: '2',
                background: 'rgba(20,28,10,0.85)', border: '1px solid rgba(107,138,58,0.20)',
                borderRadius: 20, padding: 22, backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(163,197,90,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent Activity</div>
              {[
                { text: '120 resumes screened', time: '2m ago', color: '#4A7C3F' },
                { text: 'AI interviews completed', time: '15m ago', color: '#4A7C3F' },
                { text: 'Top candidates updated', time: '1h ago', color: 'rgba(240,237,228,0.30)' },
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: act.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(240,237,228,0.70)', fontWeight: 500 }}>{act.text}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(240,237,228,0.25)', whiteSpace: 'nowrap' }}>{act.time}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Robot */}
          <motion.img
            src={robotHead} alt="AI Helper"
            className="hero-robot"
            animate={{ y: [0, -12, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', bottom: -40, right: 0, width: 110, height: 110,
              objectFit: 'contain', zIndex: 20, filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.45))',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Trusted by strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1, marginTop: 80, textAlign: 'center' }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,237,228,0.30)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 20 }}>Trusted by teams at</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {TRUSTED.map(name => (
              <div key={name} style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                color: 'rgba(240,237,228,0.35)', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)', letterSpacing: '0.02em',
              }}>{name}</div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════════════ */}
      <section style={{
        borderTop: '1px solid rgba(107,138,58,0.15)', borderBottom: '1px solid rgba(107,138,58,0.15)',
        background: 'linear-gradient(135deg, rgba(61,80,22,0.12) 0%, rgba(107,138,58,0.06) 100%)',
        padding: '64px 40px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48 }}>
          {STATS.map(({ value, suffix, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 900, lineHeight: 1,
                letterSpacing: '-0.04em', marginBottom: 8,
                background: 'linear-gradient(135deg, #F0EDE4 0%, rgba(163,197,90,0.90) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                <AnimatedCounter value={value} suffix={suffix} />
              </div>
              <div style={{ fontSize: 14, color: 'rgba(240,237,228,0.50)', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — Numbered timeline
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '120px 40px', background: '#0A0E05' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 80 }}>
              <EyebrowBadge>How It Works</EyebrowBadge>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F0EDE4', marginBottom: 16 }}>
                From job post to ranked shortlist
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(240,237,228,0.55)', maxWidth: 500, margin: '0 auto' }}>
                Four intelligent steps — automated by multi-agent AI.
              </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, position: 'relative' }}>
              {/* Connector */}
              <div style={{ position: 'absolute', top: 36, left: '12%', right: '12%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(107,138,58,0.30), transparent)', zIndex: 0 }} aria-hidden />

              {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }, i) => (
                <motion.div key={step} variants={fadeUp}
                  style={{
                    background: 'rgba(18,24,10,0.80)', border: '1px solid rgba(107,138,58,0.15)',
                    borderRadius: 20, padding: '28px 24px', position: 'relative', zIndex: 1,
                    transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
                    cursor: 'default',
                  }}
                  whileHover={{ y: -4, borderColor: 'rgba(107,138,58,0.40)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                >
                  {/* Step number */}
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(107,138,58,0.50)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 16 }}>Step {step}</div>
                  {/* Icon */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                    background: 'linear-gradient(135deg, rgba(61,80,22,0.50), rgba(107,138,58,0.25))',
                    border: '1px solid rgba(107,138,58,0.30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(61,80,22,0.25)',
                  }}>
                    <Icon size={24} style={{ color: '#a3c55a' }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE4', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(240,237,228,0.50)' }}>{desc}</p>
                  {/* Bottom accent line */}
                  <div style={{ position: 'absolute', bottom: 0, left: 20, right: 20, height: 2, borderRadius: 999, background: 'linear-gradient(90deg, transparent, rgba(107,138,58,0.40), transparent)' }} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES — Asymmetric bento grid
      ══════════════════════════════════════════════════════ */}
      <section id="features" style={{
        padding: '120px 40px',
        background: 'linear-gradient(180deg, rgba(18,24,10,0.95) 0%, #0A0E05 100%)',
        borderTop: '1px solid rgba(107,138,58,0.12)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 72 }}>
              <EyebrowBadge>Platform Modules</EyebrowBadge>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F0EDE4', marginBottom: 16 }}>
                Everything your hiring team needs
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(240,237,228,0.50)', maxWidth: 500, margin: '0 auto' }}>
                One platform — from resume to hire decision — powered by multi-agent AI.
              </p>
            </motion.div>

            {/* Bento layout */}
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 20 }}>
              {FEATURES.map(({ icon: Icon, tag, title, desc, tags, href, size, accent }, i) => (
                <motion.div key={title} variants={scaleIn}
                  style={{
                    gridColumn: size === 'large' ? 'span 1' : 'span 1',
                    background: 'rgba(15,22,8,0.90)', border: '1px solid rgba(107,138,58,0.15)',
                    borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
                    transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
                    position: 'relative',
                  }}
                  whileHover={{ y: -6, borderColor: 'rgba(107,138,58,0.45)', boxShadow: `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(107,138,58,0.22)` }}
                >
                  {/* Gradient header */}
                  <div style={{
                    height: size === 'large' ? 180 : 130,
                    background: `linear-gradient(135deg, ${accent}22 0%, rgba(107,138,58,0.08) 100%)`,
                    borderBottom: '1px solid rgba(107,138,58,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: 200, height: 200, borderRadius: '50%',
                      background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
                    }} />
                    <div style={{
                      width: size === 'large' ? 68 : 54, height: size === 'large' ? 68 : 54,
                      borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `linear-gradient(135deg, ${accent}33, ${accent}15)`,
                      border: `1px solid ${accent}44`,
                      boxShadow: `0 12px 32px ${accent}30`,
                      position: 'relative', zIndex: 1,
                    }}>
                      <Icon size={size === 'large' ? 30 : 24} style={{ color: '#a3c55a' }} />
                    </div>
                    {/* Tag badge */}
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '3px 10px', borderRadius: 999,
                      background: `${accent}22`, border: `1px solid ${accent}44`, color: '#a3c55a',
                    }}>
                      {tag}
                    </div>
                  </div>
                  {/* Content */}
                  <div style={{ padding: size === 'large' ? '28px 28px 24px' : '20px 22px 18px' }}>
                    <h3 style={{ fontSize: size === 'large' ? 20 : 17, fontWeight: 700, color: '#F0EDE4', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(240,237,228,0.50)', marginBottom: 18 }}>{desc}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                      {tags.map(t => (
                        <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(107,138,58,0.10)', border: '1px solid rgba(107,138,58,0.20)', color: 'rgba(163,197,90,0.80)' }}>{t}</span>
                      ))}
                    </div>
                    <Link to={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#6B8A3A', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#a3c55a'}
                      onMouseLeave={e => e.currentTarget.style.color = '#6B8A3A'}
                    >
                      Learn more <ArrowRight size={13} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BENEFITS — Horizontal magazine cards
      ══════════════════════════════════════════════════════ */}
      <section id="benefits" style={{ padding: '120px 40px', background: '#0A0E05', borderTop: '1px solid rgba(107,138,58,0.12)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 72 }}>
              <EyebrowBadge>Why HireGenius AI</EyebrowBadge>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F0EDE4', marginBottom: 16 }}>
                Built for modern recruiting teams
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(240,237,228,0.50)', maxWidth: 480, margin: '0 auto' }}>
                Practical benefits that translate into faster, fairer, smarter hiring.
              </p>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {BENEFITS.map(({ icon: Icon, title, desc, metric, metricLabel }, i) => (
                <motion.div key={title} variants={fadeUp} className="benefit-card"
                  style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr auto',
                    gap: 32, alignItems: 'center',
                    background: 'rgba(15,22,8,0.85)', border: '1px solid rgba(107,138,58,0.15)',
                    borderRadius: 20, padding: '28px 32px',
                    transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
                  }}
                  whileHover={{ borderColor: 'rgba(107,138,58,0.40)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', y: -3 }}
                >
                  {/* Icon square */}
                  <div style={{
                    width: 60, height: 60, borderRadius: 16, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(61,80,22,0.40), rgba(107,138,58,0.20))',
                    border: '1px solid rgba(107,138,58,0.30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(61,80,22,0.30)',
                  }}>
                    <Icon size={26} style={{ color: '#a3c55a' }} />
                  </div>
                  {/* Content */}
                  <div>
                    <h3 style={{ fontSize: 19, fontWeight: 700, color: '#F0EDE4', marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(240,237,228,0.50)' }}>{desc}</p>
                  </div>
                  {/* Big metric */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 42, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em',
                      background: 'linear-gradient(135deg, #F0EDE4 0%, rgba(163,197,90,0.90) 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>{metric}</div>
                    <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.35)', fontWeight: 600, marginTop: 2 }}>{metricLabel}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA BAND
      ══════════════════════════════════════════════════════ */}
      <section style={{
        padding: '100px 40px',
        background: 'linear-gradient(135deg, rgba(61,80,22,0.25) 0%, rgba(107,138,58,0.10) 50%, rgba(61,80,22,0.20) 100%)',
        borderTop: '1px solid rgba(107,138,58,0.20)', borderBottom: '1px solid rgba(107,138,58,0.20)',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.15) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.5 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <EyebrowBadge>Free to start</EyebrowBadge>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', color: '#F0EDE4', marginBottom: 20 }}>
            Ready to hire smarter?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(240,237,228,0.55)', marginBottom: 40, lineHeight: 1.6 }}>
            Join 500+ hiring teams screening candidates 10× faster with AI.<br />No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff',
              textDecoration: 'none', boxShadow: '0 8px 32px rgba(61,80,22,0.50)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(61,80,22,0.65)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(61,80,22,0.50)'; }}
            >
              Start for Free <ArrowRight size={17} />
            </Link>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600,
              color: 'rgba(240,237,228,0.75)', textDecoration: 'none',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(240,237,228,0.75)'; }}
            >
              Log in instead
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '120px 40px', background: '#0A0E05' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 72 }}>
              <EyebrowBadge>FAQ</EyebrowBadge>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F0EDE4', marginBottom: 16 }}>
                Common questions
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(240,237,228,0.45)', maxWidth: 440, margin: '0 auto' }}>
                Everything you need to know before you start.
              </p>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQS.map(({ q, a }, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', textAlign: 'left',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      padding: '22px 24px',
                      background: openFaq === i ? 'rgba(61,80,22,0.18)' : 'rgba(15,22,8,0.85)',
                      border: `1px solid ${openFaq === i ? 'rgba(107,138,58,0.40)' : 'rgba(107,138,58,0.14)'}`,
                      borderRadius: openFaq === i ? '16px 16px 0 0' : 16,
                      cursor: 'pointer', transition: 'all 0.2s',
                      fontSize: 15, fontWeight: 600, color: openFaq === i ? '#F0EDE4' : 'rgba(240,237,228,0.75)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(107,138,58,0.50)', minWidth: 24 }}>0{i + 1}</span>
                      {q}
                    </span>
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: openFaq === i ? '#6B8A3A' : 'rgba(240,237,228,0.30)' }}>
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          padding: '16px 24px 24px',
                          background: 'rgba(61,80,22,0.10)', border: '1px solid rgba(107,138,58,0.25)',
                          borderTop: 'none', borderRadius: '0 0 16px 16px',
                          fontSize: 14, lineHeight: 1.8, color: 'rgba(240,237,228,0.60)',
                        }}>
                          {a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{
        background: '#060A03', borderTop: '1px solid rgba(107,138,58,0.15)',
        padding: '72px 40px 40px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 64 }}>
            {/* Brand column */}
            <div>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(61,80,22,0.4)' }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#F0EDE4', letterSpacing: '-0.02em' }}>
                  HireGenius <span style={{ background: 'linear-gradient(135deg, #6B8A3A, #a3c55a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI</span>
                </span>
              </Link>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(240,237,228,0.35)', maxWidth: 240, marginBottom: 24 }}>
                AI-powered recruitment platform. Screen, interview, and rank candidates in minutes.
              </p>
              {/* Newsletter */}
              <div style={{ display: 'flex', gap: 0, maxWidth: 280, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(107,138,58,0.20)', background: 'rgba(255,255,255,0.04)' }}>
                <input placeholder="Your email address" style={{ flex: 1, padding: '10px 14px', background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'rgba(240,237,228,0.70)', fontFamily: 'inherit' }} />
                <button style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Subscribe
                </button>
              </div>
            </div>
            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(163,197,90,0.50)', marginBottom: 16 }}>{heading}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(link => (
                    <a key={link} href="#" style={{ fontSize: 13, color: 'rgba(240,237,228,0.40)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.target.style.color = 'rgba(240,237,228,0.80)'}
                      onMouseLeave={e => e.target.style.color = 'rgba(240,237,228,0.40)'}
                    >{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(107,138,58,0.12)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(240,237,228,0.25)' }}>© 2026 HireGenius AI. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Privacy', 'Terms', 'Security'].map(item => (
                <a key={item} href="#" style={{ fontSize: 12, color: 'rgba(240,237,228,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'rgba(240,237,228,0.60)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(240,237,228,0.25)'}
                >{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS for shimmer + scroll behavior + responsiveness */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(107,138,58,0.35); color: #F0EDE4; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0A0E05; }
        ::-webkit-scrollbar-thumb { background: rgba(107,138,58,0.30); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(107,138,58,0.50); }

        @media (max-width: 1024px) {
          .hero-bento-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .bento-card-score { grid-column: 1 / 2 !important; grid-row: auto !important; }
          .bento-card-interview { grid-column: 2 / 3 !important; grid-row: auto !important; }
          .bento-card-candidates { grid-column: 1 / 3 !important; grid-row: auto !important; }
          .bento-card-pipeline { grid-column: 1 / 3 !important; grid-row: auto !important; }
          .bento-card-stats { grid-column: 1 / 3 !important; grid-row: auto !important; }
        }

        @media (max-width: 768px) {
          section {
            padding-left: clamp(16px, 4vw, 32px) !important;
            padding-right: clamp(16px, 4vw, 32px) !important;
            padding-top: clamp(64px, 8vw, 96px) !important;
            padding-bottom: clamp(48px, 6vw, 80px) !important;
          }
          .hero-bento-grid {
            grid-template-columns: 1fr !important;
          }
          .bento-card-score,
          .bento-card-candidates,
          .bento-card-interview,
          .bento-card-pipeline,
          .bento-card-stats {
            grid-column: 1 / -1 !important;
            grid-row: auto !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .benefit-card {
            grid-template-columns: auto 1fr !important;
            gap: 16px !important;
            padding: 20px !important;
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
          .hero-robot {
            width: 70px !important;
            height: 70px !important;
            right: 8px !important;
            bottom: -24px !important;
          }
        }

        @media (max-width: 480px) {
          .benefit-card {
            grid-template-columns: 1fr !important;
            text-align: center;
            justify-items: center;
            gap: 16px !important;
            padding: 20px 16px !important;
          }
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
