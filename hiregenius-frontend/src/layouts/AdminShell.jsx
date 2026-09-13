import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BarChart3, Key,
  Settings, LogOut, Menu, X, Bell,
  Sun, Moon, Shield, ChevronLeft, ChevronRight,
  UserCircle, ChevronDown, Search, AlertTriangle,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { logout, selectUser } from '../features/auth/authSlice';
import useTheme from '../hooks/useTheme';

/* ─── Nav config ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/admin/users',     label: 'User Management',  icon: Users },
  { to: '/admin/analytics', label: 'Platform Analytics',icon: BarChart3 },
  { to: '/admin/api-keys',  label: 'AI Provider Keys', icon: Key },
  { to: '/admin/settings',  label: 'System Settings',  icon: Settings },
];

/* ─── Mock notifications ─────────────────────────────────────── */
const MOCK_ADMIN_NOTIFS = [
  { id: 'n1', text: 'New recruiter account: Meena Iyer registered', time: '12m ago', read: false },
  { id: 'n2', text: 'API quota at 80% — consider upgrading plan',   time: '2h ago',  read: false },
  { id: 'n3', text: 'System health check passed ✓',                 time: '6h ago',  read: true  },
];

/* ─── Avatar initials helper ─────────────────────────────────── */
const getInitials = (name) => {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};

/* ─── Admin color palette (indigo/violet, keeps identity) ─────── */
const ADMIN = {
  sidebarBg:   'linear-gradient(168deg, #1e1b4b 0%, #12103a 55%, #0c0a2e 100%)',
  border:      'rgba(99,102,241,0.20)',
  borderSub:   'rgba(99,102,241,0.14)',
  accent:      '#6366f1',
  accentSoft:  'rgba(99,102,241,0.15)',
  accentText:  '#a5b4fc',
  cardBg:      'rgba(99,102,241,0.09)',
  activeGrad:  'linear-gradient(135deg, rgba(79,70,229,0.85), rgba(124,58,237,0.55))',
  activeShadow:'0 2px 14px rgba(79,70,229,0.40)',
  textMuted:   'rgba(165,180,252,0.55)',
  textSub:     'rgba(165,180,252,0.75)',
  iconGrad:    'linear-gradient(135deg, #4f46e5, #7c3aed)',
};

/* ─── Shared sidebar item base ───────────────────────────────── */
const sidebarItemBase = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 12, fontSize: 13,
  fontWeight: 500, textDecoration: 'none', cursor: 'pointer',
  transition: 'all 0.15s ease', position: 'relative',
  width: '100%', border: 'none', background: 'transparent',
};

