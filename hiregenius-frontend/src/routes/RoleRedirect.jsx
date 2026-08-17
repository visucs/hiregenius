import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectUserRole,
} from '../features/auth/authSlice';

/** Map role → home dashboard. Single source of truth. */
export const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  RECRUITER: '/recruiter/dashboard',
  CANDIDATE: '/candidate/dashboard',
};

/**
 * RoleRedirect — used on public-only routes (/, /login, /register).
 * If the user is already authenticated, send them to their role dashboard
 * so they don't see the login/landing page again.
 *
 * @param {{ children: React.ReactNode }} props
 */
const RoleRedirect = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);

  if (isAuthenticated) {
    const home = ROLE_HOME[role] ?? '/recruiter/dashboard';
    return <Navigate to={home} replace />;
  }

  return children;
};

export default RoleRedirect;
