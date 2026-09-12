import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun, Bell, Search, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { logout, selectUser } from '../../features/auth/authSlice';
import useTheme from '../../hooks/useTheme';

/* ─── Avatar initials helper ─────────────────────────────────── */
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};

/**
 * Navbar — top bar for authenticated app shell.
 * Redesigned with glassmorphism, search bar, avatar chip, and notification badge.
 * @param {{ onMenuToggle: () => void }} props
 */
const Navbar = ({ onMenuToggle }) => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const user        = useSelector(selectUser);
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    setUserMenuOpen(false);
    dispatch(logout());
    navigate('/');
  };

  const initials = getInitials(user?.name);

  return (
    <header
      className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 md:px-6 navbar-glass"
    >
      {/* ── Left: hamburger + brand ──────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onMenuToggle}
          className="p-2 rounded-xl"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--card-row-bg)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
          aria-label="Toggle sidebar"
          id="navbar-menu-toggle"
        >
          <Menu size={18} />
        </motion.button>

        <Link
          to="/dashboard"
          className="hidden sm:flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          {/* Brand icon */}
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(61,80,22,0.30)',
          }}>
            <Sparkles size={14} color="#fff" strokeWidth={2} />
          </div>
          <span style={{
            fontWeight: 800, fontSize: 15, color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}>
            HireGenius{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              AI
            </span>
          </span>
        </Link>
      </div>

      {/* ── Center: search bar ───────────────────────────────── */}
      <div className="hidden md:flex flex-1 justify-center px-8 max-w-sm mx-auto">
        <button
          className="nav-search w-full"
          aria-label="Search"
          id="navbar-search"
        >
          <Search size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>Search jobs, interviews…</span>
          <span style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 600,
            padding: '1px 7px', borderRadius: 6,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', letterSpacing: '0.02em',
          }}>
            ⌘K
          </span>
        </button>
      </div>

      {/* ── Right: actions ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--card-row-bg)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
          aria-label="Toggle theme"
          id="navbar-theme-toggle"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              exit={{  rotate: 30,  opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Notifications */}
        <button
          className="p-2 rounded-xl relative"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--card-row-bg)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
          aria-label="Notifications"
          id="navbar-notifications"
        >
          <Bell size={17} />
          <span className="notif-badge" aria-hidden="true" />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

        {/* User avatar chip */}
        {user && (
          <div style={{ position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
              style={{
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              aria-label="User menu"
              id="navbar-user-menu"
            >
              {/* Avatar circle */}
              <div
                className="avatar-circle"
                style={{ width: 28, height: 28, fontSize: 11 }}
              >
                {initials}
              </div>
              <span
                className="hidden md:block text-sm font-semibold"
                style={{ color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user.name ?? 'User'}
              </span>
              <ChevronDown
                size={13}
                className="hidden md:block"
                style={{
                  color: 'var(--text-muted)',
                  transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0,  scale: 1 }}
                  exit={{   opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    minWidth: 180,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    padding: '6px',
                    zIndex: 100,
                  }}
                >
                  {/* User info row */}
                  <div style={{
                    padding: '10px 12px 10px',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: 6,
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{user.email ?? 'Candidate'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px', borderRadius: 10, border: 'none',
                      background: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, color: '#ef4444',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    id="navbar-logout"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
