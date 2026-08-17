import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
} from 'lucide-react';

/**
 * Role-specific nav items.
 * `disabled: true` items are rendered but unclickable until their Phase ships.
 */
const NAV_CONFIG = {
  RECRUITER: [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase, disabled: true },
    { to: '/recruiter/candidates', label: 'Candidates', icon: Users, disabled: true },
    { to: '/recruiter/resume-screening', label: 'Resume Screening', icon: FileSearch, disabled: true },
    { to: '/recruiter/ai-interview', label: 'AI Interview', icon: MessageSquare, disabled: true },
    { to: '/recruiter/scheduler', label: 'Scheduler', icon: CalendarDays, disabled: true },
    { to: '/recruiter/analytics', label: 'Analytics', icon: BarChart3, disabled: true },
    { to: '/recruiter/settings', label: 'Settings', icon: Settings, disabled: true },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: Users, disabled: true },
    { to: '/admin/api-keys', label: 'API Keys', icon: Key, disabled: true },
    { to: '/admin/audit', label: 'Audit Logs', icon: ShieldCheck, disabled: true },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, disabled: true },
    { to: '/admin/settings', label: 'Settings', icon: Settings, disabled: true },
  ],
  CANDIDATE: [
    { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/candidate/applications', label: 'Applications', icon: FileText, disabled: true },
    { to: '/candidate/interviews', label: 'My Interviews', icon: MessageSquare, disabled: true },
    { to: '/candidate/score', label: 'Resume Score', icon: Trophy, disabled: true },
    { to: '/candidate/settings', label: 'Settings', icon: Settings, disabled: true },
  ],
};

const ROLE_LABELS = {
  RECRUITER: 'Recruiter Portal',
  ADMIN: 'Admin Panel',
  CANDIDATE: 'Candidate Portal',
};

const sidebarVariants = {
  open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

/**
 * Sidebar — role-aware navigation panel.
 * Desktop: full (260px) or icon-only (64px).
 * Mobile: drawer overlay.
 *
 * @param {{ isOpen: boolean, isCollapsed: boolean, onClose: () => void, role: string }} props
 */
const Sidebar = ({ isOpen, isCollapsed, onClose, role }) => {
  const navItems = NAV_CONFIG[role] ?? NAV_CONFIG.RECRUITER;
  const roleLabel = ROLE_LABELS[role] ?? '';

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        className="fixed top-0 left-0 z-40 h-full flex flex-col md:relative md:translate-x-0 md:z-auto"
        style={{
          width: isCollapsed ? '64px' : 'var(--sidebar-width, 260px)',
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          transition: 'width 0.25s ease',
          overflow: 'hidden',
        }}
        aria-label="Main navigation"
      >
        {/* Sidebar header */}
        <div
          className="h-16 flex items-center justify-between px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {!isCollapsed && (
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-secondary)' }}
            >
              {roleLabel}
            </span>
          )}
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg md:hidden"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon, disabled }) => (
            <NavLink
              key={to}
              to={to}
              onClick={disabled ? (e) => e.preventDefault() : onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  disabled ? 'pointer-events-none opacity-35' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive && !disabled ? 'var(--primary)' : 'transparent',
                color: isActive && !disabled ? '#fff' : 'var(--text-secondary)',
              })}
              title={label}
              id={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Role badge at bottom */}
        {!isCollapsed && role && (
          <div
            className="px-4 py-3 text-xs font-medium"
            style={{
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--border)',
            }}
          >
            Signed in as{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{role}</span>
          </div>
        )}
      </motion.aside>
    </>
  );
};

export default Sidebar;
