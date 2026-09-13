import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Briefcase, Building2, Calendar, CheckCircle2,
  ChevronRight, ChevronDown, ArrowRight, MapPin,
  Star, Layers, TrendingUp, FileText, Clock,
} from 'lucide-react';
import { MOCK_CANDIDATE_APPLICATIONS } from '../../mock/candidate/candidateMock';

/* ─── Status config ───────────────────────────────────────── */
const STATUS_CFG = {
  APPLIED:    { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.28)',  color: '#60a5fa', dot: '#60a5fa',  label: 'Applied'        },
  SCREENING:  { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  color: '#f59e0b', dot: '#f59e0b',  label: 'Screening'       },
  INTERVIEW:  { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.28)', color: '#a78bfa', dot: '#a78bfa',  label: 'Interview'       },
  OFFER:      { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',  color: '#34d399', dot: '#34d399',  label: 'Offer Extended'  },
  REJECTED:   { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)', color: '#f87171', dot: '#f87171',  label: 'Rejected'        },
};

const STATUS_TABS = ['All', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

/* ─── Score color ─────────────────────────────────────────── */
const scoreColor = s => s >= 85 ? '#34d399' : s >= 70 ? '#6B8A3A' : s >= 50 ? '#f59e0b' : '#f87171';

/* ─── Status badge ────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] ?? STATUS_CFG.APPLIED;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />{c.label}
    </span>
  );
};

/* ─── Skill bar ───────────────────────────────────────────── */
const SkillBar = ({ label, pct }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(pct) }}>{pct}%</span>
    </div>
    <div style={{ height: 5, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, #3D5016, ${scoreColor(pct)})` }}
      />
    </div>
  </div>
);

/* ─── Timeline step ───────────────────────────────────────── */
const TimelineTrack = ({ steps }) => (
  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 6 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minWidth: 260 }}>
      {steps.map((step, idx) => {
        const isLast    = idx === steps.length - 1;
        const dotColor  = step.current ? '#6B8A3A' : step.completed ? '#34d399' : 'var(--border)';
        const lineColor = step.completed ? '#34d399' : 'var(--border)';
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? 0 : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 54 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, boxShadow: step.current ? '0 0 0 3px rgba(107,138,58,0.28)' : 'none', transition: 'all 0.3s', marginBottom: 6 }}>
                {step.completed ? '✓' : idx + 1}
              </div>
              <div style={{ fontSize: 11, fontWeight: step.current ? 700 : 600, color: step.current ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap' }}>{step.stage}</div>
              {step.date && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{step.date}</div>}
            </div>
            {!isLast && <div style={{ flex: 1, height: 2, background: lineColor, marginTop: 11, minWidth: 12, transition: 'background 0.3s' }} />}
          </div>
        );
      })}
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════
   APPLICATIONS PAGE
