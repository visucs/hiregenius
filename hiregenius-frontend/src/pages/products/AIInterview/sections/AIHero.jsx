import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ChevronRight, MessageSquare, Star, Zap, TrendingUp } from 'lucide-react';
import GradientButton from '../../../../components/GradientButton/GradientButton';

const fade = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };

/* Animated score bar used inside the hero card */
const HeroBar = ({ label, value, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{value}%</span>
    </div>
    <div style={{ height: 5, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 999, width: `${value}%`,
        background: color || 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
      }} />
    </div>
  </div>
);

const AIHero = () => {
  const scrollToHowItWorks = () => {
    document.getElementById('ai-how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      style={{
        paddingTop: 140, paddingBottom: 96,
        position: 'relative', overflow: 'hidden',
        backgroundColor: 'var(--bg-base)',
      }}
    >
      {/* Background glow blob */}
      <div style={{
        position: 'absolute', top: '0%', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 500,
        background: 'radial-gradient(ellipse, var(--glow-radial) 0%, transparent 65%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div className="hero-dot-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
          className="ai-hero-grid"
        >
          {/* ── Left column ── */}
          <div>
            {/* Breadcrumb */}
            <motion.div variants={fade} style={{ marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                  Home
                </Link>
                <ChevronRight size={12} />
                <span style={{ color: 'var(--text-secondary)' }}>Products</span>
                <ChevronRight size={12} />
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>AI Interview</span>
              </div>
            </motion.div>

            {/* Badge pill */}
            <motion.div variants={fade} style={{ marginBottom: 20 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 14px', borderRadius: 999,
                background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)',
                fontSize: 12, fontWeight: 600, color: 'var(--primary)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <Zap size={12} />
                AI-Generated · Multi-Dimensional · Instant
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1 variants={fade} className="hero-heading" style={{ marginBottom: 20, color: 'var(--text-primary)', textAlign: 'left' }}>
              Let AI run the first round — meet only the{' '}
              <span className="gradient-text">candidates worth your time.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p variants={fade} style={{
              fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)',
              maxWidth: 520, marginBottom: 36,
            }}>
              HireGenius AI auto-generates role-specific questions, conducts text-based interviews,
              and scores every candidate on communication, confidence, and technical performance —
              so your shortlist only includes the people who genuinely impressed.
            </motion.p>

            {/* Social proof */}
            <motion.div variants={fade} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} fill="var(--secondary)" color="var(--secondary)" />
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Used by <strong style={{ color: 'var(--text-primary)' }}>3,000+</strong> recruiters globally
              </span>
              <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Results in <strong style={{ color: 'var(--primary)' }}>{'<30s'}</strong> per evaluation
              </span>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fade} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <GradientButton to="/register" size="lg" id="ai-hero-cta">
                Try AI Interview <ArrowRight size={16} />
              </GradientButton>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={scrollToHowItWorks}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 24px', borderRadius: 'var(--radius-btn)',
                  fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
                  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <Play size={13} fill="var(--primary)" color="var(--primary)" />
                See how it works
              </motion.button>
            </motion.div>

            {/* Three micro-stats */}
            <motion.div variants={fade} style={{
              display: 'flex', gap: 28, marginTop: 40, paddingTop: 32,
              borderTop: '1px solid var(--border)', flexWrap: 'wrap',
            }}>
              {[
                { value: '89%', label: 'Avg. evaluation accuracy' },
                { value: '<30s', label: 'Per interview scored' },
                { value: '70%', label: 'Fewer screening calls' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.03em' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right column: hero visual card ── */}
          <motion.div
            variants={fade}
            style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {/* Glow behind card */}
            <div style={{
              position: 'absolute', inset: -40,
              background: 'radial-gradient(ellipse, var(--glow-radial) 0%, transparent 70%)',
              filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
            }} />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'relative', zIndex: 1, width: '100%', maxWidth: 430,
                background: 'var(--card-float-bg)',
                border: '1px solid var(--card-float-border)',
                borderRadius: 24, padding: 28,
                boxShadow: 'var(--card-float-shadow)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Card top-bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb7185' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  AI Interview — Live
                </span>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700, color: 'var(--success)',
                  background: 'rgba(74,124,63,0.12)', padding: '3px 8px', borderRadius: 999,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                  LIVE
                </div>
              </div>

              {/* Candidate row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                  alt="Candidate"
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Priya Sharma</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Full Stack Developer · Applying</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                    borderRadius: 999, padding: '4px 12px',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    Recommended
                  </div>
                </div>
              </div>

              {/* Active question bubble */}
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 14, padding: '12px 14px', marginBottom: 16,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MessageSquare size={10} />
                  AI Question
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>
                  Describe how you would design a fault-tolerant microservices architecture for a high-traffic e-commerce platform.
                </p>
              </div>

              {/* Score bars */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Evaluation
                </div>
                <HeroBar label="Communication"       value={87} />
                <HeroBar label="Confidence"          value={81} />
                <HeroBar label="Technical Depth"     value={91}
                  color="linear-gradient(90deg, var(--gradient-start), var(--gradient-end))" />
              </div>
            </motion.div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              style={{
                position: 'absolute', top: '5%', right: 0, zIndex: 5,
                background: 'var(--card-float-bg)',
                border: '1px solid var(--card-float-border)',
                borderRadius: 14, padding: '10px 16px',
                boxShadow: 'var(--card-float-shadow)',
                fontSize: 12, fontWeight: 700, color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <TrendingUp size={13} color="var(--success)" />
              Evaluated in 22s
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ai-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
};

export default AIHero;
