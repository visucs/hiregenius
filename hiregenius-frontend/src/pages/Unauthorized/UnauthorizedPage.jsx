import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { selectUserRole } from '../../features/auth/authSlice';
import { ROLE_HOME } from '../../routes/RoleRedirect';

/**
 * UnauthorizedPage — 403 role mismatch.
 * Shown when a logged-in user tries to visit a route
 * that doesn't belong to their role.
 */
const UnauthorizedPage = () => {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();
  const home = ROLE_HOME[role] ?? '/';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
          }}
        >
          <ShieldX size={32} style={{ color: 'var(--danger)' }} />
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Access denied
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}
        >
          You don&apos;t have permission to view this page.
          {role && ` Your role is ${role}.`}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface)',
            }}
            id="unauthorized-back"
          >
            <ArrowLeft size={15} />
            Go back
          </button>
          <Link
            to={home}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: 'var(--primary)' }}
            id="unauthorized-home"
          >
            <Home size={15} />
            My dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
