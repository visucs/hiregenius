import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, MessageSquare, Target,
  History, Settings, Mic, X, Plus, LogOut,
  ChevronRight, ChevronLeft, Sparkles, Bell,
  Sun, Moon, Search, ChevronDown, Menu, HelpCircle,
  Command,
} from 'lucide-react';
import { logout, selectUser, selectUserRole } from '../features/auth/authSlice';
import useTheme from '../hooks/useTheme';

/* ─── Candidate nav groups ───────────────────────────────────── */
const CANDIDATE_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/candidate/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    ],
  },
  {
    label: 'My Career',
    items: [
      { to: '/candidate/applications', label: 'Applications', icon: FileText         },
      { to: '/candidate/interviews',   label: 'My Interviews',icon: MessageSquare    },
      { to: '/candidate/resume-score', label: 'Resume Score', icon: Target           },
      { to: '/candidate/scan-history', label: 'Scan History', icon: History          },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/candidate/settings',     label: 'Settings',     icon: Settings         },
    ],
  },
];

const MOCK_NOTIFS = [
  { id: 'n1', title: 'Resume scored',      body: 'Score: 82 — Senior Frontend Eng', time: '5m',  unread: true  },
  { id: 'n2', title: 'Interview ready',    body: 'AI Interview session unlocked',   time: '1h',  unread: true  },
  { id: 'n3', title: 'New match',          body: '3 jobs match your profile',       time: '2h',  unread: false },
];

const getInitials = (name) => {
  if (!name) return 'C';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase();
};

