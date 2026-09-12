import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Users, FileSearch,
  MessageSquare, Trophy, CalendarDays, BarChart3,
  UserCircle, Settings, LogOut, Menu, X, Bell,
  Sun, Moon, Search, ChevronLeft, ChevronRight,
  Sparkles, ChevronDown, Plus, Zap, Command,
} from 'lucide-react';
import { logout, selectUser } from '../features/auth/authSlice';
import useTheme from '../hooks/useTheme';

/* ─── Nav configuration ──────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/recruiter/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
      { to: '/recruiter/analytics', label: 'Analytics',   icon: BarChart3 },
    ],
  },
  {
    label: 'Hiring',
    items: [
      { to: '/recruiter/jobs',             label: 'Jobs',               icon: Briefcase    },
      { to: '/recruiter/candidates',       label: 'Candidates',         icon: Users        },
      { to: '/recruiter/resume-screening', label: 'Resume Screening',   icon: FileSearch   },
      { to: '/recruiter/ranking',          label: 'Candidate Ranking',  icon: Trophy       },
    ],
  },
  {
    label: 'Interviews',
    items: [
      { to: '/recruiter/ai-interview', label: 'AI Interview',        icon: MessageSquare },
      { to: '/recruiter/scheduler',    label: 'Interview Scheduler', icon: CalendarDays  },
    ],
  },
];

const BOTTOM_ITEMS = [
  { to: '/recruiter/profile',  label: 'Profile',  icon: UserCircle },
  { to: '/recruiter/settings', label: 'Settings', icon: Settings   },
];

const MOCK_NOTIFS = [
  { id: 'n1', title: 'New application',   body: 'Priya S. applied to Backend Dev',       time: '5m',   unread: true  },
  { id: 'n2', title: 'Interview complete', body: 'Anjali K. finished AI interview',        time: '1h',   unread: true  },
  { id: 'n3', title: 'Resume scored',      body: 'Score 94 — ML Engineer position',       time: '3h',   unread: false },
  { id: 'n4', title: 'Shortlist updated',  body: 'Rahul M. moved to offer stage',         time: '1d',   unread: false },
];

const getInitials = (name) => {
  if (!name) return 'R';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase();
};

/* ════════════════════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════════════════════ */
const RecruiterSidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }) => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector(selectUser);
  const initials  = getInitials(user?.name);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  const navItem = (to, label, Icon) => (
    <NavLink
      key={to}
      to={to}
      onClick={onClose}
      title={isCollapsed ? label : undefined}
      id={`rec-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        gap: isCollapsed ? 0 : 10,
        padding: isCollapsed ? '10px 0' : '9px 12px',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        borderRadius: 11, fontSize: 13, fontWeight: isActive ? 700 : 500,
        textDecoration: 'none', cursor: 'pointer',
        transition: 'all 0.15s ease',
        background: isActive
          ? 'linear-gradient(135deg, rgba(61,80,22,0.90), rgba(107,138,58,0.55))'
          : 'transparent',
        color: isActive ? '#fff' : 'rgba(180,210,130,0.65)',
        boxShadow: isActive ? '0 2px 14px rgba(61,80,22,0.45)' : 'none',
        position: 'relative',
      })}
      onMouseEnter={e => {
        if (!window.location.pathname.startsWith(to.split('?')[0])) {
          e.currentTarget.style.background = 'rgba(107,138,58,0.13)';
          e.currentTarget.style.color = '#fff';
        }
      }}
      onMouseLeave={e => {
        if (!window.location.pathname.startsWith(to.split('?')[0])) {
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
            transition: 'background 0.15s',
          }}>
            <Icon size={16} strokeWidth={isActive ? 2.2 : 1.75} />
          </div>
          {!isCollapsed && <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>}
          {!isCollapsed && isActive && (
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
          )}
        </>
      )}
    </NavLink>
  );

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Logo row ─────────────────────────────────────────── */}
      <div style={{
        height: 62, display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: isCollapsed ? '0 10px' : '0 16px',
        borderBottom: '1px solid rgba(107,138,58,0.15)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Glow icon */}
          <div style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(107,138,58,0.35), 0 4px 18px rgba(61,80,22,0.6)',
          }}>
            <Sparkles size={16} color="#fff" strokeWidth={2} />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>HireGenius</p>
              <p style={{ fontSize: 9, color: 'rgba(107,138,58,0.85)', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginTop: 2 }}>
                Recruiter Portal
              </p>
            </motion.div>
          )}
        </div>
        <button onClick={onClose} className="md:hidden" style={{ background: 'none', border: 'none', color: 'rgba(107,138,58,0.7)', cursor: 'pointer', padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      {/* ── Post Job CTA ─────────────────────────────────────── */}
      <div style={{ padding: isCollapsed ? '10px 8px' : '12px 10px', flexShrink: 0 }}>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          title="Post a New Job"
          id="rec-sidebar-post-job"
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 8, padding: isCollapsed ? '10px 0' : '10px 14px',
            borderRadius: 12, border: '1px solid rgba(107,138,58,0.30)', cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(61,80,22,0.85), rgba(107,138,58,0.65))',
            color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 12px rgba(61,80,22,0.40)',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(61,80,22,0.6)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(61,80,22,0.40)'}
          onClick={() => navigate('/recruiter/jobs')}
        >
          <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={14} strokeWidth={2.5} />
          </div>
          {!isCollapsed && <span>Post a New Job</span>}
        </motion.button>
      </div>

      {/* ── Nav groups ───────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', scrollbarWidth: 'none' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {!isCollapsed && (
              <p style={{
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'rgba(107,138,58,0.45)',
                padding: gi === 0 ? '4px 10px 4px' : '10px 10px 4px',
              }}>
                {group.label}
              </p>
            )}
            {isCollapsed && gi > 0 && (
              <div style={{ height: 1, background: 'rgba(107,138,58,0.12)', margin: '8px 4px 6px' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(({ to, label, icon: Icon }) => navItem(to, label, Icon))}
            </div>
          </div>
        ))}

        {/* Bottom nav */}
        <div style={{ height: 1, background: 'rgba(107,138,58,0.12)', margin: '8px 4px' }} />
        {!isCollapsed && (
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(107,138,58,0.45)', padding: '2px 10px 4px' }}>Account</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => navItem(to, label, Icon))}
        </div>
      </nav>

      {/* ── User card ─────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(107,138,58,0.14)', padding: isCollapsed ? '10px 8px' : '10px 10px', flexShrink: 0 }}>
        {isCollapsed ? (
          <div style={{
            width: 38, height: 38, borderRadius: '50%', margin: '0 auto',
            background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 800,
            boxShadow: '0 2px 10px rgba(61,80,22,0.4)',
          }} title={user?.name}>{initials}</div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 13, background: 'rgba(107,138,58,0.09)', border: '1px solid rgba(107,138,58,0.18)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 800,
              boxShadow: '0 2px 10px rgba(61,80,22,0.4)',
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? 'Recruiter'}
              </p>
              <span style={{
                display: 'inline-block', marginTop: 3,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '1px 7px', borderRadius: 999,
                background: 'rgba(107,138,58,0.25)', color: 'rgba(163,230,53,0.90)',
              }}>Recruiter</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              id="rec-sidebar-logout"
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
      <motion.button
        className="hidden md:flex"
        whileTap={{ scale: 0.96 }}
        onClick={onToggleCollapse}
        id="rec-sidebar-collapse-btn"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: 10,
          width: '100%', padding: isCollapsed ? '12px 0' : '11px 20px',
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
            key={isCollapsed ? 'open' : 'close'}
            initial={{ rotate: -20, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 20, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </motion.div>
        </AnimatePresence>
        {!isCollapsed && <span>Collapse sidebar</span>}
      </motion.button>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 62 : 256 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-40 overflow-hidden"
        style={{
          background: 'linear-gradient(175deg, #18280a 0%, #0e1804 55%, #091203 100%)',
          borderRight: '1px solid rgba(107,138,58,0.18)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.25)',
        }}
        aria-label="Recruiter navigation"
      >
        {content}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 z-40 h-full w-64 flex flex-col md:hidden overflow-hidden"
            style={{
              background: 'linear-gradient(175deg, #18280a 0%, #0e1804 100%)',
              borderRight: '1px solid rgba(107,138,58,0.20)',
            }}
          >
            {content}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════
   TOPBAR
════════════════════════════════════════════════════════════════ */
const RecruiterTopbar = ({ onMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const user                   = useSelector(selectUser);
  const dispatch               = useDispatch();
  const navigate               = useNavigate();
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [showUser,     setShowUser]     = useState(false);
  const [searchFocus,  setSearchFocus]  = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);
  const initials = getInitials(user?.name);
  const unread   = MOCK_NOTIFS.filter(n => n.unread).length;

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

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
    <header
      id="rec-topbar"
      style={{
        height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 30,
        background: TB.bg,
        backdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: `1px solid ${TB.border}`,
        boxShadow: '0 1px 0 rgba(107,138,58,0.10), 0 4px 24px rgba(0,0,0,0.30)',
      }}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TB.textMuted, pointerEvents: 'none', zIndex: 1 }} />
          <input
            placeholder="Search jobs, candidates…"
            onFocus={e => { setSearchFocus(true); e.target.style.borderColor = 'rgba(107,138,58,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(61,80,22,0.25)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            onBlur={e => { setSearchFocus(false); e.target.style.borderColor = TB.inputBorder; e.target.style.boxShadow = 'none'; e.target.style.background = TB.inputBg; }}
            id="rec-topbar-search"
            style={{
              paddingLeft: 34, paddingRight: 70, height: 38, fontSize: 13,
              borderRadius: 12, width: 250,
              background: TB.inputBg,
              border: `1px solid ${TB.inputBorder}`,
              color: TB.textPri, outline: 'none',
              transition: 'all 0.18s ease',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
          <div style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: 2,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
            color: TB.textMuted, background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${TB.iconBorder}`, borderRadius: 5, padding: '1px 5px',
          }}>
            <Command size={8} />K
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Theme */}
        <motion.button
          whileTap={{ scale: 0.88, rotate: 15 }}
          onClick={toggleTheme}
          style={iconBtnStyle}
          aria-label="Toggle theme"
          id="rec-topbar-theme"
          onMouseEnter={e => { e.currentTarget.style.borderColor = TB.accent; e.currentTarget.style.color = TB.textPri; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = TB.iconBorder; e.currentTarget.style.color = TB.textMuted; }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={theme} initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            style={{ ...iconBtnStyle, borderColor: showNotifs ? TB.accent : TB.iconBorder, background: showNotifs ? TB.accentSoft : TB.iconBg, color: showNotifs ? '#a3e635' : TB.textMuted }}
            aria-label="Notifications"
            id="rec-topbar-notifications"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 16, height: 16, borderRadius: '50%',
                background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(14,24,4,0.97)',
                boxShadow: '0 0 0 2px rgba(239,68,68,0.25)',
              }}>{unread}</span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                exit={{   opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                  width: 340, borderRadius: 18, zIndex: 100,
                  background: '#0f1f05',
                  border: '1px solid rgba(107,138,58,0.22)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
                  overflow: 'hidden',
                }}
              >
                {/* Notif header */}
                <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid rgba(107,138,58,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#e8f5d4', letterSpacing: '-0.01em' }}>Notifications</p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                      {unread} new
                    </span>
                  </div>
                  <button style={{ fontSize: 11, color: TB.accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                </div>
                {MOCK_NOTIFS.map((n, idx) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    style={{
                      padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
                      background: n.unread ? 'rgba(61,80,22,0.12)' : 'transparent',
                      borderBottom: idx < MOCK_NOTIFS.length - 1 ? '1px solid rgba(107,138,58,0.10)' : 'none',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,138,58,0.10)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(61,80,22,0.12)' : 'transparent'}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                      background: n.unread ? '#6B8A3A' : 'rgba(107,138,58,0.25)',
                      boxShadow: n.unread ? '0 0 0 3px rgba(107,138,58,0.20)' : 'none',
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: n.unread ? 700 : 500, color: '#e8f5d4', lineHeight: 1.3 }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(163,210,90,0.60)', marginTop: 2, lineHeight: 1.4 }}>{n.body}</p>
                      <p style={{ fontSize: 10, color: 'rgba(163,210,90,0.40)', marginTop: 4 }}>{n.time} ago</p>
                    </div>
                  </motion.div>
                ))}
                <div style={{ padding: '10px 18px' }}>
                  <button style={{ width: '100%', fontSize: 12, fontWeight: 700, color: '#6B8A3A', background: 'rgba(107,138,58,0.10)', border: '1px solid rgba(107,138,58,0.22)', borderRadius: 10, padding: '8px', cursor: 'pointer' }}>
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ width: 1, height: 22, background: 'rgba(107,138,58,0.20)', margin: '0 2px' }} />

        {/* User chip */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowUser(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 10px 5px 5px', borderRadius: 12,
              background: showUser ? TB.accentSoft : TB.iconBg,
              border: `1px solid ${showUser ? TB.accent : TB.iconBorder}`,
              cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = TB.accent; }}
            onMouseLeave={e => { if (!showUser) e.currentTarget.style.borderColor = TB.iconBorder; }}
            id="rec-topbar-user"
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 800,
              boxShadow: '0 2px 8px rgba(61,80,22,0.35)',
            }}>{initials}</div>
            <div className="hidden md:block" style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TB.textPri, lineHeight: 1, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? 'Recruiter'}
              </p>
              <p style={{ fontSize: 10, color: TB.accent, marginTop: 2, fontWeight: 500 }}>Recruiter</p>
            </div>
            <ChevronDown size={13} className="hidden md:block" style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showUser ? 'rotate(180deg)' : 'rotate(0)' }} />
          </motion.button>

          <AnimatePresence>
            {showUser && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                exit={{   opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                  width: 220, borderRadius: 16, zIndex: 100,
                  background: '#0f1f05', border: '1px solid rgba(107,138,58,0.22)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.55)', overflow: 'hidden',
                }}
              >
                {/* User header */}
                <div style={{ padding: '14px 14px 12px', background: 'rgba(107,138,58,0.08)', borderBottom: '1px solid rgba(107,138,58,0.14)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800 }}>{initials}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e8f5d4' }}>{user?.name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(163,210,90,0.55)', marginTop: 1 }}>{user?.email ?? 'recruiter@company.com'}</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '6px' }}>
                  {[
                    { label: 'My Profile',  to: '/recruiter/profile',  icon: UserCircle },
                    { label: 'Settings',    to: '/recruiter/settings', icon: Settings   },
                  ].map(({ label, to, icon: Icon }) => (
                    <NavLink
                      key={to} to={to} onClick={() => setShowUser(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 500, color: '#e8f5d4', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,138,58,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}

                    >
                      <Icon size={15} style={{ color: 'var(--text-secondary)' }} /> {label}
                    </NavLink>
                  ))}
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    id="rec-topbar-logout"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#ef4444', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

/* ════════════════════════════════════════════════════════════════
   RECRUITER SHELL — Layout wrapper
════════════════════════════════════════════════════════════════ */
const RecruiterShell = () => {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1280px)');
    const h  = (e) => setSidebarCollapsed(e.matches);
    h(mq);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  return (
    <div
      style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}
    >
      <RecruiterSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      {/* Main content column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <RecruiterTopbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-base)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RecruiterShell;
