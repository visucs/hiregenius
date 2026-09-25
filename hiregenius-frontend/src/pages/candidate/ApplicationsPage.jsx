import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, Briefcase, Building2, Calendar, CheckCircle2,
  ChevronRight, ArrowRight, MapPin, AlertCircle, RefreshCw,
  Clock, Shield, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import applicationsService from '../../services/applicationsService';

/* ─── Status configuration ────────────────────────────────── */
const STATUS_CFG = {
  APPLIED:     { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.28)',  color: '#60a5fa', dot: '#60a5fa',  label: 'Applied'     },
  SCREENING:   { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  color: '#f59e0b', dot: '#f59e0b',  label: 'Screening'   },
  INTERVIEW:   { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.28)', color: '#a78bfa', dot: '#a78bfa',  label: 'Interview'   },
  SHORTLISTED: { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',  color: '#34d399', dot: '#34d399',  label: 'Shortlisted' },
  HIRED:       { bg: 'rgba(16,185,129,0.14)',  border: 'rgba(16,185,129,0.35)',  color: '#10b981', dot: '#10b981',  label: 'Hired'       },
  REJECTED:    { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)', color: '#f87171', dot: '#f87171',  label: 'Rejected'    },
};

const STATUS_TABS = ['All', 'Applied', 'Screening', 'Interview', 'Shortlisted', 'Hired', 'Rejected'];

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] ?? STATUS_CFG.APPLIED;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />{c.label}
    </span>
  );
};

/* ─── Timeline visualization ──────────────────────────────── */
const STAGE_ORDER = ['APPLIED', 'SCREENING', 'INTERVIEW', 'DECISION'];