/* ════════════════════════════════════════════════════════════════
   CANDIDATE SIDEBAR
════════════════════════════════════════════════════════════════ */
const CandidateSidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }) => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useSelector(selectUser);
  const initials  = getInitials(user?.name);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  const handleResumeCheck = () => {
    if (location.pathname === '/candidate/dashboard') {
      document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/candidate/dashboard');
      setTimeout(() => document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    }
    onClose();
  };

  const renderSidebarContent = (collapsed, isMobile = false) => {
    const navItem = (to, label, Icon) => (
      <NavLink
        key={to}
        to={to}
        onClick={onClose}
        title={collapsed ? label : undefined}
        id={`cand-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
        style={({ isActive }) => ({
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 10,
          padding: collapsed ? '10px 0' : '10px 12px',
          minHeight: isMobile ? 44 : 38,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 11, fontSize: 13, fontWeight: isActive ? 700 : 500,
          textDecoration: 'none', cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: isActive
            ? 'linear-gradient(135deg, rgba(61,80,22,0.85), rgba(107,138,58,0.50))'
            : 'transparent',
          color: isActive ? '#fff' : 'rgba(180,210,130,0.65)',
          boxShadow: isActive ? '0 2px 14px rgba(61,80,22,0.40)' : 'none',
        })}
        onMouseEnter={e => {
          if (!window.location.pathname.startsWith(to)) {
            e.currentTarget.style.background = 'rgba(107,138,58,0.13)';
            e.currentTarget.style.color = '#fff';
          }
        }}
        onMouseLeave={e => {
          if (!window.location.pathname.startsWith(to)) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(180,210,130,0.65)';
          }
        }}
      >
        {({ isActive }) => (
          <>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
            }}>
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.75} />
            </div>
            {!collapsed && <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>}
            {!collapsed && isActive && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
            )}
          </>
        )}
      </NavLink>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* ── Logo ─────────────────────────────────────────────── */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 10px' : '0 16px',
          borderBottom: '1px solid rgba(107,138,58,0.15)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 11, flexShrink: 0,
              background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(107,138,58,0.35), 0 4px 18px rgba(61,80,22,0.6)',
            }}>
              <Sparkles size={16} color="#fff" strokeWidth={2} />
            </div>
            {!collapsed && (
              <div>
                <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>HireGenius</p>
                <p style={{ fontSize: 9, color: 'rgba(107,138,58,0.85)', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginTop: 2 }}>
                  Candidate Portal
                </p>
              </div>
            )}
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(107,138,58,0.25)',
                color: 'rgba(240,237,228,0.85)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close menu"
              id="cand-sidebar-close-btn"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Resume Check CTA ─────────────────────────────────── */}
        <div style={{ padding: collapsed ? '10px 8px' : '12px 10px', flexShrink: 0 }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            id="sidebar-new-resume-check"
            onClick={handleResumeCheck}
            title="New Resume Check"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              minHeight: isMobile ? 44 : 38,
              gap: 8, padding: collapsed ? '10px 0' : '10px 14px',
              borderRadius: 12, border: '1px solid rgba(107,138,58,0.30)', cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(61,80,22,0.85), rgba(107,138,58,0.65))',
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 12px rgba(61,80,22,0.40)', transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(61,80,22,0.6)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(61,80,22,0.40)'}
          >
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={14} strokeWidth={2.5} />
            </div>
            {!collapsed && <span>New Resume Check</span>}
          </motion.button>
        </div>

        {/* ── Nav Groups ────────────────────────────────────────── */}
        <nav
          style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}
          aria-label="Candidate navigation"
        >
          {CANDIDATE_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'rgba(107,138,58,0.70)',
                  padding: '4px 10px', marginBottom: 4,
                }}>
                  {group.label}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map(item => navItem(item.to, item.label, item.icon))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── AI Interview Practice Banner ──────────────────────── */}
        {!collapsed && (
          <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(61,80,22,0.50), rgba(107,138,58,0.25))',
              border: '1px solid rgba(107,138,58,0.25)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <Mic size={14} style={{ color: '#a3e635' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#e8f5d4' }}>Practice AI Interview</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(180,210,130,0.60)', lineHeight: 1.4, marginBottom: 8 }}>
                Generate questions tailored to your target job.
              </p>
              <NavLink
                to="/candidate/interviews"
                onClick={onClose}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700, color: '#a3e635',
                  textDecoration: 'none',
                }}
              >
                Start session <ChevronRight size={11} />
              </NavLink>
            </div>
          </div>
        )}

        {/* ── Help item ─────────────────────────────────────────── */}
        <div style={{ padding: '2px 8px', flexShrink: 0 }}>
          <div
            onClick={onClose}
            title={collapsed ? 'Help & Support' : undefined}
            style={{
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '10px 0' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 11, color: 'rgba(180,210,130,0.50)',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,138,58,0.10)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(180,210,130,0.50)'; }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HelpCircle size={16} strokeWidth={1.75} />
            </div>
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Help & Support</span>}
          </div>
        </div>

        {/* ── User card ─────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(107,138,58,0.14)', padding: collapsed ? '10px 8px' : '10px 10px', flexShrink: 0 }}>
          {collapsed ? (
            <div style={{
              width: 38, height: 38, borderRadius: '50%', margin: '0 auto',
              background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 800,
              boxShadow: '0 2px 10px rgba(61,80,22,0.4)',
            }} title={user?.name}>{initials}</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 13, background: 'rgba(107,138,58,0.09)', border: '1px solid rgba(107,138,58,0.18)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: '0 2px 10px rgba(61,80,22,0.4)' }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? 'Candidate'}</p>
                <span style={{ display: 'inline-block', marginTop: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '1px 7px', borderRadius: 999, background: 'rgba(107,138,58,0.25)', color: 'rgba(163,230,53,0.90)' }}>Candidate</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                id="cand-sidebar-logout"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.6)', padding: 6, borderRadius: 8, flexShrink: 0, display: 'flex', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.10)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; e.currentTarget.style.background = 'none'; }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── Collapse toggle ── desktop only ── */}
        {!isMobile && (
          <motion.button
            className="hidden md:flex"
            whileTap={{ scale: 0.96 }}
            onClick={onToggleCollapse}
            id="cand-sidebar-collapse-btn"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              width: '100%', padding: collapsed ? '12px 0' : '11px 20px',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid rgba(107,138,58,0.14)',
              color: 'rgba(107,138,58,0.45)',
              cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,138,58,0.08)'; e.currentTarget.style.color = 'rgba(163,230,53,0.80)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(107,138,58,0.45)'; }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={collapsed ? 'open' : 'close'}
                initial={{ rotate: -20, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 20, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </motion.div>
            </AnimatePresence>
            {!collapsed && <span>Collapse sidebar</span>}
          </motion.button>
        )}
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 62 : 256 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-40 overflow-hidden"
        style={{
          background: 'linear-gradient(175deg, #18280a 0%, #0e1804 55%, #091203 100%)',
          borderRight: '1px solid rgba(107,138,58,0.18)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.22)',
        }}
        aria-label="Candidate navigation"
      >
        {renderSidebarContent(isCollapsed, false)}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] flex flex-col md:hidden overflow-hidden"
            style={{
              background: 'linear-gradient(175deg, #18280a 0%, #0e1804 100%)',
              borderRight: '1px solid rgba(107,138,58,0.20)',
              boxShadow: '8px 0 36px rgba(0,0,0,0.65)',
            }}
          >
            {renderSidebarContent(false, true)}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════
   CANDIDATE TOPBAR (Navbar)
════════════════════════════════════════════════════════════════ */
const CandidateTopbar = ({ onMenuToggle }) => {
  const { theme, toggleTheme }               = useTheme();
  const user                                 = useSelector(selectUser);
  const dispatch                             = useDispatch();
  const navigate                             = useNavigate();
  const [showNotifs, setShowNotifs]          = useState(false);
  const [showUser,   setShowUser]            = useState(false);
  const [searchFocus, setSearchFocus]        = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const notifRef  = React.useRef(null);
  const userRef   = React.useRef(null);
  const initials  = getInitials(user?.name);
  const unread    = MOCK_NOTIFS.filter(n => n.unread).length;

  React.useEffect(() => {
    const h = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  /* ── Theme tokens matching the dark olive sidebar ── */
  const TB = {
    bg:         'rgba(14,24,4,0.97)',
    border:     'rgba(107,138,58,0.18)',
    inputBg:    'rgba(255,255,255,0.05)',
    inputBorder:'rgba(107,138,58,0.22)',
    iconBg:     'rgba(255,255,255,0.06)',
    iconBorder: 'rgba(107,138,58,0.20)',
    textPri:    '#e8f5d4',
    textMuted:  'rgba(163,210,90,0.50)',
    accent:     '#6B8A3A',
    accentSoft: 'rgba(107,138,58,0.18)',
  };

  const iconBtnStyle = {
    width: 36, height: 36, borderRadius: 10,
    background: TB.iconBg, border: `1px solid ${TB.iconBorder}`,
    color: TB.textMuted, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.14s ease', position: 'relative', flexShrink: 0,
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 30 }}>
      <style>{`
        @media (max-width: 480px) {
          .cand-dropdown-responsive {
            position: fixed !important;
            top: 66px !important;
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            max-width: calc(100vw - 24px) !important;
          }
        }
      `}</style>
      <header
        id="cand-topbar"
        style={{
          height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 clamp(10px, 3vw, 22px)', flexShrink: 0,
          background: TB.bg,
          backdropFilter: 'blur(20px) saturate(160%)',
          borderBottom: `1px solid ${TB.border}`,
          boxShadow: '0 1px 0 rgba(107,138,58,0.10), 0 4px 24px rgba(0,0,0,0.30)',
        }}
      >
        {/* ── Left: Hamburger + Search ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Mobile hamburger button */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={onMenuToggle}
            className="md:hidden flex items-center justify-center"
            style={{
              ...iconBtnStyle,
              minWidth: 44,
              minHeight: 44,
              color: TB.textPri,
            }}
            aria-label="Open navigation menu"
            id="cand-topbar-menu-toggle"
          >
            <Menu size={18} />
          </motion.button>

          {/* Mobile Search Toggle */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={() => setMobileSearchOpen(v => !v)}
            className="sm:hidden flex items-center justify-center"
            style={{
              ...iconBtnStyle,
              minWidth: 38,
              minHeight: 38,
              color: mobileSearchOpen ? '#a3e635' : TB.textMuted,
              borderColor: mobileSearchOpen ? TB.accent : TB.iconBorder,
            }}
            aria-label="Toggle search"
            id="cand-topbar-mobile-search-toggle"
          >
            <Search size={16} />
          </motion.button>

          {/* Desktop Search */}
          <div style={{ position: 'relative' }} className="hidden sm:block">
            <motion.div
              animate={{ opacity: searchFocus ? 1 : 0 }}
              transition={{ duration: 0.18 }}
              style={{ position: 'absolute', inset: -2, borderRadius: 14, background: 'linear-gradient(135deg, rgba(61,80,22,0.40), rgba(107,138,58,0.20))', pointerEvents: 'none', zIndex: 0 }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <motion.div animate={{ color: searchFocus ? '#6B8A3A' : TB.textMuted }} transition={{ duration: 0.15 }}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}
              ><Search size={14} /></motion.div>
              <input placeholder="Search jobs, interviews…"
                onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                id="cand-topbar-search"
                style={{
                  paddingLeft: 36, paddingRight: 72, height: 38, fontSize: 13, borderRadius: 12, width: 260,
                  background: searchFocus ? 'rgba(255,255,255,0.08)' : TB.inputBg,
                  border: `1px solid ${searchFocus ? 'rgba(107,138,58,0.55)' : TB.inputBorder}`,
                  color: TB.textPri, outline: 'none', transition: 'all 0.18s ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  boxShadow: searchFocus ? '0 0 0 3px rgba(61,80,22,0.25)' : 'none',
                }}
              />
              <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 800, color: TB.textMuted, background: 'rgba(255,255,255,0.06)', border: `1px solid ${TB.iconBorder}`, borderRadius: 6, padding: '2px 6px' }}>
                <Command size={8} />K
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>

          {/* Pulsing Active pill */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)', marginRight: 4 }}>
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 0 3px rgba(52,211,153,0.25)' }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>Active</span>
          </div>

          {/* Theme toggle */}
          <motion.button whileTap={{ scale: 0.88, rotate: 20 }} whileHover={{ scale: 1.06 }}
            onClick={toggleTheme} id="cand-topbar-theme" aria-label="Toggle theme"
            style={iconBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = TB.accent; e.currentTarget.style.color = TB.textPri; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = TB.iconBorder; e.currentTarget.style.color = TB.textMuted; }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={theme} initial={{ rotate: -30, opacity: 0, scale: 0.7 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 30, opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}>
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <motion.button whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}
              onClick={() => setShowNotifs(v => !v)}
              style={{ ...iconBtnStyle, borderColor: showNotifs ? TB.accent : TB.iconBorder, background: showNotifs ? TB.accentSoft : TB.iconBg, color: showNotifs ? '#a3e635' : TB.textMuted }}
              id="cand-topbar-notifications" aria-label="Notifications"
            >
              <Bell size={15} />
              {unread > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  style={{ position: 'absolute', top: 5, right: 5, width: 15, height: 15, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #f87171)', color: '#fff', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(14,24,4,0.97)', boxShadow: '0 0 0 2px rgba(239,68,68,0.28)' }}
                >{unread}</motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="cand-dropdown-responsive"
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 'min(330px, calc(100vw - 24px))', borderRadius: 20, zIndex: 100, background: '#0f1f05', border: '1px solid rgba(107,138,58,0.22)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}
                >
                  <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)' }} />
                  <div style={{ padding: '13px 16px 10px', borderBottom: '1px solid rgba(107,138,58,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(107,138,58,0.14)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={13} style={{ color: '#6B8A3A' }} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#e8f5d4', letterSpacing: '-0.01em' }}>Notifications</p>
                    </div>
                    {unread > 0 && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>{unread} new</span>}
                  </div>
                  {MOCK_NOTIFS.map((n, idx) => (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                      style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', background: n.unread ? 'rgba(61,80,22,0.12)' : 'transparent', borderBottom: idx < MOCK_NOTIFS.length - 1 ? '1px solid rgba(107,138,58,0.10)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,138,58,0.10)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(61,80,22,0.12)' : 'transparent'}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: n.unread ? '#6B8A3A' : 'rgba(107,138,58,0.25)', boxShadow: n.unread ? '0 0 0 3px rgba(107,138,58,0.20)' : 'none' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: n.unread ? 700 : 500, color: '#e8f5d4', lineHeight: 1.4 }}>{n.title}</p>
                        <p style={{ fontSize: 11, color: 'rgba(163,210,90,0.60)', marginTop: 2 }}>{n.body}</p>
                        <p style={{ fontSize: 10, color: 'rgba(163,210,90,0.40)', marginTop: 5, fontWeight: 600 }}>{n.time} ago</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(107,138,58,0.20)', margin: '0 3px' }} />

          {/* User chip */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
              onClick={() => setShowUser(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 4px', borderRadius: 13, background: showUser ? TB.accentSoft : TB.iconBg, border: `1px solid ${showUser ? TB.accent : TB.iconBorder}`, cursor: 'pointer', transition: 'all 0.14s' }}
              onMouseEnter={e => { if (!showUser) e.currentTarget.style.borderColor = TB.accent; }}
              onMouseLeave={e => { if (!showUser) e.currentTarget.style.borderColor = TB.iconBorder; }}
              id="cand-topbar-user"
            >
              <div style={{ position: 'relative' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 900, boxShadow: '0 2px 10px rgba(61,80,22,0.45)', letterSpacing: '-0.03em' }}>{initials}</div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#34d399', border: '1.5px solid rgba(14,24,4,0.97)', boxShadow: '0 0 0 2px rgba(52,211,153,0.25)' }} />
              </div>
              <div className="hidden md:block" style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: TB.textPri, lineHeight: 1, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{user?.name ?? 'Candidate'}</p>
                <p style={{ fontSize: 10, color: TB.accent, marginTop: 2, fontWeight: 700 }}>Candidate</p>
              </div>
              <motion.div animate={{ rotate: showUser ? 180 : 0 }} transition={{ duration: 0.2 }} className="hidden md:flex">
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showUser && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="cand-dropdown-responsive"
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 224, borderRadius: 18, zIndex: 100, background: '#0f1f05', border: '1px solid rgba(107,138,58,0.22)', boxShadow: '0 20px 60px rgba(0,0,0,0.55)', overflow: 'hidden' }}
                >
                  <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)' }} />
                  <div style={{ padding: '13px 13px 11px', background: 'linear-gradient(135deg, rgba(61,80,22,0.08), rgba(107,138,58,0.04))', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900, flexShrink: 0, boxShadow: '0 3px 12px rgba(61,80,22,0.40)' }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.22)', padding: '2px 7px', borderRadius: 999, marginTop: 5 }}>● Active</span>
                    </div>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <NavLink to="/candidate/settings" onClick={() => setShowUser(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 11, textDecoration: 'none', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--card-row-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--card-row-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Settings size={13} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      Settings
                    </NavLink>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <button onClick={handleLogout} id="cand-topbar-logout"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 11, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#f87171', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogOut size={13} style={{ color: '#f87171' }} />
                      </div>
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Expandable Mobile Search */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="sm:hidden overflow-hidden"
            style={{
              background: TB.bg,
              borderBottom: `1px solid ${TB.border}`,
              padding: '8px 12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TB.textMuted }} />
              <input
                autoFocus
                placeholder="Search jobs, interviews…"
                id="cand-topbar-mobile-search-input"
                style={{
                  width: '100%',
                  height: 38,
                  paddingLeft: 36,
                  paddingRight: 12,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${TB.inputBorder}`,
                  color: TB.textPri,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   APP SHELL — Candidate layout wrapper
════════════════════════════════════════════════════════════════ */
import React from 'react';

const AppShell = () => {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const role = useSelector(selectUserRole);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const h  = e => setSidebarCollapsed(e.matches);
    h(mq);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  /* Candidate gets the premium dark sidebar + topbar */
  if (role === 'CANDIDATE') {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
        <CandidateSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <CandidateTopbar onMenuToggle={() => setSidebarOpen(o => !o)} />
          <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-base)' }}>
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  /* Other roles — legacy layout (RecruiterShell / AdminShell handle their own) */
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-base)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
