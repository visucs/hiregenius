import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Sun, Moon, Menu, X, ChevronDown,
  FileSearch, BrainCircuit, Users, BarChart3,
  Calendar, Shield, Briefcase, Settings, Star, ChevronRight,
} from 'lucide-react';
import useTheme from '../../hooks/useTheme';

const PRODUCTS = [
  { icon: FileSearch,    label: 'Resume Screening',   tag: 'Fast',    desc: 'AI-scored resumes in <10s',        href: '/products/resume-screening', highlight: false },
  { icon: BrainCircuit,  label: 'AI Interview',        tag: 'Popular', desc: 'Auto-generate & evaluate Q&A',     href: '/products/ai-interview',      highlight: true  },
  { icon: Users,         label: 'Candidate Ranking',   tag: 'RAG',     desc: 'RAG-powered shortlisting',         href: '/products/candidate-ranking', highlight: false },
  { icon: BarChart3,     label: 'Analytics',           tag: 'Live',    desc: 'Hiring insights in real time',     href: '/products/analytics',         highlight: false },
  { icon: Calendar,      label: 'Interview Scheduler', tag: null,      desc: 'Calendar booking & alerts',        href: '#features',                   highlight: false },
  { icon: Shield,        label: 'Bias Checker',        tag: null,      desc: 'Fair, objective evaluation',       href: '#features',                   highlight: false },
  { icon: Briefcase,     label: 'Job Management',      tag: null,      desc: 'Post, track & close roles fast',   href: '#features',                   highlight: false },
  { icon: Settings,      label: 'Admin Controls',      tag: null,      desc: 'API keys, users & permissions',    href: '#features',                   highlight: false },
];

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Benefits',     href: '#benefits'     },
  { label: 'FAQ',          href: '#faq'          },
];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const dropRef = useRef(null);
  const hoverTimer = useRef(null);

  // Track scroll for navbar frosted glass background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [mobileOpen]);

  // Auto-close dropdown and mobile drawer on route / hash change
  useEffect(() => {
    setMobileOpen(false);
    setDropOpen(false);
  }, [location.pathname, location.hash]);

  // Handle escape key to dismiss menus
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setDropOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Handle outside click to close desktop dropdown
  useEffect(() => {
    const onMouseDown = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const openDrop = () => {
    clearTimeout(hoverTimer.current);
    setDropOpen(true);
  };

  const closeDrop = () => {
    hoverTimer.current = setTimeout(() => setDropOpen(false), 150);
  };

  // Cross-page smart anchor link navigation
  const handleAnchorClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const hash = href.slice(1);
      const targetEl =
        document.getElementById(hash) ||
        document.getElementById(`rs-${hash}`) ||
        document.getElementById(`ai-${hash}`) ||
        document.getElementById(`ap-${hash}`) ||
        document.querySelector(`[id$="${hash}"]`);

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/${href}`);
      }
      setMobileOpen(false);
      setDropOpen(false);
    }
  };

  // Handle product link clicks
  const handleProductLinkClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      if (location.pathname === '/') {
        const el = document.getElementById(href.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/${href}`);
      }
    }
    setMobileOpen(false);
    setDropOpen(false);
  };

  /* ── Design Tokens ─────────────────────────────────────────── */
  const navBg = scrolled ? 'rgba(10,14,5,0.92)' : 'rgba(10,14,5,0.0)';
  const navBorder = scrolled ? 'rgba(107,138,58,0.18)' : 'rgba(107,138,58,0.0)';
  const textPri = '#F0EDE4';
  const textMuted = 'rgba(240,237,228,0.52)';

  return (
    <>
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          background: navBg,
          backdropFilter: scrolled ? 'blur(24px) saturate(160%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(160%)' : 'none',
          borderBottom: `1px solid ${navBorder}`,
          transition: 'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 clamp(14px, 3vw, 32px)',
            position: 'relative',
          }}
        >
          {/* ── Brand Logo ─────────────────────────────────── */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              flexShrink: 0,
              minHeight: 44,
            }}
            aria-label="HireGenius AI Home"
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(61,80,22,0.45), 0 0 0 1px rgba(107,138,58,0.30)',
              }}
            >
              <Sparkles size={15} color="#fff" />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: textPri,
                letterSpacing: '-0.025em',
                whiteSpace: 'nowrap',
              }}
            >
              HireGenius{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #6B8A3A, #a3c55a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI
              </span>
            </span>
          </Link>

          {/* ── Desktop & Tablet Navigation (>= 768px) ────────── */}
          <div className="hidden md:flex items-center gap-1" ref={dropRef}>
            {/* Products dropdown trigger */}
            <div onMouseEnter={openDrop} onMouseLeave={closeDrop} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropOpen((v) => !v)}
                aria-expanded={dropOpen}
                aria-haspopup="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 13px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: dropOpen ? textPri : textMuted,
                  background: dropOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = textPri;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!dropOpen) {
                    e.currentTarget.style.color = textMuted;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                Products
                <motion.span animate={{ rotate: dropOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={13} />
                </motion.span>
              </button>
            </div>

            {/* Anchor links */}
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => handleAnchorClick(e, href)}
                style={{
                  padding: '7px 13px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: textMuted,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = textPri;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = textMuted;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* ── Centered Mega-Menu Dropdown Panel ────────────── */}
          <AnimatePresence>
            {dropOpen && (
              <motion.div
                onMouseEnter={openDrop}
                onMouseLeave={closeDrop}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:block"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 720,
                  maxWidth: 'calc(100vw - 32px)',
                  background: 'rgba(12,18,6,0.98)',
                  border: '1px solid rgba(107,138,58,0.22)',
                  borderRadius: 20,
                  boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(107,138,58,0.12)',
                  backdropFilter: 'blur(32px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(32px) saturate(160%)',
                  overflow: 'hidden',
                  zIndex: 200,
                }}
              >
                {/* Products 2-column grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 4,
                    padding: 14,
                    borderBottom: '1px solid rgba(107,138,58,0.14)',
                  }}
                >
                  {PRODUCTS.map(({ icon: Icon, label, tag, desc, href, highlight }) => {
                    const isInternal = href.startsWith('/');
                    const El = isInternal ? Link : 'a';
                    const linkProps = isInternal ? { to: href } : { href };

                    return (
                      <El
                        key={label}
                        {...linkProps}
                        onClick={(e) => handleProductLinkClick(e, href)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 12,
                          textDecoration: 'none',
                          background: highlight ? 'rgba(107,138,58,0.12)' : 'transparent',
                          border: highlight ? '1px solid rgba(107,138,58,0.24)' : '1px solid transparent',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(107,138,58,0.14)';
                          e.currentTarget.style.borderColor = 'rgba(107,138,58,0.24)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = highlight ? 'rgba(107,138,58,0.12)' : 'transparent';
                          e.currentTarget.style.borderColor = highlight ? 'rgba(107,138,58,0.24)' : 'transparent';
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            flexShrink: 0,
                            marginTop: 1,
                            background: highlight ? 'rgba(107,138,58,0.22)' : 'rgba(255,255,255,0.06)',
                            border: highlight ? '1px solid rgba(107,138,58,0.35)' : '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={15} style={{ color: highlight ? '#a3c55a' : 'rgba(240,237,228,0.60)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: highlight ? '#a3c55a' : textPri,
                                lineHeight: 1.2,
                              }}
                            >
                              {label}
                            </span>
                            {tag && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 999,
                                  background: 'rgba(107,138,58,0.25)',
                                  border: '1px solid rgba(107,138,58,0.35)',
                                  color: '#a3c55a',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {tag}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.45)', lineHeight: 1.35 }}>
                            {desc}
                          </div>
                        </div>
                      </El>
                    );
                  })}
                </div>

                {/* Bottom strip: Promo + Pricing card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
                  {/* Free trial promo */}
                  <div style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(61,80,22,0.14) 0%, rgba(107,138,58,0.06) 100%)',
                        pointerEvents: 'none',
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: textPri, marginBottom: 4 }}>
                        Screen your first{' '}
                        <span
                          style={{
                            background: 'linear-gradient(135deg, #6B8A3A, #a3c55a)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          10 resumes free
                        </span>
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(240,237,228,0.45)', marginBottom: 12 }}>
                        AI scoring, skills match & ranked shortlist — no credit card needed.
                      </p>
                      <Link
                        to="/register"
                        onClick={() => setDropOpen(false)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                          color: '#fff',
                          textDecoration: 'none',
                          boxShadow: '0 4px 16px rgba(61,80,22,0.40)',
                        }}
                      >
                        Start Free <ArrowRight size={11} />
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={10} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                        ))}
                        <span style={{ fontSize: 10, color: 'rgba(240,237,228,0.35)' }}>500+ hiring teams</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing card */}
                  <div
                    style={{
                      width: 200,
                      padding: '16px 18px',
                      background: 'linear-gradient(160deg, #1a2d0a 0%, #0e1906 100%)',
                      borderLeft: '1px solid rgba(107,138,58,0.18)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      HireGenius Pro
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                        From{' '}
                        <span
                          style={{
                            background: 'linear-gradient(135deg,#a3c55a,#6B8A3A)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          $29
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        /month, billed annually
                      </div>
                    </div>
                    <Link
                      to="/register"
                      onClick={() => setDropOpen(false)}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '8px 0',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#fff',
                        color: '#0e0c22',
                        textDecoration: 'none',
                        marginTop: 4,
                      }}
                    >
                      Upgrade Now
                    </Link>
                    <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.30)', textAlign: 'center' }}>
                      All 8 modules included
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Right Actions ──────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(240,237,228,0.60)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = textPri;
                e.currentTarget.style.borderColor = 'rgba(107,138,58,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(240,237,228,0.60)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Desktop / Tablet Login link (>= 640px) */}
            <Link
              to="/login"
              id="landing-nav-login"
              className="hidden sm:inline-flex items-center"
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(240,237,228,0.70)',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.04)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = textPri;
                e.currentTarget.style.borderColor = 'rgba(107,138,58,0.35)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(240,237,228,0.70)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              Log in
            </Link>

            {/* Desktop / Tablet Get Started CTA (>= 640px) */}
            <Link
              to="/register"
              id="landing-nav-get-started"
              className="hidden sm:inline-flex items-center"
              style={{
                gap: 6,
                padding: '7px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                color: '#fff',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 0 1px rgba(107,138,58,0.40), 0 4px 16px rgba(61,80,22,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(107,138,58,0.60), 0 6px 24px rgba(61,80,22,0.55)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(107,138,58,0.40), 0 4px 16px rgba(61,80,22,0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get Started <ArrowRight size={12} />
            </Link>

            {/* Mobile Hamburger / Close toggle (< 768px) */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex md:hidden items-center justify-center"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.10)',
                background: mobileOpen ? 'rgba(107,138,58,0.18)' : 'rgba(255,255,255,0.05)',
                color: textPri,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Menu Backdrop Overlay ───────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
            className="md:hidden"
            style={{
              position: 'fixed',
              top: 64,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 98,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Menu Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden"
            style={{
              position: 'fixed',
              top: 64,
              left: 0,
              right: 0,
              zIndex: 99,
              maxHeight: 'calc(100dvh - 64px)',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              background: 'rgba(10,14,5,0.98)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderBottom: '1px solid rgba(107,138,58,0.22)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
              padding: '16px clamp(12px, 3.5vw, 24px) 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Products Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '2px 4px',
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: 'rgba(163,197,90,0.80)',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                }}
              >
                Platform Modules
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: 'rgba(240,237,228,0.45)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '2px 7px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                8 Features
              </span>
            </div>

            {/* Products List (All 8 Products) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                gap: 6,
              }}
            >
              {PRODUCTS.map(({ icon: Icon, label, tag, desc, href, highlight }) => {
                const isInternal = href.startsWith('/');
                const El = isInternal ? Link : 'a';
                const linkProps = isInternal ? { to: href } : { href };

                return (
                  <El
                    key={label}
                    {...linkProps}
                    onClick={(e) => handleProductLinkClick(e, href)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 48,
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      background: highlight ? 'rgba(107,138,58,0.12)' : 'rgba(255,255,255,0.03)',
                      border: highlight ? '1px solid rgba(107,138,58,0.25)' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: highlight ? 'rgba(107,138,58,0.22)' : 'rgba(107,138,58,0.14)',
                        border: '1px solid rgba(107,138,58,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} style={{ color: '#a3c55a' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: highlight ? '#a3c55a' : textPri,
                          }}
                        >
                          {label}
                        </span>
                        {tag && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: 'rgba(107,138,58,0.25)',
                              color: '#a3c55a',
                            }}
                          >
                            {tag}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(240,237,228,0.40)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {desc}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'rgba(240,237,228,0.25)', flexShrink: 0 }} />
                  </El>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(107,138,58,0.14)', margin: '2px 0' }} />

            {/* Anchor Nav Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => handleAnchorClick(e, href)}
                  style={{
                    padding: '10px 14px',
                    minHeight: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: 'rgba(240,237,228,0.80)',
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                  <ChevronRight size={14} style={{ color: 'rgba(240,237,228,0.25)' }} />
                </a>
              ))}
            </div>

            {/* Bottom Login & Get Started CTAs */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  flex: 1,
                  minHeight: 46,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 0',
                  borderRadius: 10,
                  border: '1px solid rgba(107,138,58,0.30)',
                  color: 'rgba(240,237,228,0.85)',
                  textDecoration: 'none',
                  fontSize: 13.5,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                style={{
                  flex: 1,
                  minHeight: 46,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 0',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 13.5,
                  fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(61,80,22,0.45)',
                }}
              >
                Get Started <ArrowRight size={13} />
              </Link>
            </div>

            {/* Micro banner */}
            <p
              style={{
                fontSize: 11,
                color: 'rgba(240,237,228,0.40)',
                textAlign: 'center',
                margin: '2px 0 0',
              }}
            >
              ✨ Screen your first 10 resumes free — no credit card needed
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavbar;
