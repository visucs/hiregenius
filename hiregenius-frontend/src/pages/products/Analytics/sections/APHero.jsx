import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight, BarChart3, TrendingUp, Zap, Play } from 'lucide-react';
import GradientButton from '../../../../components/GradientButton/GradientButton';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const fade  = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };

/* Mini charts for the hero card */
const sparkData = [
  { v: 18 }, { v: 32 }, { v: 24 }, { v: 45 }, { v: 38 }, { v: 56 }, { v: 48 }, { v: 72 }, { v: 61 }, { v: 84 },
];
const pieData = [
  { name: 'Recommended', value: 38, color: '#22C55E' },
  { name: 'Consider',    value: 29, color: '#F59E0B' },
  { name: 'Not a Fit',   value: 33, color: '#EF4444' },
];

const ttStyle = { background: '#0F1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11, color: '#F8FAFC' };

const STATS = [
  { value: '6',   label: 'Chart types built-in' },
  { value: '<2s', label: 'Dashboard load time' },
  { value: '100%', label: 'Real-time from your data' },
];

const APHero = () => (
  <section
    className="hero-section ap-hero-section"
    style={{ paddingTop: 140, paddingBottom: 96, position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}
  >
    {/* Glow */}
    <div style={{ position: 'absolute', top: '0%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
    <div className="hero-dot-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none', zIndex: 0 }} />

    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
      <motion.div variants={stagger} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
        className="ap-hero-grid"
      >
        {/* Left */}
        <div>
          {/* Breadcrumb */}
          <motion.div variants={fade} style={{ marginBottom: 20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'clamp(11px, 2.8vw, 13px)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color='var(--primary)'} onMouseLeave={e => e.target.style.color='var(--text-muted)'}>
                Home
              </Link>
              <ChevronRight size={12} />
              <span style={{ color: 'var(--text-secondary)' }}>Products</span>
              <ChevronRight size={12} />
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Analytics</span>
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div variants={fade} style={{ marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px clamp(10px, 3vw, 14px)', borderRadius: 999,
              background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)',
              fontSize: 'clamp(10px, 2.7vw, 12px)', fontWeight: 600, color: 'var(--primary)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              maxWidth: '100%', boxSizing: 'border-box',
            }}>
              <BarChart3 size={12} style={{ flexShrink: 0 }} />
              <span>Real-time · Multi-chart · Exportable</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={fade} className="hero-heading" style={{ marginBottom: 20, color: 'var(--text-primary)', textAlign: 'left' }}>
            Every hiring metric,{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366F1, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              in one dashboard.
            </span>
          </motion.h1>

          <motion.p variants={fade} style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)', maxWidth: 520, marginBottom: 36 }}>
            HireGenius Analytics aggregates resume scores, interview outcomes, candidate pipeline
            health, and skill demand into beautiful real-time charts — so you always know where
            your hiring stands and where to focus next.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fade} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 40 }}>
            <GradientButton to="/register" size="lg" id="ap-hero-cta">
              View my dashboard <ArrowRight size={16} />
            </GradientButton>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('ap-live-demo')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer' }}>
              <Play size={13} fill="var(--primary)" color="var(--primary)" />
              See live charts
            </motion.button>
          </motion.div>

          {/* Mini stats */}
          <motion.div variants={fade} style={{ display: 'flex', gap: 28, paddingTop: 28, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {STATS.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: floating dashboard card */}
        <motion.div variants={fade} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: -40, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, padding: '22px 22px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#fb7185','#fbbf24','#22C55E'].map((c,i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analytics Dashboard</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.12)', padding: '2px 7px', borderRadius: 999 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} /> LIVE
              </div>
            </div>

            {/* Stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Resumes Screened', value: '248' },
                { label: 'Interviews Done',  value: '91'  },
                { label: 'Success Rate',     value: '63%' },
              ].map((s,i) => (
                <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Sparkline chart */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Hiring Trend — Last 30 days</div>
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis hide />
                  <YAxis hide />
                  <Tooltip contentStyle={ttStyle} />
                  <Area type="monotone" dataKey="v" stroke="#6366F1" fill="url(#heroGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mini donut + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ flexShrink: 0 }}>
                <ResponsiveContainer width={56} height={56}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={16} outerRadius={26} dataKey="value" strokeWidth={0}>
                      {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Interview Outcomes</div>
                {pieData.map((p,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{p.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{p.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Floating badge */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, duration: 0.4 }}
            style={{ position: 'absolute', top: '6%', right: 0, zIndex: 5, background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, padding: '8px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={13} color="#22C55E" /> +12% this month
          </motion.div>
        </motion.div>
      </motion.div>
    </div>

    <style>{`
      @media(max-width:900px){
        .ap-hero-grid{grid-template-columns:1fr!important;gap:48px!important;}
      }
      @media(max-width:768px){
        .ap-hero-section{
          padding-top: clamp(108px, 16vw, 136px) !important;
          padding-bottom: clamp(48px, 6vw, 80px) !important;
        }
      }
    `}</style>
  </section>
);

export default APHero;
