import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Briefcase, Search, Filter, Mail, User, Calendar,
  FileText, CheckCircle2, ChevronDown, ChevronRight, X,
  Clock, AlertCircle, RefreshCw, Eye, ArrowRight, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import jobsService from '../../services/jobsService';
import applicationsService from '../../services/applicationsService';
import candidatesService from '../../services/candidatesService';

/* ─── Status configuration ────────────────────────────────── */
const STATUS_CFG = {
  APPLIED:     { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.28)',  color: '#60a5fa', label: 'Applied'     },
  SCREENING:   { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  color: '#f59e0b', label: 'Screening'   },
  INTERVIEW:   { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.28)', color: '#a78bfa', label: 'Interview'   },
  SHORTLISTED: { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',  color: '#34d399', label: 'Shortlisted' },
  HIRED:       { bg: 'rgba(16,185,129,0.14)',  border: 'rgba(16,185,129,0.35)',  color: '#10b981', label: 'Hired'       },
  REJECTED:    { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)', color: '#f87171', label: 'Rejected'    },
};

const STATUS_OPTIONS = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'HIRED', 'REJECTED'];
const FILTER_TABS = ['All', 'Applied', 'Screening', 'Interview', 'Shortlisted', 'Hired', 'Rejected'];

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] ?? STATUS_CFG.APPLIED;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color }} /> {c.label}
    </span>
  );
};

