import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Sun, Moon, Menu, X, ChevronDown,
  FileSearch, BrainCircuit, Users, BarChart3,
  Calendar, Shield, Briefcase, Settings,
  Star,
} from 'lucide-react';
import GradientButton from '../GradientButton/GradientButton';
import useTheme from '../../hooks/useTheme';

/* ── 8 product items in 4×2 grid ─────────────────────────────── */
const PRODUCTS = [
  { icon: FileSearch, label: 'Resume Screening', desc: 'AI-scored resumes in <10s', href: '#features', highlight: false },
  { icon: BrainCircuit, label: 'AI Interview', desc: 'Auto-generate & evaluate Q&A', href: '#features', highlight: true },
  { icon: Users, label: 'Candidate Ranking', desc: 'RAG-powered shortlisting', href: '#features', highlight: false },
  { icon: BarChart3, label: 'Analytics', desc: 'Hiring insights in real time', href: '#features', highlight: false },
  { icon: Calendar, label: 'Interview Scheduler', desc: 'Calendar booking & notifications', href: '#features', highlight: false },
  { icon: Shield, label: 'Bias Checker', desc: 'Fair, objective evaluation', href: '#features', highlight: false },
  { icon: Briefcase, label: 'Job Management', desc: 'Post, track & close roles fast', href: '#features', highlight: false },
  { icon: Settings, label: 'Admin Controls', desc: 'API keys, users & permissions', href: '#features', highlight: false },
];

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'FAQ', href: '#faq' },
];

/* ── Component ───────────────────────────────────────────────── */
const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const dropRef = useRef(null);
  const hoverTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hover open with tiny delay to avoid flicker
  const openDrop = () => { clearTimeout(hoverTimer.current); setDropOpen(true); };
  const closeDrop = () => { hoverTimer.current = setTimeout(() => setDropOpen(false), 120); };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: '68px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 40px',
          transition: 'background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease',
          background: scrolled ? 'rgba(10,14,26,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
          }}>
            <Sparkles size={17} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            HireGenius{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI</span>
          </span>
        </Link>

        {/* Center nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden md:flex">

          {/* ── Products mega-dropdown ───────────────────────── */}
          <div
            ref={dropRef}
            onMouseEnter={openDrop}
            onMouseLeave={closeDrop}
            style={{ position: 'relative' }}
          >
            <button
              onClick={() => setDropOpen(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: dropOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              Products
              <motion.span animate={{ rotate: dropOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} />
              </motion.span>
            </button>

            <AnimatePresence>
              {dropOpen && (
                <motion.div
                  onMouseEnter={openDrop}
                  onMouseLeave={closeDrop}
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '720px',
                    maxWidth: 'calc(100vw - 80px)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(24px)',
                    overflow: 'hidden',
                    zIndex: 200,
                  }}
                >
                  {/* ── Top: 4×2 product grid ──────────────── */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 2,
                    padding: '16px 16px 12px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {PRODUCTS.map(({ icon: Icon, label, desc, href, highlight }) => (
                      <a
                        key={label}
                        href={href}
                        onClick={() => setDropOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', borderRadius: 10,
                          textDecoration: 'none',
                          background: highlight ? 'rgba(99,102,241,0.08)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!highlight) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={e => {
                          if (!highlight) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: highlight ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: 1,
                        }}>
                          <Icon size={15} style={{ color: highlight ? 'var(--primary)' : 'var(--text-secondary)' }} />
                        </div>
                        <div>
                          <div style={{
                            fontSize: 13, fontWeight: 600, lineHeight: 1.2, marginBottom: 3,
                            color: highlight ? 'var(--primary)' : 'var(--text-primary)',
                          }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {desc}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* ── Bottom: featured card + pricing card ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>

                    {/* Featured / promo card */}
                    <div style={{
                      padding: '18px 20px 20px',
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(34,211,238,0.04) 100%)',
                      borderRight: '1px solid var(--border)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {/* subtle bg grid texture */}
                      <div style={{
                        position: 'absolute', inset: 0, opacity: 0.03,
                        backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
                        backgroundSize: '24px 24px',
                        pointerEvents: 'none',
                      }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                          Screen your first{' '}
                          <span style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            10 resumes free
                          </span>
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                          AI scoring, skills match & ranked shortlist — no credit card needed.
                        </p>
                        <Link
                          to="/register"
                          onClick={() => setDropOpen(false)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                            color: '#fff', textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                          }}
                        >
                          Start Screening Free <ArrowRight size={12} />
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} size={11} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trusted by 500+ hiring teams</span>
                        </div>
                      </div>
                    </div>

                    {/* Upgrade / Pro card */}
                    <div style={{
                      width: 200, padding: '18px 20px 20px',
                      background: 'linear-gradient(160deg, #1a1040 0%, #0e0c22 100%)',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                    }}>
                      <div style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                        background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      }}>
                        HireGenius Pro
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                          From <span style={{ background: 'linear-gradient(135deg,#6366F1,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>$29</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>/month, billed annually</div>
                      </div>
                      <Link
                        to="/register"
                        onClick={() => setDropOpen(false)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'center',
                          padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: '#fff', color: '#0e0c22', textDecoration: 'none',
                          marginTop: 2,
                        }}
                      >
                        Upgrade Now
                      </Link>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', width: '100%' }}>
                        All 8 modules included
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >{label}</a>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={toggleTheme}
            style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link to="/login" id="landing-nav-login" style={{
            padding: '8px 18px', borderRadius: 'var(--radius-btn)', fontSize: 14, fontWeight: 500,
            color: 'var(--text-primary)', textDecoration: 'none', border: '1px solid var(--border)',
            whiteSpace: 'nowrap',
          }} className="hidden sm:inline-flex">Log in</Link>

          <GradientButton to="/register" size="sm" id="landing-nav-get-started">
            Get Started <ArrowRight size={13} />
          </GradientButton>

          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
            className="flex md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: '68px', left: 0, right: 0, zIndex: 99,
              background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(24px)',
              borderBottom: '1px solid var(--border)', padding: '16px 24px 24px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', marginBottom: 4 }}>Products</div>
            {PRODUCTS.map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                color: 'var(--text-secondary)', textDecoration: 'none',
              }}>
                <Icon size={15} /> {label}
              </a>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} style={{
                padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                color: 'var(--text-secondary)', textDecoration: 'none', display: 'block',
              }}>{label}</a>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Link to="/login" onClick={() => setMobileOpen(false)} style={{
                flex: 1, padding: '11px 0', textAlign: 'center', borderRadius: 12,
                border: '1px solid var(--border)', color: 'var(--text-primary)',
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
              }}>Log in</Link>
              <GradientButton to="/register" style={{ flex: 1 }}>Get Started</GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavbar;
