import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Calendar, Clock, CheckCircle2, Play, X,
  Award, Sparkles, ChevronRight, TrendingUp, Video,
  Mic, Star, ArrowUpRight, Shield, User, Zap,
} from 'lucide-react';
import { MOCK_CANDIDATE_INTERVIEWS } from '../../mock/candidate/candidateMock';

/* ─── Recommendation config ───────────────────────────────── */
const REC_CFG = {
  RECOMMENDED: { label: '✓ Highly Recommended', bg: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', shadow: '0 3px 12px rgba(61,80,22,0.45)' },
  CONSIDER:    { label: 'Consider with Review',  bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.30)' },
  NOT_A_FIT:   { label: 'Not a Fit',             bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.30)' },
};

/* ─── Score color ─────────────────────────────────────────── */
const scoreColor = s => s >= 85 ? '#34d399' : s >= 70 ? '#6B8A3A' : s >= 50 ? '#f59e0b' : '#f87171';

/* ─── Animated score bar ──────────────────────────────────── */
const ScoreBar = ({ label, value }) => {
  const c = scoreColor(value);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: c }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, #3D5016, ${c})` }}
        />
      </div>
    </div>
  );
};

/* ─── Inline score chip ───────────────────────────────────── */
const ScoreChip = ({ label, value }) => (
  <div style={{ textAlign: 'center', padding: '10px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)' }}>
    <p style={{ fontSize: 20, fontWeight: 900, color: scoreColor(value), letterSpacing: '-0.04em', lineHeight: 1 }}>{value}%</p>
    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{label}</p>
  </div>
);

