import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Agentation } from 'agentation';

// ── Public pages ──────────────────────────────────────────────────
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResumeScreeningPage    from './pages/products/ResumeScreening/ResumeScreeningPage';
import AIInterviewPage        from './pages/products/AIInterview/AIInterviewPage';
import AnalyticsProductPage   from './pages/products/Analytics/AnalyticsProductPage';

// ── Error / utility pages ─────────────────────────────────────────
import UnauthorizedPage from './pages/Unauthorized/UnauthorizedPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// ── Layout shells & route guards ──────────────────────────────────
import AppShell from './layouts/AppShell';
import RecruiterShell from './layouts/RecruiterShell';
import AdminShell from './layouts/AdminShell';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';

// ── Candidate pages ───────────────────────────────────────────────
import CandidateDashboard    from './pages/Dashboard/CandidateDashboard';
import ApplicationsPage      from './pages/candidate/ApplicationsPage';
import InterviewsPage        from './pages/candidate/InterviewsPage';
import ResumeScorePage       from './pages/candidate/ResumeScorePage';
import ScanHistoryPage       from './pages/candidate/ScanHistoryPage';
import CandidateSettingsPage from './pages/candidate/CandidateSettingsPage';

// ── Recruiter pages ───────────────────────────────────────────────
import RecruiterDashboardHome        from './pages/recruiter/RecruiterDashboardHome';
import RecruiterJobsPage             from './pages/recruiter/RecruiterJobsPage';
import RecruiterCandidatesPage       from './pages/recruiter/RecruiterCandidatesPage';
import RecruiterResumeScreeningPage  from './pages/recruiter/RecruiterResumeScreeningPage';
import RecruiterAIInterviewPage      from './pages/recruiter/RecruiterAIInterviewPage';
import RecruiterCandidateRankingPage from './pages/recruiter/RecruiterCandidateRankingPage';
import RecruiterSchedulerPage        from './pages/recruiter/RecruiterSchedulerPage';
import RecruiterProfilePage          from './pages/recruiter/RecruiterProfilePage';
import RecruiterSettingsPage         from './pages/recruiter/RecruiterSettingsPage';
// Recruiter analytics re-uses the rich existing AnalyticsPage
import AnalyticsPage from './pages/Analytics/AnalyticsPage';

// ── Admin pages ───────────────────────────────────────────────────
import AdminDashboardHome         from './pages/admin/AdminDashboardHome';
import AdminUserManagementPage    from './pages/admin/AdminUserManagementPage';
import AdminPlatformAnalyticsPage from './pages/admin/AdminPlatformAnalyticsPage';
import AdminApiKeysPage           from './pages/admin/AdminApiKeysPage';
import AdminSystemSettingsPage    from './pages/admin/AdminSystemSettingsPage';
import AdminProfilePage           from './pages/admin/AdminProfilePage';

/**
 * App — root router.
 *
 * Route structure:
 *   /                    → LandingPage (public)
 *   /products/*          → Public product marketing pages
 *   /login               → LoginPage  (bounces logged-in users to role dashboard)
 *   /register, /forgot-password → public auth pages
 *   /unauthorized        → 403
 *
 *   /recruiter/*         → RECRUITER only  → RecruiterShell (forest-green sidebar)
 *   /admin/*             → ADMIN only      → AdminShell (navy-indigo sidebar)
 *   /candidate/*         → CANDIDATE       → AppShell
 *
 *   *                    → 404
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

        {/* ── PUBLIC ───────────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/products/resume-screening" element={<ResumeScreeningPage />} />
        <Route path="/products/ai-interview"     element={<AIInterviewPage />} />
        <Route path="/products/analytics"        element={<AnalyticsProductPage />} />

        <Route path="/login"    element={<RoleRedirect><LoginPage /></RoleRedirect>} />
        <Route path="/register" element={<RoleRedirect><RegisterPage /></RoleRedirect>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized"    element={<UnauthorizedPage />} />

        {/* ── PROTECTED: RECRUITER ──────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['RECRUITER']} />}>
          <Route element={<RecruiterShell />}>
            <Route path="/recruiter/dashboard"        element={<RecruiterDashboardHome />} />
            <Route path="/recruiter/jobs"             element={<RecruiterJobsPage />} />
            <Route path="/recruiter/candidates"       element={<RecruiterCandidatesPage />} />
            <Route path="/recruiter/resume-screening" element={<RecruiterResumeScreeningPage />} />
            <Route path="/recruiter/ai-interview"     element={<RecruiterAIInterviewPage />} />
            <Route path="/recruiter/ranking"          element={<RecruiterCandidateRankingPage />} />
            <Route path="/recruiter/scheduler"        element={<RecruiterSchedulerPage />} />
            <Route path="/recruiter/analytics"        element={<AnalyticsPage />} />
            <Route path="/recruiter/profile"          element={<RecruiterProfilePage />} />
            <Route path="/recruiter/settings"         element={<RecruiterSettingsPage />} />
          </Route>
        </Route>

        {/* ── PROTECTED: ADMIN ──────────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminShell />}>
            <Route path="/admin/dashboard" element={<AdminDashboardHome />} />
            <Route path="/admin/users"     element={<AdminUserManagementPage />} />
            <Route path="/admin/analytics" element={<AdminPlatformAnalyticsPage />} />
            <Route path="/admin/api-keys"  element={<AdminApiKeysPage />} />
            <Route path="/admin/settings"  element={<AdminSystemSettingsPage />} />
            <Route path="/admin/profile"   element={<AdminProfilePage />} />
          </Route>
        </Route>

        {/* ── PROTECTED: CANDIDATE ──────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['CANDIDATE']} />}>
          <Route element={<AppShell />}>
            <Route path="/candidate/dashboard"    element={<CandidateDashboard />} />
            <Route path="/candidate/applications" element={<ApplicationsPage />} />
            <Route path="/candidate/interviews"   element={<InterviewsPage />} />
            <Route path="/candidate/resume-score" element={<ResumeScorePage />} />
            <Route path="/candidate/score"        element={<ResumeScorePage />} />
            <Route path="/candidate/scan-history"  element={<ScanHistoryPage />} />
            <Route path="/candidate/settings"     element={<CandidateSettingsPage />} />
          </Route>
        </Route>

        {/* ── 404 ──────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  );
};

export default App;
