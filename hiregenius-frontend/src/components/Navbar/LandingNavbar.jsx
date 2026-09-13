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

  const isDark = theme === 'dark';
  const isLanding = location.pathname === '/';

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

  /* ── Design Tokens & Dynamic Surfaces ───────────────────────── */
  const textPri = isDark ? '#F0EDE4' : '#1A1F0E';
  const textMuted = isDark ? 'rgba(240,237,228,0.60)' : 'rgba(26,31,14,0.65)';

  // Floating pill styles for Landing page only; flush edge-to-edge for product pages
  const navStyle = isLanding
    ? {
        position: 'fixed',
        top: 'clamp(10px, 2vw, 16px)',
        left: 0,
        right: 0,
        margin: '0 auto',
        width: 'calc(100% - clamp(16px, 4vw, 32px))',
        maxWidth: 1240,
        height: 60,
        zIndex: 100,
        borderRadius: 'clamp(16px, 3vw, 999px)',
        background: isDark ? 'rgba(12, 18, 6, 0.78)' : 'rgba(250, 249, 245, 0.82)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(61, 80, 22, 0.12)',
        boxShadow: isDark
          ? '0 16px 40px rgba(0, 0, 0, 0.50), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)'
          : '0 12px 32px rgba(61, 80, 22, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.80)',
        transition: 'all 0.35s ease',
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        background: scrolled
          ? (isDark ? 'rgba(10,14,5,0.92)' : 'rgba(242,239,232,0.92)')
          : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(160%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(160%)' : 'none',
        borderBottom: scrolled
          ? (isDark ? '1px solid rgba(107,138,58,0.18)' : '1px solid rgba(61,80,22,0.12)')
          : '1px solid transparent',
        transition: 'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
      };

  return (
    <>
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={navStyle}
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
            padding: isLanding ? '0 clamp(12px, 2.5vw, 24px)' : '0 clamp(14px, 3vw, 32px)',
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
                  background: dropOpen
                    ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(61,80,22,0.08)')
                    : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = textPri;
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(61,80,22,0.08)';
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
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(61,80,22,0.08)';
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
                  top: 'calc(100% + 12px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 720,
                  maxWidth: 'calc(100vw - 32px)',
                  background: isDark ? 'rgba(14, 20, 8, 0.88)' : 'rgba(255, 255, 255, 0.90)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(61, 80, 22, 0.12)',
                  borderRadius: 20,
                  boxShadow: isDark
                    ? '0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 0 rgba(255,255,255,0.06)'
                    : '0 32px 80px rgba(61,80,22,0.12), inset 0 1px 0 0 rgba(255,255,255,0.80)',
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
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(61, 80, 22, 0.08)',
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
                          background: highlight
                            ? (isDark ? 'rgba(107,138,58,0.12)' : 'rgba(61,80,22,0.08)')
                            : 'transparent',
                          border: highlight
                            ? (isDark ? '1px solid rgba(107,138,58,0.24)' : '1px solid rgba(61,80,22,0.16)')
                            : '1px solid transparent',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(61,80,22,0.06)';
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(61,80,22,0.14)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = highlight
                            ? (isDark ? 'rgba(107,138,58,0.12)' : 'rgba(61,80,22,0.08)')
                            : 'transparent';
                          e.currentTarget.style.borderColor = highlight
                            ? (isDark ? '1px solid rgba(107,138,58,0.24)' : '1px solid rgba(61,80,22,0.16)')
                            : 'transparent';
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            flexShrink: 0,
                            marginTop: 1,
                            background: highlight
                              ? (isDark ? 'rgba(107,138,58,0.22)' : 'rgba(61,80,22,0.15)')
                              : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(61,80,22,0.06)'),
                            border: highlight
                              ? (isDark ? '1px solid rgba(107,138,58,0.35)' : '1px solid rgba(61,80,22,0.25)')
                              : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(61,80,22,0.10)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={15} style={{ color: highlight ? (isDark ? '#a3c55a' : '#3D5016') : (isDark ? 'rgba(240,237,228,0.60)' : '#4A5239') }} />
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
                                color: highlight ? (isDark ? '#a3c55a' : '#3D5016') : textPri,
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
                                  background: isDark ? 'rgba(107,138,58,0.25)' : 'rgba(61,80,22,0.12)',
                                  border: isDark ? '1px solid rgba(107,138,58,0.35)' : '1px solid rgba(61,80,22,0.20)',
                                  color: isDark ? '#a3c55a' : '#3D5016',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {tag}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: isDark ? 'rgba(240,237,228,0.45)' : 'rgba(26,31,14,0.55)', lineHeight: 1.35 }}>
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
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(61,80,22,0.14) 0%, rgba(107,138,58,0.06) 100%)'
                          : 'linear-gradient(135deg, rgba(61,80,22,0.08) 0%, rgba(107,138,58,0.03) 100%)',
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
                      <p style={{ fontSize: 11, color: isDark ? 'rgba(240,237,228,0.45)' : 'rgba(26,31,14,0.60)', marginBottom: 12 }}>
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
                        <span style={{ fontSize: 10, color: isDark ? 'rgba(240,237,228,0.35)' : 'rgba(26,31,14,0.45)' }}>500+ hiring teams</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing card */}
                  <div
                    style={{
                      width: 200,
                      padding: '16px 18px',
                      background: 'linear-gradient(160deg, #1a2d0a 0%, #0e1906 100%)',
                      borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(61,80,22,0.12)',
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
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
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
                    <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.40)', textAlign: 'center' }}>
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
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(61,80,22,0.15)',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(61,80,22,0.06)',
                color: isDark ? 'rgba(240,237,228,0.75)' : '#1A1F0E',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = textPri;
                e.currentTarget.style.borderColor = isDark ? 'rgba(107,138,58,0.35)' : 'rgba(61,80,22,0.30)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDark ? 'rgba(240,237,228,0.75)' : '#1A1F0E';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(61,80,22,0.15)';
              }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
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
                color: isDark ? 'rgba(240,237,228,0.75)' : '#1A1F0E',
                textDecoration: 'none',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(61,80,22,0.15)',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(61,80,22,0.04)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = textPri;
                e.currentTarget.style.borderColor = isDark ? 'rgba(107,138,58,0.35)' : 'rgba(61,80,22,0.30)';
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(61,80,22,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDark ? 'rgba(240,237,228,0.75)' : '#1A1F0E';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(61,80,22,0.15)';
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(61,80,22,0.04)';
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
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(61,80,22,0.15)',
                background: mobileOpen
                  ? (isDark ? 'rgba(107,138,58,0.18)' : 'rgba(61,80,22,0.12)')
                  : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(61,80,22,0.05)'),
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
              inset: 0,
              background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.40)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 98,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Full-Screen Mobile Glass Drawer ─────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(400px, 100vw)',
              zIndex: 99,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              background: isDark ? 'rgba(12,18,6,0.94)' : 'rgba(250,249,245,0.96)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(61,80,22,0.12)',
              boxShadow: isDark ? '-16px 0 50px rgba(0,0,0,0.7)' : '-16px 0 50px rgba(61,80,22,0.10)',
              padding: '20px clamp(16px, 4vw, 24px) 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Drawer Top Header: Logo + Close X */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(61,80,22,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={14} color="#fff" />
                </div>
                <span style={{ fontWeight: 800, fontSize: 14, color: textPri }}>
                  HireGenius <span style={{ color: '#a3c55a' }}>AI</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(61,80,22,0.08)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(61,80,22,0.12)',
                  color: textPri,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

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
                  color: isDark ? 'rgba(163,197,90,0.80)' : '#3D5016',
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
                  color: isDark ? 'rgba(240,237,228,0.45)' : 'rgba(26,31,14,0.55)',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(61,80,22,0.08)',
                  padding: '2px 7px',
                  borderRadius: 999,
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(61,80,22,0.12)',
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
                      background: highlight
                        ? (isDark ? 'rgba(107,138,58,0.12)' : 'rgba(61,80,22,0.08)')
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.70)'),
                      border: highlight
                        ? (isDark ? '1px solid rgba(107,138,58,0.25)' : '1px solid rgba(61,80,22,0.18)')
                        : (isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(61,80,22,0.10)'),
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: highlight
                          ? (isDark ? 'rgba(107,138,58,0.22)' : 'rgba(61,80,22,0.15)')
                          : (isDark ? 'rgba(107,138,58,0.14)' : 'rgba(61,80,22,0.08)'),
                        border: isDark ? '1px solid rgba(107,138,58,0.25)' : '1px solid rgba(61,80,22,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} style={{ color: isDark ? '#a3c55a' : '#3D5016' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: highlight ? (isDark ? '#a3c55a' : '#3D5016') : textPri,
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
                              background: isDark ? 'rgba(107,138,58,0.25)' : 'rgba(61,80,22,0.12)',
                              color: isDark ? '#a3c55a' : '#3D5016',
                            }}
                          >
                            {tag}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: isDark ? 'rgba(240,237,228,0.40)' : 'rgba(26,31,14,0.60)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {desc}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: isDark ? 'rgba(240,237,228,0.25)' : 'rgba(26,31,14,0.35)', flexShrink: 0 }} />
                  </El>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(61, 80, 22, 0.08)', margin: '2px 0' }} />

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
                    color: textPri,
                    textDecoration: 'none',
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.70)',
                    border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(61,80,22,0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                  <ChevronRight size={14} style={{ color: isDark ? 'rgba(240,237,228,0.25)' : 'rgba(26,31,14,0.35)' }} />
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
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(61,80,22,0.20)',
                  color: textPri,
                  textDecoration: 'none',
                  fontSize: 13.5,
                  fontWeight: 600,
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
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
                color: isDark ? 'rgba(240,237,228,0.40)' : 'rgba(26,31,14,0.55)',
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
