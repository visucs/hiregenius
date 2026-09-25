import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import ModulePendingState from '../../components/ModulePending/ModulePendingState';

const RecruiterCandidateRankingPage = () => {
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
                <Trophy size={11} /> AI Ranking
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Candidate Ranking</h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 28 }}>
              Automated stack-ranking and multi-factor suitability scoring across candidate pools.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area: Honest Empty / Placeholder State ── */}
      <ModulePendingState
        icon={Trophy}
        moduleName="Candidate Ranking"
        title="Candidate Ranking Coming in Phase 3"
        description="Automated candidate stack-ranking, composite scoring, and shortlist recommendations per job opening will activate when the ML Ranking microservice is connected."
        plannedFeatures={[
          'Composite scoring combining Resume Match + AI Interview Results',
          'Automated Top-N candidate stack rank with AI selection rationale',
          'Direct comparison matrix across required skills and competencies',
          'Instant shortlist export for hiring decision makers',
        ]}
        phase="Phase 3"
      />
    </div>
  );
};

export default RecruiterCandidateRankingPage;
