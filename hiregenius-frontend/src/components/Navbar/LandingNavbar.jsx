import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Sun, Moon, Menu, X, ChevronDown,
  FileSearch, BrainCircuit, Users, BarChart3,
  Calendar, Shield, Briefcase, Settings, Star, Zap,
} from 'lucide-react';
import useTheme from '../../hooks/useTheme';

const PRODUCTS = [
  { icon: FileSearch,    label: 'Resume Screening',  desc: 'AI-scored resumes in <10s',         href: '/products/resume-screening', highlight: false },
  { icon: BrainCircuit, label: 'AI Interview',       desc: 'Auto-generate & evaluate Q&A',      href: '/products/ai-interview',      highlight: true  },
  { icon: Users,        label: 'Candidate Ranking',  desc: 'RAG-powered shortlisting',          href: '/products/candidate-ranking', highlight: false },
  { icon: BarChart3,    label: 'Analytics',          desc: 'Hiring insights in real time',      href: '/products/analytics',         highlight: false },
  { icon: Calendar,     label: 'Interview Scheduler',desc: 'Calendar booking & notifications',  href: '#features',                   highlight: false },
  { icon: Shield,       label: 'Bias Checker',       desc: 'Fair, objective evaluation',        href: '#features',                   highlight: false },
  { icon: Briefcase,    label: 'Job Management',     desc: 'Post, track & close roles fast',    href: '#features',                   highlight: false },
  { icon: Settings,     label: 'Admin Controls',     desc: 'API keys, users & permissions',     href: '#features',                   highlight: false },
];

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Benefits',     href: '#benefits'     },
  { label: 'FAQ',          href: '#faq'          },
];

