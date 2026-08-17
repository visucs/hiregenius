import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Agentation } from 'agentation';

// ── Public pages ──────────────────────────────────────────────────
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';

// ── Role dashboards ───────────────────────────────────────────────
import RecruiterDashboard from './pages/Dashboard/RecruiterDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import CandidateDashboard from './pages/Dashboard/CandidateDashboard';

// ── Error / utility pages ─────────────────────────────────────────
import UnauthorizedPage from './pages/Unauthorized/UnauthorizedPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// ── Layout & route guards ─────────────────────────────────────────
import AppShell from './layouts/AppShell';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';

/**
 * App — root router.
 *
 * Route structure:
 *   /                    → LandingPage (public, visible logged-out AND logged-in)
 *   /login               → LoginPage  (public — if logged in, bounced to role dashboard)
 *   /register            → RegisterPage (public — same bounce)
 *   /forgot-password     → ForgotPasswordPage (public)
 *   /unauthorized        → UnauthorizedPage (403, no role match)
 *
 *   /recruiter/*         → RECRUITER only, wrapped in AppShell + ProtectedRoute
 *   /admin/*             → ADMIN only, same
 *   /candidate/*         → CANDIDATE only, same
 *
 *   *                    → NotFoundPage (404)
 *
 * ProtectedRoute props:
 *   allowedRoles={[...]} — role must be in the list; omit for "any authenticated"
 */
const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            background: '#151B2C',
            color: '#F8FAFC',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: {
            style: {
              background: '#151B2C',
              color: '#F8FAFC',
              border: '1px solid rgba(34,197,94,0.3)',
              borderLeft: '3px solid #22C55E',
            },
            iconTheme: { primary: '#22C55E', secondary: '#151B2C' },
          },
          error: {
            style: {
              background: '#151B2C',
              color: '#F8FAFC',
              border: '1px solid rgba(239,68,68,0.3)',
              borderLeft: '3px solid #EF4444',
            },
            iconTheme: { primary: '#EF4444', secondary: '#151B2C' },
          },
        }}
      />

      <Routes>

        {/* ── PUBLIC ROUTES ─────────────────────────────────────────── */}

        {/*
          "/" is always public — the Landing page is visible to everyone.
          Logged-in users see it too; they can navigate to their dashboard
          via the Navbar (we don't force-redirect them away from the homepage).
        */}
        <Route path="/" element={<LandingPage />} />

        {/*
          Auth pages — if the user is already logged in, RoleRedirect
          bounces them to their role dashboard instead of showing the form.
        */}
        <Route
          path="/login"
          element={
            <RoleRedirect>
              <LoginPage />
            </RoleRedirect>
          }
        />
        <Route
          path="/register"
          element={
            <RoleRedirect>
              <RegisterPage />
            </RoleRedirect>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* 403 — accessible without auth so wrong-role users can see it */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── PROTECTED: RECRUITER ──────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['RECRUITER']} />}>
          <Route element={<AppShell />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            {/*
              Phase 3+ recruiter routes go here:
              <Route path="/recruiter/jobs" element={<JobsPage />} />
              <Route path="/recruiter/candidates" element={<CandidatesPage />} />
              <Route path="/recruiter/resume-screening" element={<ResumeScreeningPage />} />
              <Route path="/recruiter/ai-interview" element={<AIInterviewPage />} />
              <Route path="/recruiter/scheduler" element={<SchedulerPage />} />
              <Route path="/recruiter/analytics" element={<AnalyticsPage />} />
              <Route path="/recruiter/settings" element={<SettingsPage />} />
            */}
          </Route>
        </Route>

        {/* ── PROTECTED: ADMIN ──────────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AppShell />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            {/*
              Phase 4+ admin routes go here:
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/api-keys" element={<ApiKeysPage />} />
              <Route path="/admin/audit" element={<AuditLogsPage />} />
            */}
          </Route>
        </Route>

        {/* ── PROTECTED: CANDIDATE ─────────────────────────────────── */}
        {/* PRD §4.1: Candidate role is optional scope; built now for completeness */}
        <Route element={<ProtectedRoute allowedRoles={['CANDIDATE']} />}>
          <Route element={<AppShell />}>
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
            {/*
              Phase 5+ candidate routes go here:
              <Route path="/candidate/applications" element={<ApplicationsPage />} />
              <Route path="/candidate/interviews" element={<CandidateInterviewsPage />} />
            */}
          </Route>
        </Route>

        {/* ── 404 catch-all ─────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  );
};

export default App;
