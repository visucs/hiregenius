import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Download, ChevronRight, AlertCircle,
  Users, TrendingUp, ArrowRight, Star, Briefcase, Mail,
} from 'lucide-react';
import { MOCK_CANDIDATES } from '../../mock/recruiter/candidatesMock';

/* ─── Config ─────────────────────────────────────────────────── */
const STATUS_CFG = {
  SCREENED:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  label: 'Screened'    },
  INTERVIEWED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.28)',  label: 'Interviewed' },
  SHORTLISTED: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',  label: 'Shortlisted' },
  REJECTED:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)',   label: 'Rejected'    },
};

const scoreColor  = (v) => v >= 80 ? '#34d399' : v >= 60 ? '#f59e0b' : '#ef4444';
const formatDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] ?? { color: 'var(--text-muted)', bg: 'var(--border)', border: 'var(--border)', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
      {c.label}
    </span>
  );
};

const ScoreBar = ({ score }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
    <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${score}%`, borderRadius: 999, background: `linear-gradient(90deg, ${scoreColor(score)}, ${scoreColor(score)}88)` }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(score), minWidth: 24, textAlign: 'right' }}>{score}</span>
  </div>
);

/* ─── Slide-out detail panel ─────────────────────────────────── */
const DetailPanel = ({ candidate, onClose }) => {
  const c = STATUS_CFG[candidate.status] ?? STATUS_CFG.SCREENED;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 290, damping: 30 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, height: '100%', overflowY: 'auto', background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border)', boxShadow: '-16px 0 64px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', background: 'rgba(252,251,247,0.92)', padding: '18px 22px' }} className="dark:!bg-[rgba(15,24,5,0.92)]">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, boxShadow: '0 3px 10px rgba(61,80,22,0.35)', flexShrink: 0 }}>
                {candidate.name.charAt(0)}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{candidate.name}</p>
                <StatusBadge status={candidate.status} />
              </div>
            </div>
            <button onClick={onClose} id="candidates-detail-close"
              style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '22px' }}>
          {/* Applied to */}
          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Briefcase size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Applied for</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{candidate.appliedJobTitle}</p>
            </div>
          </div>

          {/* Score breakdown */}
          <Section title="Score Breakdown" icon={Star}>
            {Object.entries(candidate.scoreBreakdown).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 100, height: 5, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${scoreColor(val)}, ${scoreColor(val)}88)` }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(val), minWidth: 20, textAlign: 'right' }}>{val}</span>
                </div>
              </div>
            ))}
          </Section>

          {/* Skills */}
          <Section title="Skills">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {candidate.skills.map((s) => (
                <span key={s} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: 'rgba(107,138,58,0.10)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.22)' }}>{s}</span>
              ))}
            </div>
          </Section>

          {/* Education */}
          <Section title="Education">
            {candidate.education.map((e, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{e.degree}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.institution} · {e.year}</p>
              </div>
            ))}
          </Section>

          {/* Experience */}
          <Section title="Experience">
            {candidate.experience.map((e, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{e.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.company} · {e.years} yrs</p>
              </div>
            ))}
          </Section>

          {/* Resume */}
          <Section title="Resume">
            {candidate.resumeUrl ? (
              <a href={candidate.resumeUrl} download
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(107,138,58,0.08)', color: 'var(--primary)', border: '1px solid rgba(107,138,58,0.22)', fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,138,58,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,138,58,0.08)'}
              >
                <Download size={14} /> Download Resume
              </a>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} />No resume on file</p>
            )}
          </Section>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div style={{ marginBottom: 22 }}>
    <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
      {Icon && <Icon size={12} />} {title}
    </p>
    {children}
  </div>
);

/* ════════════════════════════════════════════════════════════════
   CANDIDATES PAGE
════════════════════════════════════════════════════════════════ */
const FILTER_TABS = ['ALL', 'SCREENED', 'INTERVIEWED', 'SHORTLISTED', 'REJECTED'];

const RecruiterCandidatesPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const candidates = MOCK_CANDIDATES;

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.appliedJobTitle.toLowerCase().includes(q);
    const matchS = statusFilter === 'ALL' || c.status === statusFilter;
    return matchQ && matchS;
  });

  const statusCounts = Object.fromEntries(
    FILTER_TABS.filter(t => t !== 'ALL').map(t => [t, candidates.filter(c => c.status === t).length])
  );

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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <Users size={11} /> All Applicants
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Candidates</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>{candidates.length} total applicants across all roles</p>
              </div>

              {/* Status stat pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'SHORTLISTED', label: 'Shortlisted', color: '#34d399' },
                  { key: 'INTERVIEWED', label: 'Interviewed', color: '#60a5fa' },
                  { key: 'SCREENED',    label: 'Screened',    color: '#f59e0b' },
                  { key: 'REJECTED',   label: 'Rejected',    color: '#ef4444' },
                ].map(({ key, label, color }) => (
                  <div key={key} style={{ padding: '8px 14px', borderRadius: 12, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setStatusFilter(key)}
                  >
                    <span style={{ fontSize: 18, fontWeight: 900, color }}>{statusCounts[key] ?? 0}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search + filter row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingBottom: 22 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(163,230,53,0.5)', pointerEvents: 'none' }} />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(163,230,53,0.5)', padding: 0, display: 'flex' }}>
                    <X size={13} />
                  </button>
                )}
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or job…" id="candidates-search"
                  style={{ width: '100%', paddingLeft: 36, paddingRight: 34, paddingTop: 9, paddingBottom: 9, borderRadius: 11, fontSize: 13, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(107,138,58,0.30)', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(107,138,58,0.20)' }}>
                {FILTER_TABS.map((s) => {
                  const cfg = STATUS_CFG[s];
                  const active = statusFilter === s;
                  return (
                    <button key={s} onClick={() => setStatusFilter(s)} id={`candidates-filter-${s.toLowerCase()}`}
                      style={{ padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: active ? (cfg?.color ?? '#fff') : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}
                    >
                      {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Table card ────────────────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          style={{ borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No candidates found</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--card-row-bg)', borderBottom: '1px solid var(--border)' }}>
                    {['Candidate', 'Applied Job', 'Resume Score', 'Status', 'Date', ''].map((h) => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelected(c)}
                      id={`candidates-row-${c.id}`}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.13s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--card-row-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: '0 2px 8px rgba(61,80,22,0.30)' }}>
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{c.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Mail size={10} />{c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{c.appliedJobTitle}</span>
                      </td>
                      <td style={{ padding: '16px 20px', minWidth: 160 }}>
                        <ScoreBar score={c.resumeScore} />
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{formatDate(c.appliedAt)}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selected && <DetailPanel candidate={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterCandidatesPage;
