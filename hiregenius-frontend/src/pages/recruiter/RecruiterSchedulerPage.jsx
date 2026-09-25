import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import ModulePendingState from '../../components/ModulePending/ModulePendingState';

const RecruiterSchedulerPage = () => {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      {/* ── Hero band ─────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                <CalendarDays size={11} /> Interview Coordination
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Interview Scheduler</h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 28 }}>
              Synchronized scheduling, calendar integrations, and interview slot management.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area: Honest Empty / Placeholder State ── */}
      <ModulePendingState
        icon={CalendarDays}
        moduleName="Interview Scheduler"
        title="Interview Scheduler Coming in Phase 3"
        description="Interview scheduling and candidate calendar coordination will be available once the Calendar & Interview Coordination backend service is connected."
        plannedFeatures={[
          'Google Calendar & Microsoft Outlook calendar synchronization',
          'Automated Google Meet / Zoom meeting link generation',
          'Candidate self-serve slot selection invitations via email',
          'Automated RSVP tracking and interview reminder alerts',
        ]}
        phase="Phase 3"
      />
    </div>
  );
};

export default RecruiterSchedulerPage;