/* ════════════════════════════════════════════════════════════════
   ADMIN SIDEBAR
════════════════════════════════════════════════════════════════ */
const AdminSidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectUser);
  const initials = getInitials(user?.name);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  const renderSidebarContent = (collapsed, isMobile) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Logo ── */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 12px' : '0 16px',
        borderBottom: `1px solid ${ADMIN.borderSub}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Brand shield icon */}
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: ADMIN.iconGrad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 14px rgba(79,70,229,0.50)',
          }}>
            <Shield size={16} color="#fff" strokeWidth={2} />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                HireGenius
              </p>
              <p style={{ fontSize: 10, color: ADMIN.accentText, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Admin Console
              </p>
            </motion.div>
          )}
        </div>
        {/* Mobile close */}
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${ADMIN.borderSub}`,
              color: ADMIN.textSub, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close menu"
            id="admin-sidebar-close-btn"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Admin Access badge ───────────────────────────────── */}
      {!collapsed && (
        <div style={{ margin: '12px 12px 6px', padding: '8px 12px', borderRadius: 10, background: ADMIN.accentSoft, border: `1px solid ${ADMIN.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ADMIN.accent, boxShadow: `0 0 0 3px ${ADMIN.accentSoft}`, flexShrink: 0 }} />
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ADMIN.accentText }}>
              ⚡ Admin Access — Full Control
            </p>
          </div>
        </div>
      )}

      {/* ── Section label ────────────────────────────────────── */}
      {!collapsed && (
        <p style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: ADMIN.textMuted,
          padding: '8px 16px 4px',
        }}>
          Menu
        </p>
      )}

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '2px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={collapsed ? label : undefined}
              id={`admin-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              style={({ isActive }) => ({
                ...sidebarItemBase,
                minHeight: isMobile ? 44 : 38,
                background: isActive ? ADMIN.activeGrad : 'transparent',
                color: isActive ? '#fff' : ADMIN.textSub,
                boxShadow: isActive ? ADMIN.activeShadow : 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.style.boxShadow || e.currentTarget.style.boxShadow === 'none') {
                  e.currentTarget.style.background = ADMIN.cardBg;
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget.style.boxShadow === 'none' || !e.currentTarget.style.boxShadow) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = ADMIN.textSub;
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
                    <Icon size={17} strokeWidth={1.75} />
                  </div>
                  {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
                  {!collapsed && isActive && (
                    <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: ADMIN.borderSub, margin: '14px 4px' }} />

        {/* Account section */}
        {!collapsed && (
          <p style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: ADMIN.textMuted,
            padding: '0 10px', marginBottom: 6,
          }}>
            Account
          </p>
        )}
        <NavLink
          to="/admin/profile"
          onClick={onClose}
          id="admin-nav-profile"
          style={() => ({
            ...sidebarItemBase,
            minHeight: isMobile ? 44 : 38,
            color: ADMIN.textSub,
            justifyContent: collapsed ? 'center' : 'flex-start',
          })}
          onMouseEnter={(e) => { e.currentTarget.style.background = ADMIN.cardBg; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ADMIN.textSub; }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserCircle size={17} strokeWidth={1.75} />
          </div>
          {!collapsed && <span>Profile</span>}
        </NavLink>
      </nav>

      {/* ── User card ────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${ADMIN.borderSub}`, padding: collapsed ? '10px 8px' : '10px 12px', flexShrink: 0 }}>
        {collapsed ? (
          <div style={{
            width: 36, height: 36, borderRadius: '50%', margin: '0 auto',
            background: ADMIN.iconGrad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 800,
          }} title={user?.name}>
            {initials}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: ADMIN.cardBg, border: `1px solid ${ADMIN.border}` }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: ADMIN.iconGrad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 800,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{user?.name ?? 'Admin'}</p>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                background: ADMIN.accentSoft, color: ADMIN.accentText,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              id="admin-sidebar-logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.65)', padding: 4, borderRadius: 8, flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(239,68,68,0.65)'; e.currentTarget.style.background = 'none'; }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Collapse toggle ── desktop only, bottom of sidebar ── */}
      {!isMobile && (
        <motion.button
          className="hidden md:flex"
          whileTap={{ scale: 0.96 }}
          onClick={onToggleCollapse}
          id="admin-sidebar-collapse-btn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            width: '100%', padding: collapsed ? '12px 0' : '12px 20px',
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${ADMIN.borderSub}`,
            color: ADMIN.textMuted,
            cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = ADMIN.cardBg; e.currentTarget.style.color = ADMIN.accentText; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ADMIN.textMuted; }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={collapsed ? 'expand' : 'collapse'}
              initial={{ rotate: -20, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 20, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              {collapsed
                ? <PanelLeftOpen size={16} />
                : <PanelLeftClose size={16} />}
            </motion.div>
          </AnimatePresence>
          {!collapsed && <span>Collapse sidebar</span>}
        </motion.button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/65 md:hidden"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 260 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-40 overflow-hidden"
        style={{ background: ADMIN.sidebarBg, borderRight: `1px solid ${ADMIN.border}` }}
        aria-label="Admin navigation"
      >
        {renderSidebarContent(isCollapsed, false)}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] flex flex-col md:hidden overflow-hidden"
            style={{
              background: ADMIN.sidebarBg,
              borderRight: `1px solid ${ADMIN.border}`,
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
   ADMIN TOPBAR
════════════════════════════════════════════════════════════════ */
const AdminTopbar = ({ onMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const user       = useSelector(selectUser);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchValue,  setSearchValue]  = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);
  const initials = getInitials(user?.name);

  const unreadCount = MOCK_ADMIN_NOTIFS.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  const iconBtn = {
    padding: '8px', borderRadius: 10,
    background: 'var(--card-row-bg)', border: '1px solid var(--border)',
    color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.15s', position: 'relative',
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 30 }}>
      <style>{`
        @media (max-width: 480px) {
          .admin-dropdown-responsive {
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
        id="admin-topbar"
        className="h-16 flex items-center justify-between px-3 sm:px-4 md:px-6"
        style={{
          background: 'rgba(10,10,28,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${ADMIN.border}`,
          boxShadow: `0 1px 0 rgba(99,102,241,0.08)`,
        }}
      >
        {/* Left — admin badge + search (with hamburger on mobile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={onMenuToggle}
            className="md:hidden flex items-center justify-center p-2 rounded-xl"
            style={{
              ...iconBtn,
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="Open navigation menu"
            id="admin-topbar-menu-toggle"
          >
            <Menu size={18} />
          </motion.button>

          {/* Mobile Search Toggle */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={() => setMobileSearchOpen(v => !v)}
            className="sm:hidden flex items-center justify-center"
            style={{
              ...iconBtn,
              minWidth: 38,
              minHeight: 38,
              color: mobileSearchOpen ? '#6366f1' : 'var(--text-secondary)',
              borderColor: mobileSearchOpen ? '#6366f1' : 'var(--border)',
            }}
            aria-label="Toggle search"
            id="admin-topbar-mobile-search-toggle"
          >
            <Search size={16} />
          </motion.button>

          {/* Admin Console badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px clamp(8px, 2vw, 12px)', borderRadius: 10,
            background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)',
          }}>
            <Shield size={13} style={{ color: '#6366f1', flexShrink: 0 }} />
            <span className="hidden sm:inline" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6366f1' }}>
              Admin Console
            </span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hidden sm:flex">
            <Search size={14} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search users, settings…"
              style={{
                paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                fontSize: 13, borderRadius: 10, width: 210,
                background: 'var(--card-row-bg)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.10)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              id="admin-topbar-search"
            />
          </div>
        </div>

        {/* Right — actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Theme toggle */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={toggleTheme}
            style={iconBtn}
            aria-label="Toggle theme"
            id="admin-topbar-theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                exit={{  rotate: 30,  opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              onClick={() => setShowNotifs((v) => !v)}
              style={iconBtn}
              aria-label="Notifications"
              id="admin-topbar-notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#6366f1', color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid var(--surface)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0,  scale: 1 }}
                  exit={{   opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="admin-dropdown-responsive"
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 'min(320px, calc(100vw - 24px))', borderRadius: 16, zIndex: 100,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Admin Notifications</p>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.10)', color: '#6366f1' }}>
                      {unreadCount} new
                    </span>
                  </div>
                  {MOCK_ADMIN_NOTIFS.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                        background: n.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                        borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card-row-bg)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(99,102,241,0.05)'; }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                        background: n.read ? 'var(--border)' : '#6366f1',
                        boxShadow: n.read ? 'none' : '0 0 0 3px rgba(99,102,241,0.18)',
                      }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.text}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />

          {/* User avatar chip */}
          <div style={{ position: 'relative' }} ref={userRef}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowUserMenu((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 12,
                background: 'var(--card-row-bg)', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              id="admin-topbar-user"
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: ADMIN.iconGrad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 800,
              }}>
                {initials}
              </div>
              <span className="hidden md:block" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? 'Admin'}
              </span>
              <ChevronDown
                size={13}
                className="hidden md:block"
                style={{ color: 'var(--text-muted)', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0,  scale: 1 }}
                  exit={{   opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="admin-dropdown-responsive"
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 200, borderRadius: 14, zIndex: 100,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', padding: 6,
                  }}
                >
                  {/* User info */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{user?.email ?? 'admin@hiregenius.ai'}</p>
                  </div>
                  {[
                    { label: 'Profile',  to: '/admin/profile',  icon: UserCircle },
                    { label: 'Settings', to: '/admin/settings', icon: Settings },
                  ].map(({ label, to, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
                        fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card-row-bg)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Icon size={15} style={{ color: 'var(--text-secondary)' }} />
                      {label}
                    </NavLink>
                  ))}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '10px 12px', borderRadius: 10, border: 'none',
                      background: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, color: '#ef4444',
                      borderTop: '1px solid var(--border)',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    id="admin-topbar-logout"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
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
              background: 'rgba(10,10,28,0.95)',
              borderBottom: `1px solid ${ADMIN.border}`,
              padding: '8px 12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search users, settings…"
                id="admin-topbar-mobile-search-input"
                style={{
                  width: '100%',
                  height: 38,
                  paddingLeft: 34,
                  paddingRight: 12,
                  borderRadius: 10,
                  background: 'var(--card-row-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
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
   ADMIN SHELL (Layout)
════════════════════════════════════════════════════════════════ */
const AdminShell = () => {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1280px)');
    const handler = (e) => setSidebarCollapsed(e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      <AdminSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />


      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminTopbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-base)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