════════════════════════════════════════════════════════════ */
const ApplicationsPage = () => {
  const [loading, setLoading]             = useState(true);
  const [applications, setApplications]   = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery]     = useState('');
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const ITEMS = 10;

  useEffect(() => {
    const t = setTimeout(() => { setApplications(MOCK_CANDIDATE_APPLICATIONS); setLoading(false); }, 300);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => applications.filter(app => {
    const mStatus = selectedStatus === 'All' || app.status.toUpperCase() === selectedStatus.toUpperCase();
    const mSearch = app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) || app.company.toLowerCase().includes(searchQuery.toLowerCase());
    return mStatus && mSearch;
  }), [applications, selectedStatus, searchQuery]);

  const totalPages  = Math.ceil(filtered.length / ITEMS) || 1;
  const paginated   = useMemo(() => filtered.slice((currentPage - 1) * ITEMS, currentPage * ITEMS), [filtered, currentPage]);
  const setTab      = tab => { setSelectedStatus(tab); setCurrentPage(1); };

  /* stat counts */
  const counts = useMemo(() => STATUS_TABS.slice(1).reduce((acc, t) => {
    acc[t] = applications.filter(a => a.status.toUpperCase() === t.toUpperCase()).length;
    return acc;
  }, {}), [applications]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Olive/Forest Hero ─────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(14px, 4vw, 36px) 0' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <Briefcase size={11} /> My Career
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Applications</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>Track every job you've applied to and view interactive stage timelines.</p>
              </div>

              {/* Quick count badge */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total',     value: applications.length, color: '#fff' },
                  { label: 'Active',    value: (counts['Applied'] ?? 0) + (counts['Screening'] ?? 0) + (counts['Interview'] ?? 0), color: '#a3e635' },
                  { label: 'Offers',    value: counts['Offer'] ?? 0, color: '#34d399' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', gap: 7, alignItems: 'center' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status tabs row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', paddingBottom: 28 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {STATUS_TABS.map(tab => {
                  const active = selectedStatus === tab;
                  const count  = tab === 'All' ? applications.length : (counts[tab] ?? 0);
                  return (
                    <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setTab(tab)}
                      style={{ padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        background: active ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'rgba(255,255,255,0.07)',
                        color: active ? '#fff' : 'rgba(255,255,255,0.50)',
                        boxShadow: active ? '0 3px 12px rgba(61,80,22,0.50)' : 'none',
                      }}
                    >{tab} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}</motion.button>
                  );
                })}
              </div>

              {/* Search */}
              <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.40)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Search by job or company…" value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(107,138,58,0.30)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Loading skeleton */}
        {loading && [1,2,3].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)', animation: 'shimmer 1.4s infinite' }} />
          </div>
        ))}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '60px 32px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20 }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(107,138,58,0.12)', border: '1px solid rgba(107,138,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Briefcase size={26} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              {searchQuery || selectedStatus !== 'All' ? 'No applications match your filter' : "You haven't applied to any jobs yet"}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.65 }}>
              {searchQuery || selectedStatus !== 'All' ? 'Try adjusting your search or clearing status filters.' : 'Run your first AI resume screening check to get started.'}
            </p>
            {(searchQuery || selectedStatus !== 'All') ? (
              <button onClick={() => { setSearchQuery(''); setSelectedStatus('All'); }}
                style={{ padding: '10px 20px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >Reset Filters</button>
            ) : (
              <a href="/candidate/resume-score"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 18px rgba(61,80,22,0.40)' }}
              >Browse Open Roles <ArrowRight size={14} /></a>
            )}
          </motion.div>
        )}

        {/* Application cards */}
        {!loading && filtered.length > 0 && (
          <>
            {paginated.map((app, i) => {
              const chip       = STATUS_CFG[app.status] ?? STATUS_CFG.APPLIED;
              const isExpanded = expandedAppId === app.id;
              const sc         = scoreColor(app.resumeScore);

              return (
                <motion.div key={app.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                  style={{ background: 'var(--bg-elevated)', border: `1px solid ${isExpanded ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 18, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.18s ease', boxShadow: isExpanded ? '0 4px 24px rgba(107,138,58,0.12)' : '0 2px 10px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => { if (!isExpanded) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.07)'; } }}
                  onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; } }}
                >
                  {/* Status top stripe */}
                  <div style={{ height: 2.5, background: `linear-gradient(90deg, ${chip.color}00, ${chip.color}88, ${chip.color}00)` }} />

                  {/* Main row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px clamp(12px, 3vw, 22px)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 160 }}>
                      {/* Company logo placeholder */}
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Building2 size={20} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 3 }}>{app.jobTitle}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{app.company}</span>
                          <span>·</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{app.location}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Date */}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                        <Calendar size={12} />{app.appliedDate}
                      </span>

                      {/* Score pill */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 10, background: `${sc}14`, color: sc, border: `1px solid ${sc}28`, letterSpacing: '-0.01em' }}>
                        <Star size={11} />Score: {app.resumeScore}%
                      </div>

                      {/* Status badge */}
                      <StatusBadge status={app.status} />

                      {/* Expand toggle */}
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ color: 'var(--text-muted)' }}>
                        <ChevronRight size={18} />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div style={{ margin: '0 clamp(10px, 3vw, 22px) clamp(10px, 3vw, 22px)', paddingTop: 18, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 24 }}>

                          {/* Left: Job overview + Interview Status */}
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 8 }}>Job Overview</p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 18 }}>{app.jobDescriptionSnippet}</p>

                            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 8 }}>Interview Status</p>
                            <div style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Clock size={14} style={{ color: chip.color }} />{app.interviewStatus}
                            </div>
                          </div>

                          {/* Right: Score breakdown + Timeline */}
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 12 }}>Score Breakdown</p>
                            <SkillBar label="Skills Match" pct={app.scoreBreakdown.skillsMatch} />

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 18 }}>
                              {app.scoreBreakdown.matchedSkills.map(s => (
                                <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: 'rgba(52,211,153,0.10)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(52,211,153,0.22)' }}>✓ {s}</span>
                              ))}
                              {app.scoreBreakdown.missingSkills.map(s => (
                                <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: 'rgba(248,113,113,0.10)', color: '#f87171', fontWeight: 700, border: '1px solid rgba(248,113,113,0.22)' }}>✕ {s}</span>
                              ))}
                            </div>

                            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 14 }}>Application Timeline</p>
                            <TimelineTrack steps={app.timeline} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <motion.button whileTap={{ scale: 0.95 }} disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  style={{ padding: '9px 20px', borderRadius: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.45 : 1 }}
                >← Previous</motion.button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                <motion.button whileTap={{ scale: 0.95 }} disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  style={{ padding: '9px 20px', borderRadius: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.45 : 1 }}
                >Next →</motion.button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @media(max-width:640px){ .apps-grid{grid-template-columns:1fr!important} }
      `}</style>
    </div>
  );
};

export default ApplicationsPage;
