import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import ModulePendingState from '../../components/ModulePending/ModulePendingState';

const ResumeScorePage = () => {
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
                <Target size={11} /> AI Evaluation
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Resume Score</h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 28 }}>
              In-depth ATS parse analysis, skills gap detection, and match report.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area: Honest Empty / Placeholder State ── */}
      <ModulePendingState
        icon={Target}
        moduleName="AI Resume Screening"
        title="AI Resume Scoring Coming in Phase 4"
        description="The AI Resume Screening microservice (FastAPI + Sentence-Transformers) is scheduled for Phase 4. Resume upload and job applications are active now in Phase 3."
        plannedFeatures={[
          'Automated text parsing and entity extraction from PDF/DOCX',
          'Contextual embeddings & skills semantic similarity scoring',
          'Identified missing skills & keyword optimization advice',
          'ATS compatibility checklist and formatting suggestions',
        ]}
        phase="Phase 4"
        gotoLink="/candidate/dashboard"
        gotoText="Go to Candidate Dashboard"
      />
    </div>
  );
};

export default ResumeScorePage;
