import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ChevronRight, Check, Star, Zap } from 'lucide-react';
import GradientButton from '../../../../components/GradientButton/GradientButton';

const fade = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };

const RSHero = () => {
  const scrollToDemo = () => {
    document.getElementById('rs-how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      style={{
        paddingTop: 140,
        paddingBottom: 96,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-base)',
      }}
    >
      {/* Background glow blobs */}
      <div style={{
        position: 'absolute', top: '0%', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 500,
        background: 'radial-gradient(ellipse, var(--glow-radial) 0%, transparent 65%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div className="hero-dot-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
          className="hero-grid"
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
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Resume Screening</span>
              </div>
            </motion.div>

            {/* AI badge pill */}
            <motion.div variants={fade} style={{ marginBottom: 20 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 14px', borderRadius: 999,
                background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)',
                fontSize: 12, fontWeight: 600, color: 'var(--primary)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <Zap size={12} />
                AI-Powered · ML Scored · Instant
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1 variants={fade} className="hero-heading" style={{ marginBottom: 20, color: 'var(--text-primary)', textAlign: 'left' }}>
              Screen every resume in{' '}
              <span className="gradient-text">seconds,</span>
              {' '}not hours.
            </motion.h1>

            {/* Subtext */}
            <motion.p variants={fade} style={{
              fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)',
              maxWidth: 520, marginBottom: 36,
            }}>
              Upload a resume, and HireGenius AI instantly parses, scores, and ranks it against your
              job requirements — surfacing the best candidates before you read a single line.
            </motion.p>

            {/* Social proof */}
            <motion.div variants={fade} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} fill="var(--secondary)" color="var(--secondary)" />
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Trusted by <strong style={{ color: 'var(--text-primary)' }}>5,000+</strong> hiring teams
              </span>
              <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--primary)' }}>{"<10s"}</strong> average per resume
              </span>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fade} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <GradientButton to="/register" size="lg" id="rs-hero-cta">
                Try Resume Screening <ArrowRight size={16} />
              </GradientButton>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={scrollToDemo}
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
                { value: '92%', label: 'Avg. match accuracy' },
                { value: '10s', label: 'Per resume screened' },
                { value: '80%', label: 'Less manual review' },
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
                position: 'relative', zIndex: 1, width: '100%', maxWidth: 420,
                background: 'var(--card-float-bg)',
                border: '1px solid var(--card-float-border)',
                borderRadius: 24, padding: 28,
                boxShadow: 'var(--card-float-shadow)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Card top-bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb7185' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Resume Analysis Result
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

              {/* Candidate info row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                  alt="Candidate"
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Arjun Mehta</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Full Stack Developer · 4 yrs exp</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                    borderRadius: 999, padding: '4px 12px',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    Highly Recommended
                  </div>
                </div>
              </div>

              {/* Score ring row */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                {/* Ring */}
                <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                  <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="32" fill="transparent" stroke="var(--border)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="32" fill="transparent"
                      stroke="url(#hero-ring-grad)" strokeWidth="7"
                      strokeDasharray={201} strokeDashoffset={201 - 0.92 * 201}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="hero-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--gradient-start)" />
                        <stop offset="100%" stopColor="var(--gradient-end)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>92%</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>SCORE</span>
                  </div>
                </div>

                {/* Bars */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                  {[
                    { label: 'Skills Match', value: 88 },
                    { label: 'Experience',   value: 95 },
                    { label: 'Education',    value: 80 },
                  ].map((b, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{b.label}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{b.value}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 999, width: `${b.value}%`,
                          background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing skills chips */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Missing Skills
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['GraphQL', 'Kubernetes', 'Redis'].map(skill => (
                    <span key={skill} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)',
                      color: '#EF4444', fontWeight: 600,
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom strip: matched skills */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Matched Skills
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'].map(skill => (
                    <span key={skill} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(74,124,63,0.12)', border: '1px solid rgba(74,124,63,0.25)',
                      color: 'var(--success)', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <Check size={9} strokeWidth={3} />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Small floating badge: AI Parsed */}
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
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
              AI parsed in 8.2s
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Responsive style */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
};

export default RSHero;
