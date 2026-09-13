import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileSearch,
  MessageSquare,
  CalendarDays,
  BarChart3,
  Settings,
  Key,
  ShieldCheck,
  FileText,
  Trophy,
  Target,
  History,
  HelpCircle,
  Sparkles,
  Mic,
  X,
  Plus,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';

/* ─── Role-specific nav configs (non-candidate roles unchanged) ─── */
const NAV_CONFIG = {
  RECRUITER: [
    { to: '/recruiter/dashboard',        label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/recruiter/jobs',             label: 'Jobs',            icon: Briefcase,    disabled: true },
    { to: '/recruiter/candidates',       label: 'Candidates',      icon: Users,        disabled: true },
    { to: '/recruiter/resume-screening', label: 'Resume Screening',icon: FileSearch,   disabled: true },
    { to: '/recruiter/ai-interview',     label: 'AI Interview',    icon: MessageSquare,disabled: true },
    { to: '/recruiter/scheduler',        label: 'Scheduler',       icon: CalendarDays, disabled: true },
    { to: '/recruiter/analytics',        label: 'Analytics',       icon: BarChart3 },
    { to: '/recruiter/settings',         label: 'Settings',        icon: Settings,     disabled: true },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
    { to: '/admin/users',     label: 'User Management',icon: Users,       disabled: true },
    { to: '/admin/api-keys',  label: 'API Keys',       icon: Key,         disabled: true },
    { to: '/admin/audit',     label: 'Audit Logs',     icon: ShieldCheck, disabled: true },
    { to: '/admin/analytics', label: 'Analytics',      icon: BarChart3 },
    { to: '/admin/settings',  label: 'Settings',       icon: Settings,    disabled: true },
  ],
};

/* ─── Candidate main nav items ──────────────────────────────────── */
const CANDIDATE_NAV = [
  { to: '/candidate/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/candidate/applications',  label: 'Applications', icon: FileText },
  { to: '/candidate/interviews',    label: 'My Interviews',icon: MessageSquare },
  { to: '/candidate/resume-score',  label: 'Resume Score', icon: Target },
  { to: '/candidate/scan-history',  label: 'Scan History', icon: History },
  { to: '/candidate/settings',      label: 'Settings',     icon: Settings },
];

const ROLE_LABELS = {
  RECRUITER: 'Recruiter Portal',
  ADMIN:     'Admin Panel',
  CANDIDATE: 'Candidate Portal',
};

/* ─── Avatar initials helper ─────────────────────────────────── */
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};

