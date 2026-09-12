import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, Clock, Play, X, Mic,
  ChevronRight, Trophy, Users, BarChart3, Zap, Star,
} from 'lucide-react';
import { MOCK_INTERVIEW_CANDIDATES, MOCK_INTERVIEW_RESULT } from '../../mock/recruiter/interviewMock';

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_CFG = {
  PENDING:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', label: 'Pending',   icon: Clock,        bar: '#64748b' },
  GENERATED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  label: 'Generated', icon: Sparkles,     bar: '#f59e0b' },
  COMPLETED: { color: '#34d399', bg: 'rgba(52,211,153,0.10)',  label: 'Completed', icon: CheckCircle2, bar: '#34d399' },
};

/* ─── Score bar inside result panel ─────────────────────────── */
const ScoreBar = ({ label, score, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color }}>{score}%</span>
    </div>
    <div style={{ height: 6, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${score}%` }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
      />
    </div>
  </div>
);

/* ─── Result panel (modal) ───────────────────────────────────── */
const InterviewResultPanel = ({ candidateName, result, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
  >
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
    <motion.div
      initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', borderRadius: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 32px 96px rgba(0,0,0,0.30)' }}
    >
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(61,80,22,0.08), transparent)', position: 'sticky', top: 0, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(107,138,58,0.15)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Interview Results</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{candidateName}</p>
          </div>
        </div>
        <button onClick={onClose} id="interview-result-close"
          style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '22px 24px' }}>
        {/* AI Evaluation scores */}
        <div style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--border)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>AI Evaluation</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}>
              {result.evaluation.recommendation}
            </span>
          </div>
          <ScoreBar label="Communication" score={result.evaluation.communicationScore} color="#60a5fa" />
          <ScoreBar label="Confidence"    score={result.evaluation.confidenceScore}    color="#f59e0b" />
          <ScoreBar label="Technical"     score={result.evaluation.technicalScore}     color="#34d399" />
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Overall Score</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{result.evaluation.overallScore}</span>
          </div>
        </div>

        {/* AI summary */}
        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(107,138,58,0.06)', border: '1px solid rgba(107,138,58,0.18)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={13} style={{ color: 'var(--primary)' }} />
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>AI Summary</p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.evaluation.summary}</p>
        </div>

        {/* Questions */}
        <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>Interview Questions ({result.questions.length})</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.questions.map((q, i) => (
            <div key={q.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1px 7px', borderRadius: 999, background: 'rgba(107,138,58,0.12)', color: 'var(--primary)', marginBottom: 5, display: 'inline-block' }}>{q.category}</span>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{q.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════════
   AI INTERVIEW PAGE
════════════════════════════════════════════════════════════════ */
const RecruiterAIInterviewPage = () => {
  const [candidates, setCandidates] = useState(MOCK_INTERVIEW_CANDIDATES);
  const [generatingId, setGeneratingId] = useState(null);
  const [resultPanel, setResultPanel] = useState(null);

  const generate = async (candidateId, name) => {
    setGeneratingId(candidateId);
    await new Promise((r) => setTimeout(r, 1400));
    setCandidates((prev) => prev.map((c) => c.candidateId === candidateId ? { ...c, interviewStatus: 'GENERATED' } : c));
    setGeneratingId(null);
    setResultPanel({ candidateName: name, result: MOCK_INTERVIEW_RESULT });
  };

  const stats = {
    total:     candidates.length,
    completed: candidates.filter(c => c.interviewStatus === 'COMPLETED').length,
    generated: candidates.filter(c => c.interviewStatus === 'GENERATED').length,
    pending:   candidates.filter(c => c.interviewStatus === 'PENDING').length,
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: '32px 36px 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                <Mic size={11} /> AI Interview Generator
              </span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>AI Interview</h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', marginBottom: 28 }}>Generate and track AI-powered interviews for shortlisted candidates</p>
          </motion.div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 28 }}>
            {[
              { label: 'Total',     value: stats.total,     color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
              { label: 'Completed', value: stats.completed, color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
              { label: 'Generated', value: stats.generated, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
              { label: 'Pending',   value: stats.pending,   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: bg, border: `1px solid ${color}20` }}>
                <span style={{ fontSize: 18, fontWeight: 900, color }}>{value}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cards list ────────────────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {candidates.map((c, i) => {
          const sc  = STATUS_CFG[c.interviewStatus];
          const Icon = sc.icon;
          const isGenerating = generatingId === c.candidateId;

          return (
            <motion.div
              key={c.candidateId}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'flex', alignItems: 'center', gap: 18,
                padding: '20px 24px', borderRadius: 20,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'all 0.18s ease', cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Rank number */}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>#{i + 1}</span>
              </div>

              {/* Avatar */}
              <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 12px rgba(61,80,22,0.35)' }}>
                {c.candidateName.charAt(0)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 3 }}>{c.candidateName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.jobTitle}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-hover)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={11} style={{ color: '#f59e0b' }} />
                    Resume: <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{c.resumeScore}</strong>
                  </span>
                </div>
              </div>

              {/* Status indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: sc.bg, flexShrink: 0 }}>
                <Icon size={13} style={{ color: sc.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{sc.label}</span>
              </div>

              {/* Action button */}
              <div style={{ flexShrink: 0 }}>
                {c.interviewStatus === 'COMPLETED' ? (
                  <button
                    onClick={() => setResultPanel({ candidateName: c.candidateName, result: MOCK_INTERVIEW_RESULT })}
                    id={`interview-view-${c.candidateId}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 12, border: '1px solid rgba(52,211,153,0.30)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.15)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.50)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.08)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.30)'; }}
                  >
                    <CheckCircle2 size={14} /> View Results
                  </button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => generate(c.candidateId, c.candidateName)}
                    disabled={isGenerating}
                    id={`interview-generate-${c.candidateId}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                      background: isGenerating ? 'rgba(107,138,58,0.25)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                      color: '#fff', fontSize: 13, fontWeight: 800, cursor: isGenerating ? 'not-allowed' : 'pointer', border: 'none',
                      boxShadow: isGenerating ? 'none' : '0 4px 16px rgba(61,80,22,0.40)',
                      transition: 'all 0.18s', letterSpacing: '-0.01em',
                    }}
                    onMouseEnter={e => { if (!isGenerating) e.currentTarget.style.boxShadow = '0 6px 24px rgba(61,80,22,0.55)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = isGenerating ? 'none' : '0 4px 16px rgba(61,80,22,0.40)'; }}
                  >
                    {isGenerating ? (
                      <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Generating…</>
                    ) : c.interviewStatus === 'GENERATED' ? (
                      <><Play size={14} />View Interview</>
                    ) : (
                      <><Play size={14} />Generate Interview</>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {resultPanel && (
          <InterviewResultPanel
            candidateName={resultPanel.candidateName}
            result={resultPanel.result}
            onClose={() => setResultPanel(null)}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RecruiterAIInterviewPage;
