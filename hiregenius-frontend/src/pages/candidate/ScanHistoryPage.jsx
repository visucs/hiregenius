import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import ModulePendingState from '../../components/ModulePending/ModulePendingState';

const ScanHistoryPage = () => {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      {/* ── Olive/Forest Hero ─────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '12%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                <History size={11} /> Historical Scans
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Scan History</h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 28 }}>
              Archive of all past resume checks, job match scores, and recommendation trends.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area: Honest Empty / Placeholder State ── */}
      <ModulePendingState
        icon={History}
        moduleName="Scan History"
        title="Resume Scan History Coming in Phase 4"
        description="Historical scan archiving will become active alongside the FastAPI AI resume analysis pipeline in Phase 4."
        plannedFeatures={[
          'Searchable history of every resume screening scan',
          'Side-by-side version comparison across resume edits',
          'Historical score progress and skills trajectory charts',
          'One-click re-scoring against newly posted job roles',
        ]}
        phase="Phase 4"
        gotoLink="/candidate/applications"
        gotoText="View My Applications (Active)"
      />
    </div>
  );
};

export default ScanHistoryPage;