/* ─── Framer Motion variants ────────────────────────────────────── */
const sidebarVariants = {
  open:   { x: 0,      transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%',transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

/* ─── NavItem helper ────────────────────────────────────────────── */
const NavItem = ({ to, label, icon: Icon, disabled, isCollapsed, onClose }) => (
  <NavLink
    to={to}
    onClick={disabled ? (e) => e.preventDefault() : onClose}
    className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium ${
      disabled ? 'pointer-events-none opacity-35 cursor-not-allowed' : ''
    }`}
    style={({ isActive }) => ({
      backgroundColor: isActive && !disabled ? 'var(--step-active-bg)' : 'transparent',
      color: isActive && !disabled ? 'var(--text-primary)' : 'var(--text-secondary)',
      borderLeft: isActive && !disabled ? '3px solid var(--primary)' : '3px solid transparent',
      paddingLeft: '10px',
      transition: 'all 0.15s ease',
    })}
    title={label}
    id={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    {({ isActive }) => (
      <>
        {/* Icon wrapper — highlighted on active */}
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isActive && !disabled ? 'rgba(61,80,22,0.12)' : 'transparent',
          transition: 'background 0.15s',
        }}>
          <Icon
            size={17}
            style={{
              color: isActive && !disabled ? 'var(--primary)' : 'inherit',
              strokeWidth: 1.75,
            }}
          />
        </div>
        {!isCollapsed && <span className="truncate">{label}</span>}
        {!isCollapsed && isActive && !disabled && (
          <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'var(--text-muted)', flexShrink: 0 }} />
        )}
      </>
    )}
  </NavLink>
);

/* ═══════════════════════════════════════════════════════════════════
   CandidateSidebarBody — full structured layout
══════════════════════════════════════════════════════════════════ */
const CandidateSidebarBody = ({ isCollapsed, onClose }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useSelector(selectUser);
  const initials  = getInitials(user?.name);

  /* "New Resume Check" CTA handler */
  const handleNewResumeCheck = () => {
    if (location.pathname === '/candidate/dashboard') {
      document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/candidate/dashboard');
      setTimeout(() => {
        document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
    onClose();
  };

  return (
    <>
      {/* 1. LOGO AREA ────────────────────────────────────────── */}
      <div style={{
        height: 64,
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: isCollapsed ? '0 12px' : '0 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {/* Brand wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(61,80,22,0.30)',
          }}>
            <Sparkles size={14} color="#fff" strokeWidth={2} />
          </div>
          {!isCollapsed && (
            <div>
              <span style={{
                fontWeight: 800, fontSize: 15, color: 'var(--text-primary)',
                letterSpacing: '-0.03em', whiteSpace: 'nowrap',
              }}>
                HireGenius{' '}
                <span style={{
                  background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  AI
                </span>
              </span>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                Candidate Portal
              </div>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg md:hidden"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Close sidebar"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>

      {/* 2. PRIMARY CTA — New Resume Check ─────────────────── */}
      <div style={{ padding: isCollapsed ? '12px 8px' : '14px 12px', flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNewResumeCheck}
            title="New Resume Check"
            id="sidebar-new-resume-check"
            className="btn-shimmer"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 8, padding: isCollapsed ? '10px 0' : '10px 14px',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: '0 3px 14px rgba(61,80,22,0.30)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <Plus size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span>New Resume Check</span>}
          </motion.button>
        </div>
      </div>

      {/* 3. NAV SECTION LABEL ───────────────────────────────── */}
      {!isCollapsed && (
        <p style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)',
          padding: '0 18px', marginBottom: 4,
        }}>
          Menu
        </p>
      )}

      {/* 4. MAIN NAV LIST ───────────────────────────────────── */}
      <nav
        style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 4px' }}
        aria-label="Main navigation"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {CANDIDATE_NAV.map(({ to, label, icon, disabled }) => (
            <NavItem
              key={to}
              to={to} label={label} icon={icon}
              disabled={disabled} isCollapsed={isCollapsed} onClose={onClose}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{
          height: 1, background: 'var(--border)', margin: '14px 4px',
        }} />

        {/* Coming Soon section */}
        {!isCollapsed && (
          <p style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)',
            padding: '0 10px', marginBottom: 6,
          }}>
            Coming Soon
          </p>
        )}

        {/* Interview Practice — disabled */}
        <div
          title="Interview Practice — coming soon"
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '9px 0 9px 10px', borderRadius: 12,
            cursor: 'not-allowed', opacity: 0.4,
            borderLeft: '3px solid transparent',
          }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mic size={17} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
          </div>
          {!isCollapsed && (
            <>
              <span style={{
                fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
                flex: 1, marginLeft: 6,
              }}>
                Interview Practice
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 999,
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                color: '#fff', flexShrink: 0, marginRight: 4,
              }}>
                Soon
              </span>
            </>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />
      </nav>

      {/* 5. HELP LINK ───────────────────────────────────────── */}
      <div style={{ padding: isCollapsed ? '6px 8px' : '6px 8px', flexShrink: 0 }}>
        <a
          href="/help"
          onClick={(e) => e.preventDefault()}
          id="sidebar-help-link"
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '9px 0 9px 10px', borderRadius: 12,
            textDecoration: 'none', color: 'var(--text-secondary)',
            borderLeft: '3px solid transparent',
            fontSize: 14, fontWeight: 500, transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--card-row-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HelpCircle size={17} strokeWidth={1.75} style={{ color: 'inherit' }} />
          </div>
          {!isCollapsed && <span style={{ marginLeft: 6 }}>Help & Support</span>}
        </a>
      </div>

      {/* 6. USER PROFILE CARD ───────────────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: isCollapsed ? '10px 8px' : '10px 12px',
        flexShrink: 0,
      }}>
        {isCollapsed ? (
          /* Collapsed: just avatar circle */
          <div
            className="avatar-circle"
            style={{ width: 36, height: 36, fontSize: 13, margin: '0 auto' }}
            title={user?.name ?? 'User'}
          >
            {initials}
          </div>
        ) : (
          /* Expanded: full card */
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 14,
            background: 'var(--card-row-bg)',
            border: '1px solid var(--card-row-border)',
          }}>
            <div
              className="avatar-circle"
              style={{ width: 34, height: 34, fontSize: 12 }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {user?.name ?? 'User'}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)',
                color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Candidate
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   GenericSidebarBody — for RECRUITER and ADMIN roles (unchanged logic)
══════════════════════════════════════════════════════════════════ */
const GenericSidebarBody = ({ isCollapsed, onClose, role }) => {
  const navItems  = NAV_CONFIG[role] ?? NAV_CONFIG.RECRUITER;
  const roleLabel = ROLE_LABELS[role] ?? '';

  return (
    <>
      {/* Header */}
      <div
        className="h-16 flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {!isCollapsed && (
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            {roleLabel}
          </span>
        )}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg md:hidden"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Close sidebar"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Main navigation">
        {navItems.map(({ to, label, icon, disabled }) => (
          <NavItem
            key={to}
            to={to} label={label} icon={icon}
            disabled={disabled} isCollapsed={isCollapsed} onClose={onClose}
          />
        ))}
      </nav>

      {/* Role badge at bottom */}
      {!isCollapsed && role && (
        <div
          className="px-4 py-3 text-xs font-medium"
          style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}
        >
          Signed in as{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{role}</span>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Sidebar — root component
   @param {{ isOpen: boolean, isCollapsed: boolean, onClose: () => void, role: string }} props
══════════════════════════════════════════════════════════════════ */
const Sidebar = ({ isOpen, isCollapsed, onClose, role }) => {
  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-30 overflow-hidden"
        style={{
          width: isCollapsed ? '64px' : 'var(--sidebar-width, 260px)',
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          transition: 'width 0.25s ease',
        }}
        aria-label="Main navigation"
      >
        {role === 'CANDIDATE' ? (
          <CandidateSidebarBody isCollapsed={isCollapsed} onClose={onClose} />
        ) : (
          <GenericSidebarBody isCollapsed={isCollapsed} onClose={onClose} role={role} />
        )}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] flex flex-col md:hidden overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              boxShadow: '8px 0 36px rgba(0,0,0,0.65)',
            }}
            aria-label="Main navigation"
          >
            {role === 'CANDIDATE' ? (
              <CandidateSidebarBody isCollapsed={false} onClose={onClose} />
            ) : (
              <GenericSidebarBody isCollapsed={false} onClose={onClose} role={role} />
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