/* ─── Section heading ─────────────────────────────────────── */
const SectionHead = ({ icon: Icon, iconColor, children, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={15} style={{ color: iconColor }} />
    </div>
    <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>{children}</h2>
    {count > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${iconColor}12`, color: iconColor, border: `1px solid ${iconColor}22` }}>{count}</span>}
    <div style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: 4 }} />
  </div>
);

/* ════════════════════════════════════════════════════════════
   INTERVIEWS PAGE
════════════════════════════════════════════════════════════ */
const InterviewsPage = () => {
  const [loading, setLoading]                     = useState(true);
  const [interviews, setInterviews]               = useState({ upcoming: [], completed: [] });
  const [activeTab, setActiveTab]                 = useState('all');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [startSessionModal, setStartSessionModal] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setInterviews(MOCK_CANDIDATE_INTERVIEWS); setLoading(false); }, 300);
    return () => clearTimeout(t);
  }, []);

  const upCount   = interviews.upcoming.length;
  const doneCount = interviews.completed.length;
  const totalCount= upCount + doneCount;

  const TABS = [
    { key: 'all',       label: 'All Sessions',           count: totalCount },
    { key: 'upcoming',  label: 'Upcoming',               count: upCount    },
    { key: 'completed', label: 'Completed',              count: doneCount  },
  ];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Olive/Forest Hero ─────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '5%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            {/* Title + stat chips */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <MessageSquare size={11} /> My Career
                  </span>
                </div>
                <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>My Interviews</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>Your scheduled AI interview sessions and past evaluation scorecards.</p>
              </div>

              {/* Quick stat chips */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total',     value: totalCount,  color: '#fff'     },
                  { label: 'Upcoming',  value: upCount,     color: '#a3e635'  },
                  { label: 'Completed', value: doneCount,   color: '#34d399'  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', gap: 7, alignItems: 'center' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab row */}
            <div style={{ display: 'flex', gap: 5, paddingBottom: 28, flexWrap: 'wrap' }}>
              {TABS.map(t => {
                const active = activeTab === t.key;
                return (
                  <motion.button key={t.key} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(t.key)}
                    style={{ padding: '8px 16px', minHeight: 38, borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'rgba(255,255,255,0.07)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.50)',
                      boxShadow: active ? '0 3px 12px rgba(61,80,22,0.50)' : 'none',
                    }}
                  >{t.label} ({t.count})</motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Loading */}
        {loading && [1,2].map(i => (
          <div key={i} style={{ height: 100, borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)', animation: 'shimmer 1.4s infinite' }} />
          </div>
        ))}

        {/* Upcoming Section */}
        {!loading && (activeTab === 'all' || activeTab === 'upcoming') && (
          <div>
            <SectionHead icon={Clock} iconColor="#60a5fa" count={upCount}>Upcoming Sessions</SectionHead>

            {upCount === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>No upcoming sessions scheduled.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {interviews.upcoming.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: 'clamp(14px, 3vw, 20px) clamp(14px, 3vw, 24px)', borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative', transition: 'all 0.18s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.07)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
                  >
                    {/* Left accent */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, #3D5016, #6B8A3A)' }} />

                    <div style={{ paddingLeft: 6, flex: 1, minWidth: 'min(100%, 200px)' }}>
                      {/* Format badge */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', background: 'rgba(107,138,58,0.10)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.22)', marginBottom: 8 }}>
                        <Video size={10} /> {item.format}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 5 }}>{item.jobTitle}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{item.company}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{item.scheduledDate} at {item.scheduledTime}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{item.duration}</span>
                      </div>
                    </div>

                    <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setStartSessionModal(item)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '11px 22px', minHeight: 44, borderRadius: 13, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 18px rgba(61,80,22,0.45)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}
                    >
                      <Play size={13} fill="#fff" /> Start Interview <ArrowUpRight size={13} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Section */}
        {!loading && (activeTab === 'all' || activeTab === 'completed') && (
          <div>
            <SectionHead icon={CheckCircle2} iconColor="#34d399" count={doneCount}>Completed Scorecards</SectionHead>

            {doneCount === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>No completed interviews yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {interviews.completed.map((item, i) => {
                  const rec = REC_CFG[item.overallRecommendation] ?? REC_CFG.RECOMMENDED;
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.32, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => setSelectedInterview(item)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: 'clamp(14px, 3vw, 20px) clamp(14px, 3vw, 24px)', borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'all 0.18s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.07)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
                    >
                      {/* Left accent */}
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, #34d399, #6B8A3A)' }} />

                      <div style={{ paddingLeft: 6, flex: 1, minWidth: 'min(100%, 200px)' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={11} /> Taken on {item.dateTaken}
                        </p>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 3 }}>{item.jobTitle}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.company}</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        {/* Score chips */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <ScoreChip label="Comm."   value={item.scores.communication} />
                          <ScoreChip label="Conf."   value={item.scores.confidence} />
                          <ScoreChip label="Tech"    value={item.scores.technical} />
                        </div>

                        {/* Recommendation badge */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 12, background: rec.bg, color: rec.color, fontSize: 12, fontWeight: 800, border: rec.border ?? 'none', boxShadow: rec.shadow ?? 'none', whiteSpace: 'nowrap' }}>
                          {rec.label}
                        </span>

                        <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Scorecard Detail Modal ─────────────────────────── */}
      <AnimatePresence>
        {selectedInterview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
              onClick={() => setSelectedInterview(null)}
            />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px, 3vw, 24px)', pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24, boxShadow: '0 32px 96px rgba(0,0,0,0.40)', pointerEvents: 'auto' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '24px 24px 0 0' }} />

                {/* Modal header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px clamp(14px, 3vw, 26px) 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10, backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, minWidth: 44, borderRadius: 14, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(61,80,22,0.40)' }}>
                      <Award size={20} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 3 }}>AI Interview Scorecard</p>
                      <h2 style={{ fontSize: 'clamp(15px, 3vw, 18px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>{selectedInterview.jobTitle}</h2>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedInterview.company} · {selectedInterview.dateTaken}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedInterview(null)}
                    style={{ width: 44, height: 44, minWidth: 44, borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}
                  ><X size={16} /></button>
                </div>

                <div style={{ padding: 'clamp(16px, 3vw, 22px) clamp(14px, 3vw, 26px) 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Score bars */}
                  <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)' }}>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 14 }}>Performance Evaluation</p>
                    <ScoreBar label="Communication"  value={selectedInterview.scores.communication} />
                    <ScoreBar label="Confidence"     value={selectedInterview.scores.confidence} />
                    <ScoreBar label="Technical Depth" value={selectedInterview.scores.technical} />
                  </div>

                  {/* AI Feedback */}
                  <div style={{ padding: '16px 18px', borderRadius: 16, background: 'rgba(107,138,58,0.08)', border: '1px solid rgba(107,138,58,0.22)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>AI Recommendation & Feedback</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{selectedInterview.aiFeedback}</p>
                  </div>

                  {/* Q&A list */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 12 }}>Question List & AI Assessment</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedInterview.questions.map((q, idx) => {
                        const sc = scoreColor(q.score);
                        return (
                          <div key={idx} style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>{q.num}: {q.question}</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: sc, background: `${sc}14`, padding: '3px 10px', borderRadius: 999, border: `1px solid ${sc}22`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {q.score}%
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.55, marginBottom: 8 }}>"{q.candidateAnswer}"</p>
                            <div style={{ display: 'flex', gap: 7, padding: '9px 12px', borderRadius: 10, background: 'rgba(107,138,58,0.06)', border: '1px solid rgba(107,138,58,0.15)' }}>
                              <Sparkles size={13} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }} />
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}><strong>AI Note:</strong> {q.aiNote}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Start Interview Confirm Modal ──────────────────── */}
      <AnimatePresence>
        {startSessionModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
              onClick={() => setStartSessionModal(null)}
            />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px, 3vw, 24px)', pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 460, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24, boxShadow: '0 32px 96px rgba(0,0,0,0.40)', textAlign: 'center', pointerEvents: 'auto', overflow: 'hidden' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '24px 24px 0 0' }} />
                <div style={{ padding: '28px clamp(16px, 4vw, 28px) 24px' }}>
                  <motion.div animate={{ rotate: [0, -10, 10, -8, 8, 0] }} transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 28px rgba(61,80,22,0.55)' }}
                  >
                    <Play size={26} color="#fff" fill="#fff" />
                  </motion.div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>Ready to begin?</h3>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>{startSessionModal.jobTitle}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 24 }}>
                    You're about to start your interactive AI interview session ({startSessionModal.duration}). Make sure your camera/microphone or text environment is ready.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => setStartSessionModal(null)}
                      style={{ flex: '1 1 120px', padding: '11px 0', minHeight: 44, borderRadius: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >Cancel</button>
                    <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      href="/candidate/ai-interview"
                      style={{ flex: '1 1 140px', padding: '11px 0', minHeight: 44, borderRadius: 13, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 18px rgba(61,80,22,0.45)' }}
                    ><Zap size={14} />Begin Now</motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>
    </div>
  );
};

export default InterviewsPage;
