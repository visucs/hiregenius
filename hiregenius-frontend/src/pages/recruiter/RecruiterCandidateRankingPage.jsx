import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, Sparkles, TrendingUp, Star, Medal, ArrowRight } from 'lucide-react';
import { MOCK_RANKINGS } from '../../mock/recruiter/rankingMock';
import { MOCK_JOBS } from '../../mock/recruiter/jobsMock';

const MEDAL_STYLE = {
  1: { emoji: '🥇', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)' },
  2: { emoji: '🥈', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.30)' },
  3: { emoji: '🥉', color: '#cd7c3c', bg: 'rgba(205,124,60,0.12)', border: 'rgba(205,124,60,0.30)' },
};

const scoreColor = (v) => v >= 80 ? '#34d399' : v >= 60 ? '#f59e0b' : '#ef4444';

const ScorePill = ({ value, label }) => (
  <div style={{ textAlign: 'center', minWidth: 54 }}>
    <p style={{ fontSize: 22, fontWeight: 900, color: scoreColor(value), letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>{label}</p>
  </div>
);

const RecruiterCandidateRankingPage = () => {
  const [selectedJobId, setSelectedJobId] = useState(MOCK_JOBS[0]?.id ?? '');
  const rankings = MOCK_RANKINGS[selectedJobId] ?? [];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                <Trophy size={11} /> AI-Powered Ranking
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Candidate Ranking</h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', marginBottom: 24 }}>AI-ranked applicants per job posting — sorted by overall match quality</p>
          </motion.div>

          {/* Job selector */}
          <div style={{ paddingBottom: 28 }}>
            <div style={{ position: 'relative', display: 'inline-flex', width: 'min(340px, 100%)' }}>
              <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(163,230,53,0.7)', pointerEvents: 'none' }} />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                id="ranking-job-select"
                style={{
                  appearance: 'none', paddingLeft: 16, paddingRight: 42, paddingTop: 11, paddingBottom: 11,
                  minHeight: 44, width: '100%',
                  borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(107,138,58,0.35)', color: '#fff',
                  outline: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.20)',
                }}
              >
                {MOCK_JOBS.map((j) => <option key={j.id} value={j.id} style={{ background: '#18280a' }}>{j.title}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rankings list ─────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px' }}>
        {rankings.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <Trophy size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No ranked candidates</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rankings appear once resume screening is complete.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedJobId}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {rankings.map((r, i) => {
                const medal = MEDAL_STYLE[r.rank];
                const isTop = r.rank === 1;

                return (
                  <motion.div
                    key={r.candidateId}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.32, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="rec-rank-card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 18px)',
                      padding: 'clamp(14px, 2.5vw, 22px) clamp(14px, 2.5vw, 26px)', borderRadius: 20,
                      background: isTop ? 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02), var(--bg-elevated))' : 'var(--bg-elevated)',
                      border: `1px solid ${isTop ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
                      boxShadow: isTop ? '0 4px 24px rgba(245,158,11,0.08)' : '0 2px 12px rgba(0,0,0,0.04)',
                      transition: 'all 0.18s ease', position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isTop ? '0 8px 32px rgba(245,158,11,0.14)' : '0 6px 24px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isTop ? '0 4px 24px rgba(245,158,11,0.08)' : '0 2px 12px rgba(0,0,0,0.04)'; }}
                  >
                    {/* Top stripe */}
                    {isTop && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #f59e0b00, #f59e0b, #f59e0b00)' }} />}

                    {/* Left: Medal + Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {/* Medal */}
                      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: medal?.bg ?? 'var(--card-row-bg)', border: `1px solid ${medal?.border ?? 'var(--border)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <span style={{ fontSize: 18 }}>{medal?.emoji ?? `#${r.rank}`}</span>
                      </div>

                      {/* Avatar */}
                      <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, boxShadow: '0 3px 10px rgba(61,80,22,0.35)' }}>
                        {r.candidateName.charAt(0)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="rec-rank-info" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{r.candidateName}</p>
                        {isTop && <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.14)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.30)' }}>Top Candidate</span>}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 480 }}>{r.aiReasoning}</p>
                    </div>

                    {/* Scores */}
                    <div className="rec-rank-scores" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 14px', borderRadius: 12, background: `${scoreColor(r.matchScore)}12`, border: `1px solid ${scoreColor(r.matchScore)}25` }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: scoreColor(r.matchScore), letterSpacing: '-0.05em', lineHeight: 1 }}>{r.matchScore}%</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3, marginTop: 4, fontWeight: 600 }}>Match</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{r.resumeScore}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Resume</span>
                        </div>
                        {r.interviewScore != null && (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#60a5fa', letterSpacing: '-0.04em' }}>{r.interviewScore}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Interview</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ArrowRight size={16} className="rec-rank-arrow" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <style>{`
        @media (max-width: 680px) {
          .rec-rank-card {
            flex-wrap: wrap !important;
          }
          .rec-rank-info {
            width: 100% !important;
            order: 3 !important;
          }
          .rec-rank-scores {
            margin-left: auto !important;
            order: 2 !important;
          }
          .rec-rank-arrow {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RecruiterCandidateRankingPage;