const LandingNavbar = () => {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const { theme, toggleTheme } = useTheme();
  const dropRef   = useRef(null);
  const hoverTimer= useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openDrop  = () => { clearTimeout(hoverTimer.current); setDropOpen(true);  };
  const closeDrop = () => { hoverTimer.current = setTimeout(() => setDropOpen(false), 140); };

  /* ── shared token shortcuts ─────────────────────────────────── */
  const navBg     = scrolled ? 'rgba(10,14,5,0.92)'    : 'rgba(10,14,5,0.0)';
  const navBorder = scrolled ? 'rgba(107,138,58,0.18)' : 'rgba(107,138,58,0.0)';
  const textPri   = '#F0EDE4';
  const textMuted = 'rgba(240,237,228,0.52)';
  const olive     = '#6B8A3A';

  return (
    <>
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0,   opacity: 1  }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          background: navBg,
          backdropFilter: scrolled ? 'blur(24px) saturate(160%)' : 'none',
          borderBottom: `1px solid ${navBorder}`,
          transition: 'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
        }}
      >
        {/* ── Logo ──────────────────────────────────────── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(61,80,22,0.45), 0 0 0 1px rgba(107,138,58,0.30)',
          }}>
            <Sparkles size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: textPri, letterSpacing: '-0.025em' }}>
            HireGenius{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6B8A3A, #a3c55a)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>AI</span>
          </span>
        </Link>

        {/* ── Center nav ────────────────────────────────── */}
        <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          {/* Products dropdown */}
          <div ref={dropRef} onMouseEnter={openDrop} onMouseLeave={closeDrop} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropOpen(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: dropOpen ? textPri : textMuted,
                background: dropOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = textPri; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!dropOpen) { e.currentTarget.style.color = textMuted; e.currentTarget.style.background = 'transparent'; } }}
            >
              Products
              <motion.span animate={{ rotate: dropOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={13} />
              </motion.span>
            </button>

            <AnimatePresence>
              {dropOpen && (
                <motion.div
                  onMouseEnter={openDrop} onMouseLeave={closeDrop}
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,   scale: 1    }}
                  exit={  { opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', left: '50%',
                    transform: 'translateX(-50%)',
                    width: 700, maxWidth: 'calc(100vw - 64px)',
                    background: 'rgba(12,18,6,0.97)',
                    border: '1px solid rgba(107,138,58,0.22)',
                    borderRadius: 20,
                    boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(107,138,58,0.10)',
                    backdropFilter: 'blur(32px) saturate(160%)',
                    overflow: 'hidden', zIndex: 200,
                  }}
                >
                  {/* 4×2 product grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 2, padding: '14px 14px 10px',
                    borderBottom: '1px solid rgba(107,138,58,0.12)',
                  }}>
                    {PRODUCTS.map(({ icon: Icon, label, desc, href, highlight }) => {
                      const isInternal = href.startsWith('/');
                      const El = isInternal ? Link : 'a';
                      const lp = isInternal ? { to: href } : { href };
                      return (
                        <El key={label} {...lp} onClick={() => setDropOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '10px 11px', borderRadius: 12, textDecoration: 'none',
                            background: highlight ? 'rgba(107,138,58,0.10)' : 'transparent',
                            border: highlight ? '1px solid rgba(107,138,58,0.20)' : '1px solid transparent',
                            transition: 'all 0.14s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,138,58,0.10)'; e.currentTarget.style.borderColor = 'rgba(107,138,58,0.18)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = highlight ? 'rgba(107,138,58,0.10)' : 'transparent'; e.currentTarget.style.borderColor = highlight ? 'rgba(107,138,58,0.20)' : 'transparent'; }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 1,
                            background: highlight ? 'rgba(107,138,58,0.18)' : 'rgba(255,255,255,0.05)',
                            border: highlight ? '1px solid rgba(107,138,58,0.30)' : '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={14} style={{ color: highlight ? '#a3c55a' : 'rgba(240,237,228,0.40)' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? '#a3c55a' : textPri, marginBottom: 2, lineHeight: 1.2 }}>{label}</div>
                            <div style={{ fontSize: 10, color: 'rgba(240,237,228,0.35)', lineHeight: 1.4 }}>{desc}</div>
                          </div>
                        </El>
                      );
                    })}
                  </div>

                  {/* Bottom strip: promo + pricing */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                    {/* Promo */}
                    <div style={{ padding: '16px 20px 18px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(61,80,22,0.12) 0%, rgba(107,138,58,0.05) 100%)', pointerEvents: 'none' }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: textPri, marginBottom: 4 }}>
                          Screen your first{' '}
                          <span style={{ background: 'linear-gradient(135deg, #6B8A3A, #a3c55a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            10 resumes free
                          </span>
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(240,237,228,0.40)', marginBottom: 12 }}>
                          AI scoring, skills match & ranked shortlist — no credit card needed.
                        </p>
                        <Link to="/register" onClick={() => setDropOpen(false)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                          color: '#fff', textDecoration: 'none',
                          boxShadow: '0 4px 16px rgba(61,80,22,0.40)',
                        }}>
                          Start Free <ArrowRight size={11} />
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                          {[1,2,3,4,5].map(n => <Star key={n} size={10} fill="#F59E0B" style={{ color: '#F59E0B' }} />)}
                          <span style={{ fontSize: 10, color: 'rgba(240,237,228,0.30)' }}>500+ hiring teams</span>
                        </div>
                      </div>
                    </div>
                    {/* Pricing card */}
                    <div style={{
                      width: 190, padding: '16px 18px 18px',
                      background: 'linear-gradient(160deg, #1a2d0a 0%, #0e1906 100%)',
                      borderLeft: '1px solid rgba(107,138,58,0.15)',
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'linear-gradient(135deg, #F59E0B, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        HireGenius Pro
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                          From <span style={{ background: 'linear-gradient(135deg,#a3c55a,#6B8A3A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>$29</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>/month, billed annually</div>
                      </div>
                      <Link to="/register" onClick={() => setDropOpen(false)} style={{
                        display: 'block', textAlign: 'center', padding: '8px 0',
                        borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: '#fff', color: '#0e0c22', textDecoration: 'none', marginTop: 2,
                      }}>
                        Upgrade Now
                      </Link>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>All 8 modules included</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href}
              style={{ padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: textMuted, textDecoration: 'none', transition: 'all 0.15s', border: '1px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.color = textPri; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = textMuted; e.currentTarget.style.background = 'transparent'; }}
            >{label}</a>
          ))}
        </div>

        {/* ── Right actions ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} aria-label="Toggle theme"
            style={{
              padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.05)', color: 'rgba(240,237,228,0.50)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = textPri; e.currentTarget.style.borderColor = 'rgba(107,138,58,0.30)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,237,228,0.50)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Login */}
          <Link to="/login" id="landing-nav-login"
            className="hidden sm:inline-flex"
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: 'rgba(240,237,228,0.65)', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.04)',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = textPri; e.currentTarget.style.borderColor = 'rgba(107,138,58,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,237,228,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            Log in
          </Link>

          {/* CTA */}
          <Link to="/register" id="landing-nav-get-started"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff',
              textDecoration: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 0 0 1px rgba(107,138,58,0.40), 0 4px 16px rgba(61,80,22,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1px rgba(107,138,58,0.60), 0 6px 24px rgba(61,80,22,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 1px rgba(107,138,58,0.40), 0 4px 16px rgba(61,80,22,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Get Started <ArrowRight size={12} />
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(v => !v)} className="flex md:hidden"
            style={{ padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.05)', color: textPri, cursor: 'pointer', display: 'flex' }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
              background: 'rgba(10,14,5,0.97)', backdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(107,138,58,0.18)',
              padding: '16px 20px 24px',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(107,138,58,0.50)', letterSpacing: '0.10em', textTransform: 'uppercase', padding: '4px 10px', marginBottom: 6 }}>Products</div>
            {PRODUCTS.slice(0, 4).map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'rgba(240,237,228,0.70)', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,138,58,0.10)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(107,138,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} style={{ color: '#6B8A3A' }} />
                </div>
                {label}
              </a>
            ))}
            <div style={{ height: 1, background: 'rgba(107,138,58,0.12)', margin: '8px 0' }} />
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)}
                style={{ padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'rgba(240,237,228,0.65)', textDecoration: 'none', display: 'block' }}
              >{label}</a>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Link to="/login" onClick={() => setMobileOpen(false)} style={{ flex: 1, padding: '11px 0', textAlign: 'center', borderRadius: 10, border: '1px solid rgba(107,138,58,0.22)', color: 'rgba(240,237,228,0.70)', textDecoration: 'none', fontSize: 13, fontWeight: 500, background: 'rgba(255,255,255,0.04)' }}>Log in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} style={{ flex: 1, padding: '11px 0', textAlign: 'center', borderRadius: 10, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Get Started</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavbar;
