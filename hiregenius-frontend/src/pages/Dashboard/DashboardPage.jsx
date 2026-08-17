import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';

/**
 * DashboardPage — Phase 1 placeholder.
 * Full dashboard shell and widgets are Phase 2 scope.
 * This page confirms auth works and routes are functional.
 */
const DashboardPage = () => {
  const user = useSelector(selectUser);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Welcome header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            HireGenius AI dashboard — Phase 2 widgets coming next.
          </p>
        </div>

        {/* Phase status card */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={20} style={{ color: 'var(--secondary)' }} />
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Build Progress
            </h2>
          </div>
          <div className="space-y-2">
            {[
              { phase: 'Phase 0 — Project Setup', done: true },
              { phase: 'Phase 1 — Authentication', done: true },
              { phase: 'Phase 2 — Dashboard Shell', done: false },
              { phase: 'Phase 3 — Job Management', done: false },
              { phase: 'Phase 4 — Candidate Management', done: false },
              { phase: 'Phase 5–12 — AI Features & Deployment', done: false },
            ].map(({ phase, done }) => (
              <div key={phase} className="flex items-center gap-3 text-sm">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: done ? 'var(--success)' : 'var(--border)' }}
                />
                <span
                  style={{
                    color: done ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: done ? 500 : 400,
                  }}
                >
                  {phase}
                </span>
                {done && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)',
                      color: 'var(--success)',
                    }}
                  >
                    ✓ Done
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Auth info card */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <h3
            className="text-base font-semibold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Authenticated Session
          </h3>
          <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex gap-2">
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Name:</span>
              <span>{user?.name || '—'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Email:</span>
              <span>{user?.email || '—'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Role:</span>
              <span>{user?.role || '—'}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