/* ════════════════════════════════════════════════════════════
   RECRUITER CANDIDATES PAGE — Phase 3 Live Integration
════════════════════════════════════════════════════════════ */
const RecruiterCandidatesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlJobId = searchParams.get('jobId');

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(urlJobId ? Number(urlJobId) : null);

  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [updatingAppId, setUpdatingAppId] = useState(null);

  // Candidate detail drawer/modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingCandidateDetail, setLoadingCandidateDetail] = useState(false);
  const [candidateDetailError, setCandidateDetailError] = useState(null);

  // 1. Fetch Recruiter's Jobs (GET /api/jobs/mine)
  const fetchMyJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await jobsService.getMyJobs({ limit: 100 });
      const jobList = res?.data?.jobs ?? [];
      setJobs(jobList);

      if (jobList.length > 0) {
        // If urlJobId matches one of recruiter's jobs, select it; otherwise default to first job
        if (urlJobId && jobList.some(j => Number(j.id) === Number(urlJobId))) {
          setSelectedJobId(Number(urlJobId));
        } else if (!selectedJobId) {
          setSelectedJobId(Number(jobList[0].id));
        }
      }
    } catch (err) {
      console.error('[RecruiterCandidates] Error fetching recruiter jobs:', err);
      toast.error('Failed to load your jobs');
    } finally {
      setLoadingJobs(false);
    }
  }, [urlJobId, selectedJobId]);

  useEffect(() => {
    fetchMyJobs();
  }, [fetchMyJobs]);

  // 2. Fetch Applications for selected job (GET /api/jobs/:jobId/applications)
  const fetchJobApplications = useCallback(async (jobId) => {
    if (!jobId) {
      setApplications([]);
      return;
    }
    setLoadingApps(true);
    setAppsError(null);
    try {
      const res = await applicationsService.getJobApplications(jobId);
      setApplications(res?.data ?? []);
    } catch (err) {
      console.error('[RecruiterCandidates] Error fetching applications:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load applications';
      setAppsError(msg);
      toast.error(msg);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchJobApplications(selectedJobId);
      // Keep URL search query updated
      setSearchParams({ jobId: selectedJobId }, { replace: true });
    }
  }, [selectedJobId, fetchJobApplications, setSearchParams]);

  // 3. Handle Status Update (PATCH /api/applications/:id/status)
  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingAppId(appId);
    try {
      await applicationsService.updateStatus(appId, newStatus);
      toast.success(`Application updated to ${newStatus}`);
      // Optimistically update in state
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update status';
      toast.error(msg);
    } finally {
      setUpdatingAppId(null);
    }
  };

  // 4. View Candidate Detail (GET /api/candidates/:id)
  const handleViewCandidate = async (candidateId, app) => {
    setSelectedCandidate({
      ...app,
      application_id: app.id,
      candidate_id: app.candidate_id,
      loading: true,
    });
    setLoadingCandidateDetail(true);
    setCandidateDetailError(null);
    try {
      const res = await candidatesService.getCandidateById(candidateId);
      const detail = res?.data || {};
      setSelectedCandidate({
        ...app,
        ...detail,
        application_id: app.id,
        candidate_id: app.candidate_id || detail.id || candidateId,
        loading: false,
      });
    } catch (err) {
      console.error('[RecruiterCandidates] Error fetching candidate profile:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load candidate profile';
      setCandidateDetailError(msg);
      setSelectedCandidate({
        ...app,
        application_id: app.id,
        candidate_id: app.candidate_id,
        loading: false,
      });
      toast.error(msg);
    } finally {
      setLoadingCandidateDetail(false);
    }
  };

  // Filtered applications list
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesFilter = selectedFilter === 'All' || (app.status || '').toUpperCase() === selectedFilter.toUpperCase();
      const name = (app.candidate_name || '').toLowerCase();
      const email = (app.candidate_email || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [applications, selectedFilter, searchQuery]);

  const selectedJob = useMemo(() => {
    return jobs.find(j => Number(j.id) === Number(selectedJobId));
  }, [jobs, selectedJobId]);

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
                <Users size={11} /> Recruiter Portal
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Phase 3 Live
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>
              Candidate Applications
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 24 }}>
              Manage candidates who applied to your posted jobs, update recruitment stages, and inspect profiles.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area ───────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px' }}>

        {/* ── Job Selection Bar ──────────────────────────────── */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 18, padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(107,138,58,0.14)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Briefcase size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>
                Select Active Job
              </label>
              {loadingJobs ? (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading your jobs…</span>
              ) : jobs.length === 0 ? (
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  You have not posted any jobs yet. <Link to="/recruiter/jobs" style={{ color: 'var(--primary)', fontWeight: 700 }}>Post a job first →</Link>
                </span>
              ) : (
                <div style={{ position: 'relative', maxWidth: 420 }}>
                  <select
                    value={selectedJobId || ''}
                    onChange={e => setSelectedJobId(Number(e.target.value))}
                    style={{
                      width: '100%', minHeight: 40, padding: '8px 32px 8px 12px',
                      borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: 'var(--card-row-bg)', border: '1px solid var(--border)',
                      color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
                      appearance: 'none',
                    }}
                  >
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.company}) — #{j.id} [{j.status}]
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>
          </div>

          {selectedJob && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Listing: <strong style={{ color: 'var(--text-primary)' }}>{selectedJob.status}</strong>
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Applicants: <strong style={{ color: 'var(--primary)' }}>{applications.length}</strong>
              </span>
              <button
                onClick={() => fetchJobApplications(selectedJobId)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                title="Refresh applications"
              >
                <RefreshCw size={12} className={loadingApps ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
        </div>

        {/* ── Filters & Search Row ───────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTER_TABS.map(tab => {
              const active = selectedFilter === tab;
              const count = tab === 'All' ? applications.length : applications.filter(a => (a.status || '').toUpperCase() === tab.toUpperCase()).length;

              return (
                <button
                  key={tab}
                  onClick={() => setSelectedFilter(tab)}
                  style={{
                    padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: active ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'var(--bg-elevated)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    boxShadow: active ? '0 3px 12px rgba(61,80,22,0.40)' : 'none',
                  }}
                >
                  {tab} {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by candidate name or email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* ── Applications List ──────────────────────────────── */}
        {loadingApps ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Loading applicants for #{selectedJobId}…</p>
          </div>
        ) : appsError ? (
          <div style={{ padding: 36, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid rgba(239,68,68,0.30)' }}>
            <AlertCircle size={28} color="#ef4444" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{appsError}</p>
            <button onClick={() => fetchJobApplications(selectedJobId)} style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Try Again
            </button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <Users size={32} color="var(--primary)" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {searchQuery || selectedFilter !== 'All' ? 'No candidates match your filter' : 'No applicants for this job yet'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>
              {searchQuery || selectedFilter !== 'All' ? 'Try adjusting your search criteria or resetting status filters.' : 'When candidates discover and apply to this job posting, they will automatically appear in this pipeline.'}
            </p>
            {searchQuery || selectedFilter !== 'All' ? (
              <button onClick={() => { setSearchQuery(''); setSelectedFilter('All'); }} style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Reset Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredApps.map((app, i) => {
              const chip = STATUS_CFG[app.status] ?? STATUS_CFG.APPLIED;
              const isUpdating = updatingAppId === app.id;
              const appliedDate = app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.04 }}
                  style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    flexWrap: 'wrap', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Left: Candidate Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220, flex: 1 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 13,
                      background: 'linear-gradient(135deg, #18280a, #3D5016)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#a3e635', fontSize: 16, fontWeight: 900, flexShrink: 0,
                      border: '1px solid rgba(107,138,58,0.30)',
                    }}>
                      {app.candidate_name ? app.candidate_name.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {app.candidate_name || `Candidate #${app.candidate_id}`}
                        </p>
                        <StatusBadge status={app.status} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-muted)', marginTop: 3, flexWrap: 'wrap' }}>
                        {app.candidate_email && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={11} /> {app.candidate_email}
                          </span>
                        )}
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} /> Applied {appliedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Resume Document on File */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
                    <FileText size={16} style={{ color: app.resume_original_name ? '#34d399' : 'var(--text-muted)' }} />
                    <div style={{ fontSize: 12 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.resume_original_name || 'Resume on File'}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Verified Candidate PDF/DOCX</p>
                    </div>
                  </div>

                  {/* Right: Status Dropdown & View Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Status Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <select
                        value={app.status}
                        disabled={isUpdating}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        style={{
                          minHeight: 36, padding: '6px 28px 6px 12px', borderRadius: 10,
                          fontSize: 12, fontWeight: 700,
                          background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`,
                          outline: 'none', cursor: isUpdating ? 'wait' : 'pointer',
                          appearance: 'none',
                        }}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                            {STATUS_CFG[s]?.label || s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: chip.color }} />
                    </div>

                    {/* View Candidate Button */}
                    <button
                      onClick={() => handleViewCandidate(app.candidate_id, app)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', minHeight: 36, borderRadius: 10,
                        background: 'var(--card-row-bg)', border: '1px solid var(--border)',
                        color: 'var(--text-primary)', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <Eye size={13} /> View Profile
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Candidate Detail Modal ─────────────────────────── */}
      <AnimatePresence>
        {selectedCandidate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              onClick={() => setSelectedCandidate(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px, 3vw, 20px)', pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 540, borderRadius: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 32px 96px rgba(0,0,0,0.30)', pointerEvents: 'auto', overflow: 'hidden' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '24px 24px 0 0' }} />

                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(107,138,58,0.14)', border: '1px solid rgba(107,138,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)' }}>
                        {selectedCandidate.candidate_name || selectedCandidate.name || `Candidate #${selectedCandidate.candidate_id}`}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Verified Applicant Profile</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <X size={15} />
                  </button>
                </div>

                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {loadingCandidateDetail ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading verified profile…
                    </div>
                  ) : (
                    <>
                      {/* Summary tiles */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Current Stage</p>
                          <StatusBadge status={selectedCandidate.status} />
                        </div>
                        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Applied Date</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {selectedCandidate.applied_at ? new Date(selectedCandidate.applied_at).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                        {selectedCandidate.candidate_email && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCandidate.candidate_email}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Candidate ID:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{selectedCandidate.candidate_id}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Application ID:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{selectedCandidate.application_id}</span>
                        </div>
                        {selectedCandidate.job_id && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Job ID:</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{selectedCandidate.job_id}</span>
                          </div>
                        )}
                      </div>

                      {/* Resume Document */}
                      <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileText size={20} style={{ color: '#34d399' }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                              {selectedCandidate.resume_original_name || 'Resume Document'}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Attached via Candidate Profile</p>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '3px 8px', borderRadius: 999 }}>
                          Verified
                        </span>
                      </div>

                      {/* Phase 4/5 roadmap notice */}
                      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(107,138,58,0.08)', border: '1px solid rgba(107,138,58,0.20)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                        <Clock size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span>AI Resume Screening scores and AI Interview transcripts will be displayed here in Phase 4/5.</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ padding: '14px 24px', background: 'var(--card-row-bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setSelectedCandidate(null)} style={{ padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RecruiterCandidatesPage;
