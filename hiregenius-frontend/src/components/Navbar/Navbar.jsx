import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { logout, selectUser } from '../../features/auth/authSlice';
import useTheme from '../../hooks/useTheme';

/**
 * Navbar — top bar for authenticated app shell.
 * @param {{ onMenuToggle: () => void }} props
 */
const Navbar = ({ onMenuToggle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header
      className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 md:px-6"
      style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left — menu toggle + brand */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onMenuToggle}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle sidebar"
          id="navbar-menu-toggle"
        >
          <Menu size={20} />
        </motion.button>

        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-bold text-lg"
          style={{ color: 'var(--primary)' }}
        >
          <span className="hidden sm:inline">HireGenius</span>
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--secondary) 15%, transparent)',
              color: 'var(--secondary)',
            }}
          >
            AI
          </span>
        </Link>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle theme"
          id="navbar-theme-toggle"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

        {/* Notifications — placeholder for Phase 9 */}
        <button
          className="p-2 rounded-lg transition-colors relative"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Notifications"
          id="navbar-notifications"
        >
          <Bell size={18} />
        </button>

        {/* User info */}
        {user && (
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <User size={16} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </span>
          </div>
        )}

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors"
          style={{ color: 'var(--danger)' }}
          aria-label="Logout"
          id="navbar-logout"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Logout</span>
        </motion.button>
      </div>
    </header>
  );
};

export default Navbar;
