import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectUserRole,
} from '../features/auth/authSlice';

/**
 * ProtectedRoute — guards any route group.
 *
 * Props:
 *   allowedRoles {string[]} — e.g. ['RECRUITER'], ['ADMIN'], ['ADMIN','RECRUITER']
 *                             Omit / pass [] to allow any authenticated user.
 *
 * Behaviour:
 *   1. Not authenticated → /login (saves intended URL in state for post-login redirect)
 *   2. Authenticated but wrong role → /unauthorized
 *   3. Authenticated + correct role → render <Outlet />
 *
 * Rules.md §5: auth is never skipped, never decoded client-side.
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);
  const location = useLocation();

  // 1. Not logged in at all
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Logged in but role not permitted for this route group
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Authorised
  return <Outlet />;
};

export default ProtectedRoute;
