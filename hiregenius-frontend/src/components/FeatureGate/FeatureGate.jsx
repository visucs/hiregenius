import { useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldAlert, LogIn } from 'lucide-react';
import { selectIsAuthenticated, selectUserRole } from '../../features/auth/authSlice';
import { ROLE_HOME } from '../../routes/RoleRedirect';
import GradientButton from '../GradientButton/GradientButton';

/**
 * FeatureGate — conditionally gates interactive features based on auth & role.
 *
 * Requirements:
 * - If user is logged in AND role matches `requiredRole` (default CANDIDATE):
 *     Renders its children (functional widget) untouched.
 * - If user is not logged in:
 *     Renders a "locked" card with an icon, "Sign in to try it" heading,
 *     one line of subtext, and a button linking to /login with redirect state/query.
 * - If user is logged in but with a different role (RECRUITER or ADMIN):
 *     Renders a small neutral message ("This tool is for candidates — recruiters
 *     can review results from their dashboard") without the sign-in prompt.
 *
 * @param {object} props
 * @param {string} [props.requiredRole='CANDIDATE']
 * @param {string} [props.lockHeading='Sign in to try it']
 * @param {string} [props.lockSubtext='Create an account or sign in as a candidate to access this interactive tool.']
 * @param {number} [props.minHeight=360]
 * @param {React.ReactNode} props.children
 */
const FeatureGate = ({
  requiredRole = 'CANDIDATE',
  lockHeading = 'Sign in to try it',
  lockSubtext = 'Create an account or sign in as a candidate to access this interactive tool.',
  minHeight = 360,
  children,
}) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);
  const location = useLocation();

  // 1. Logged in and matches required role -> render children untouched
  if (isAuthenticated && role === requiredRole) {
    return children;
  }

  // Current path with search params for return redirect
  const redirectPath = location.pathname + location.search;
  const loginTarget = `/login?redirect=${encodeURIComponent(redirectPath)}`;

  // 2. Not logged in -> Locked card with redirect to login
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          minHeight,
          background: 'var(--card-float-bg)',
          border: '1px solid var(--card-float-border)',
          borderRadius: 20,
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: 'var(--card-float-shadow)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="feature-gate-locked"
        id="feature-gate-locked-card"
      >
        {/* Background ambient radial glow */}
        <div
          style={{
            position: 'absolute',
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, var(--glow-radial) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'var(--step-active-bg)',
              border: '1px solid var(--step-active-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 8px 24px rgba(61,80,22,0.15)',
            }}
          >
            <Lock size={28} color="var(--primary)" />
          </div>

          <h3
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            {lockHeading}
          </h3>

          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              marginBottom: 28,
              lineHeight: 1.6,
              maxWidth: 460,
            }}
          >
            {lockSubtext}
          </p>

          <GradientButton
            to={loginTarget}
            size="md"
            id="feature-gate-login-btn"
          >
            <LogIn size={15} /> Sign in to try it
          </GradientButton>
        </div>
      </motion.div>
    );
  }

  // 3. Logged in with a different role (RECRUITER / ADMIN) -> small neutral message
  const dashboardPath = ROLE_HOME[role] ?? '/recruiter/dashboard';
  const roleTitle = role === 'ADMIN' ? 'Admin' : 'Recruiter';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        width: '100%',
        minHeight: Math.min(minHeight, 260),
        background: 'var(--card-float-bg)',
        border: '1px solid var(--card-float-border)',
        borderRadius: 20,
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: 'var(--card-float-shadow)',
        backdropFilter: 'blur(20px)',
      }}
      className="feature-gate-role-notice"
      id="feature-gate-role-notice"
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <ShieldAlert size={24} color="var(--secondary)" />
      </div>

      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 16,
          maxWidth: 480,
          lineHeight: 1.5,
        }}
      >
        This tool is for candidates — recruiters can review results from their dashboard
      </p>

      <Link
        to={dashboardPath}
        id="feature-gate-dashboard-link"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 20px',
          borderRadius: 'var(--radius-btn)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--primary)',
          background: 'var(--pill-badge-bg)',
          border: '1px solid var(--pill-badge-border)',
          textDecoration: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
        }}
      >
        Go to {roleTitle} Dashboard <ArrowRight size={13} />
      </Link>
    </motion.div>
  );
};

export default FeatureGate;