const ApplicationTimeline = ({ currentStatus }) => {
  const norm = (currentStatus || 'APPLIED').toUpperCase();
  const isRejected = norm === 'REJECTED';
  const isHired = norm === 'HIRED';
  const isShortlisted = norm === 'SHORTLISTED';

  const stages = [
    { key: 'APPLIED', label: 'Applied', done: true, current: norm === 'APPLIED' },
    { key: 'SCREENING', label: 'Screening', done: norm !== 'APPLIED', current: norm === 'SCREENING' },
    { key: 'INTERVIEW', label: 'Interview', done: ['INTERVIEW', 'SHORTLISTED', 'HIRED'].includes(norm), current: norm === 'INTERVIEW' },
    {
      key: 'DECISION',
      label: isHired ? 'Hired' : isShortlisted ? 'Shortlisted' : isRejected ? 'Not Selected' : 'Decision',
      done: isHired || isShortlisted || isRejected,
      current: isHired || isShortlisted || isRejected,
      color: isHired || isShortlisted ? '#34d399' : isRejected ? '#f87171' : undefined,
    },
  ];

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 260 }}>
        {stages.map((step, idx) => {
          const isLast = idx === stages.length - 1;
          const dotColor = step.color || (step.current ? '#6B8A3A' : step.done ? '#34d399' : 'var(--border)');
          const lineColor = step.done && !step.current ? '#34d399' : 'var(--border)';

          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? 0 : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: dotColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  boxShadow: step.current ? '0 0 0 3px rgba(107,138,58,0.28)' : 'none',
                  marginBottom: 6,
                }}>
                  {step.done ? '✓' : idx + 1}
                </div>
                <div style={{
                  fontSize: 11,
                  fontWeight: step.current ? 700 : 600,
                  color: step.current ? 'var(--text-primary)' : 'var(--text-muted)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}>
                  {step.label}
                </div>
              </div>
              {!isLast && (
                <div style={{ flex: 1, height: 2, background: lineColor, marginTop: 11, minWidth: 16, transition: 'background 0.3s' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   APPLICATIONS PAGE
════════════════════════════════════════════════════════════ */
const ApplicationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS = 10;

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await applicationsService.getMyApplications();
      setApplications(res?.data ?? []);
    } catch (err) {
      console.error('[ApplicationsPage] Failed to fetch applications:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load your applications';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filtered = useMemo(() => applications.filter(app => {
    const mStatus = selectedStatus === 'All' || (app.status || '').toUpperCase() === selectedStatus.toUpperCase();
    const titleMatch = (app.job_title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const companyMatch = (app.job_company || '').toLowerCase().includes(searchQuery.toLowerCase());
    return mStatus && (titleMatch || companyMatch);
  }), [applications, selectedStatus, searchQuery]);

  const totalPages = Math.ceil(filtered.length / ITEMS) || 1;
  const paginated = useMemo(() => filtered.slice((currentPage - 1) * ITEMS, currentPage * ITEMS), [filtered, currentPage]);
  const setTab = tab => { setSelectedStatus(tab); setCurrentPage(1); };

  /* Counts per status tab */
  const counts = useMemo(() => STATUS_TABS.slice(1).reduce((acc, t) => {
    acc[t] = applications.filter(a => (a.status || '').toUpperCase() === t.toUpperCase()).length;
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Core API Live
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Applications</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>
                  Real-time status tracking for every job you've applied to via HireGenius AI.
                </p>
              </div>

              {/* Quick count badges */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total', value: applications.length, color: '#fff' },
                  { label: 'Active', value: (counts['Applied'] ?? 0) + (counts['Screening'] ?? 0) + (counts['Interview'] ?? 0), color: '#a3e635' },
                  { label: 'Shortlisted', value: (counts['Shortlisted'] ?? 0) + (counts['Hired'] ?? 0), color: '#34d399' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', gap: 7, alignItems: 'center' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status tabs row & Search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', paddingBottom: 28 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {STATUS_TABS.map(tab => {
                  const active = selectedStatus === tab;
                  const count = tab === 'All' ? applications.length : (counts[tab] ?? 0);
                  return (
                    <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setTab(tab)}
                      style={{
                        padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        background: active ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'rgba(255,255,255,0.07)',
                        color: active ? '#fff' : 'rgba(255,255,255,0.50)',
                        boxShadow: active ? '0 3px 12px rgba(61,80,22,0.50)' : 'none',
                      }}
                    >
                      {tab} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
                    </motion.button>
                  );
                })}
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.40)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search by job or company…"
                  value={searchQuery}
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
        {loading && [1, 2, 3].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)', animation: 'shimmer 1.4s infinite' }} />
          </div>
        ))}

        {/* Error state */}
        {!loading && error && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 20 }}
          >
            <AlertCircle size={32} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Failed to load applications</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</p>
            <button onClick={fetchApplications} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 12, background: 'rgba(107,138,58,0.12)', border: '1px solid rgba(107,138,58,0.25)', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <RefreshCw size={13} /> Try Again
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
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
              {searchQuery || selectedStatus !== 'All' ? 'Try adjusting your search or clearing status filters.' : 'Browse open roles and submit your application with a single click.'}
            </p>
            {(searchQuery || selectedStatus !== 'All') ? (
              <button onClick={() => { setSearchQuery(''); setSelectedStatus('All'); }}
                style={{ padding: '10px 20px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >Reset Filters</button>
            ) : (
              <Link to="/candidate/dashboard"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 18px rgba(61,80,22,0.40)' }}
              >
                Browse Open Roles on Dashboard <ArrowRight size={14} />
              </Link>
            )}
          </motion.div>
        )}

        {/* Real Application cards */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {paginated.map((app, i) => {
              const chip = STATUS_CFG[app.status] ?? STATUS_CFG.APPLIED;
              const isExpanded = expandedAppId === app.id;
              const appliedDate = app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

              return (
                <motion.div key={app.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: `1px solid ${isExpanded ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 18, cursor: 'pointer', overflow: 'hidden',
                    transition: 'all 0.18s ease',
                    boxShadow: isExpanded ? '0 4px 24px rgba(107,138,58,0.12)' : '0 2px 10px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={e => { if (!isExpanded) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.07)'; } }}
                  onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; } }}
                >
                  {/* Status top stripe */}
                  <div style={{ height: 2.5, background: `linear-gradient(90deg, ${chip.color}00, ${chip.color}88, ${chip.color}00)` }} />

                  {/* Main row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px clamp(12px, 3vw, 22px)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 160 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Building2 size={20} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 2 }}>{app.job_title}</p>
                          {app.job_status === 'CLOSED' && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                              Listing Closed
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{app.job_company}</span>
                          {app.job_location && (
                            <>
                              <span>·</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{app.job_location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                        <Calendar size={12} />{appliedDate}
                      </span>

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
                        <div style={{ margin: '0 clamp(10px, 3vw, 22px) clamp(10px, 3vw, 22px)', paddingTop: 18, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
                          {/* Left: Application & Job Overview */}
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 8 }}>Application Details</p>
                            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Application ID:</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{app.id}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Job Reference:</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{app.job_id}</span>
                              </div>
                              {app.recruiter_name && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Recruiter:</span>
                                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {app.recruiter_name} {app.recruiter_email ? `(${app.recruiter_email})` : ''}
                                  </span>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                                <span style={{ fontWeight: 700, color: chip.color }}>{chip.label}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Submitted:</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{app.applied_at ? new Date(app.applied_at).toLocaleString() : 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Stage Timeline & Next Steps */}
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 12 }}>Recruiting Pipeline</p>
                            <ApplicationTimeline currentStatus={app.status} />

                            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(107,138,58,0.08)', border: '1px solid rgba(107,138,58,0.20)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                              <Clock size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <span>AI Resume scoring & interview evaluation modules will display scorecards here in Phase 4/5.</span>
                            </div>
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
      `}</style>
    </div>
  );
};

export default ApplicationsPage;
