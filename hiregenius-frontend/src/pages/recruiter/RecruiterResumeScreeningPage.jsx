import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch,
  Briefcase,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Target,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Award,
  Zap,
  Clock,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import jobsService from '../../services/jobsService';
import applicationsService from '../../services/applicationsService';
import AtsScoreCard from '../../components/Resume/AtsScoreCard';
import ParsedResumeCard from '../../components/Resume/ParsedResumeCard';

const RecruiterResumeScreeningPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Cache ATS results per applicationId: { [appId]: { data, loading, error } }
  const [atsCache, setAtsCache] = useState({});
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('ats'); // 'ats' | 'parsed'

  // Filter / Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('ALL'); // 'ALL' | '70' | '50'

  // Load Recruiter's jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const res = await jobsService.getMyJobs({ limit: 50 });
        const list = res?.data?.jobs || (Array.isArray(res?.data) ? res.data : []);
        setJobs(list);
        if (list.length > 0) {
          setSelectedJobId(String(list[0].id));
        }
      } catch (err) {
        console.error('Failed to load recruiter jobs:', err);
        toast.error('Failed to load your job postings.');
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  // Fetch applications whenever selected job changes
  const fetchApplications = useCallback(async (jobId) => {
    if (!jobId) return;
    setLoadingApps(true);
    setExpandedAppId(null);
    try {
      const res = await applicationsService.getJobApplications(jobId);
      const list = res?.data?.applications || (Array.isArray(res?.data) ? res.data : []);
      setApplications(list);
    } catch (err) {
      console.error('Failed to load applications for job:', err);
      toast.error('Could not load applicants for this job.');
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchApplications(selectedJobId);
    }
  }, [selectedJobId, fetchApplications]);

  const selectedJob = useMemo(
    () => jobs.find((j) => String(j.id) === String(selectedJobId)),
    [jobs, selectedJobId]
  );

  // Evaluate or fetch ATS for an applicant
  const handleLoadAts = async (appId) => {
    if (!selectedJobId || !appId) return;

    setAtsCache((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], loading: true, error: null },
    }));

    try {
      const res = await applicationsService.getApplicationAts(selectedJobId, appId);
      setAtsCache((prev) => ({
        ...prev,
        [appId]: { data: res?.data, loading: false, error: null },
      }));
    } catch (err) {
      console.error('ATS evaluation failed for applicant:', err);
      const apiMsg = err.response?.data?.message || 'Failed to analyze candidate resume.';
      setAtsCache((prev) => ({
        ...prev,
        [appId]: { data: null, loading: false, error: apiMsg },
      }));
      toast.error(apiMsg);
    }
  };

  const toggleExpand = (appId) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
    } else {
      setExpandedAppId(appId);
      if (!atsCache[appId]?.data && !atsCache[appId]?.loading) {
        handleLoadAts(appId);
      }
    }
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const name = (app.candidate_name || app.user_name || '').toLowerCase();
      const email = (app.candidate_email || app.user_email || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q);

      const cachedScore = atsCache[app.id]?.data?.overall_score;
      let matchesScore = true;
      if (minScoreFilter === '70') {
        matchesScore = cachedScore >= 70;
      } else if (minScoreFilter === '50') {
        matchesScore = cachedScore >= 50;
      }

      return matchesSearch && matchesScore;
    });
  }, [applications, searchQuery, minScoreFilter, atsCache]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      {/* ── Olive/Forest Hero ─────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
          padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)',
            backgroundSize: '26px 26px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: '15%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: 'rgba(107,138,58,0.95)',
                  background: 'rgba(107,138,58,0.14)',
                  padding: '4px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(107,138,58,0.28)',
                }}
              >
                <FileSearch size={11} /> AI Applicant Screening
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#4ade80',
                  background: 'rgba(74,222,128,0.10)',
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(74,222,128,0.22)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Phase 6 Active
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(22px, 4vw, 30px)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.04em',
                marginBottom: 6,
              }}
            >
              Resume Screening & ATS Ranking
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)', paddingBottom: 28 }}>
              Evaluate applicant resumes against job requirements, inspect keyword coverage, and surface top-matching candidates.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────── */}
      <div
        style={{
          padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {/* Job Selector & Metric Bar */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '18px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 2px 14px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(107,138,58,0.14)',
                border: '1px solid rgba(107,138,58,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Briefcase size={20} style={{ color: 'var(--primary)' }} />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Select Active Job
              </label>
              {loadingJobs ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading your jobs…</div>
              ) : jobs.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No jobs found. Create one first!</div>
              ) : (
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: 380,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.company}) — {j.status}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {selectedJob && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Total Applicants</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {applications.length}
                </span>
              </div>
              <button
                onClick={() => fetchApplications(selectedJobId)}
                disabled={loadingApps}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  background: 'var(--card-row-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '8px 14px',
                  cursor: loadingApps ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={13} className={loadingApps ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        {applications.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search candidates by name/email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 12,
                  padding: '8px 12px 8px 34px',
                  borderRadius: 10,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filter ATS:</span>
              <button
                onClick={() => setMinScoreFilter('ALL')}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1px solid ${minScoreFilter === 'ALL' ? 'var(--primary)' : 'var(--border)'}`,
                  background: minScoreFilter === 'ALL' ? 'rgba(107,138,58,0.14)' : 'var(--bg-elevated)',
                  color: minScoreFilter === 'ALL' ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                All
              </button>
              <button
                onClick={() => setMinScoreFilter('70')}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1px solid ${minScoreFilter === '70' ? '#22c55e' : 'var(--border)'}`,
                  background: minScoreFilter === '70' ? 'rgba(34,197,94,0.14)' : 'var(--bg-elevated)',
                  color: minScoreFilter === '70' ? '#22c55e' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                ≥ 70% Match
              </button>
            </div>
          </div>
        )}

        {/* Applicants List */}
        {loadingApps ? (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Loading applicants…</p>
          </div>
        ) : applications.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px dashed var(--border)',
              borderRadius: 20,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <Users size={32} style={{ color: 'var(--primary)', margin: '0 auto 12px', opacity: 0.8 }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              No Applicants for this Job Yet
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 16px' }}>
              Once candidates submit their resumes for this position, their ATS score and keyword gap analysis will appear here automatically.
            </p>
            <Link
              to="/recruiter/jobs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--primary)',
                textDecoration: 'none',
              }}
            >
              View all posted jobs <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredApps.map((app) => {
              const isExpanded = expandedAppId === app.id;
              const atsState = atsCache[app.id] || {};
              const atsData = atsState.data;
              const score = atsData?.overall_score;

              return (
                <div
                  key={app.id}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Summary Row */}
                  <div
                    onClick={() => toggleExpand(app.id)}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      cursor: 'pointer',
                      background: isExpanded ? 'var(--card-row-bg)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'rgba(107,138,58,0.15)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        {(app.candidate_name || app.user_name || 'C')[0].toUpperCase()}
                      </div>

                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {app.candidate_name || app.user_name || `Applicant #${app.id}`}
                        </h4>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                          {app.candidate_email || app.user_email || 'No email'} • Applied{' '}
                          {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>

                    {/* Right side: ATS Score badge & actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {atsState.loading ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                          <RefreshCw size={12} className="animate-spin" /> Evaluating ATS…
                        </span>
                      ) : score !== undefined ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>
                              ATS Score
                            </span>
                            <span
                              style={{
                                fontSize: 16,
                                fontWeight: 900,
                                color: score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#f87171',
                              }}
                            >
                              {Math.round(score)}%
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: score >= 75 ? 'rgba(34,197,94,0.12)' : score >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(248,113,113,0.12)',
                              color: score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#f87171',
                              border: `1px solid ${score >= 75 ? 'rgba(34,197,94,0.25)' : score >= 50 ? 'rgba(245,158,11,0.25)' : 'rgba(248,113,113,0.25)'}`,
                            }}
                          >
                            {atsData?.match_strength || (score >= 75 ? 'Strong Match' : 'Moderate')}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadAts(app.id);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--primary)',
                            background: 'rgba(107,138,58,0.12)',
                            border: '1px solid rgba(107,138,58,0.25)',
                            borderRadius: 8,
                            padding: '6px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          <Zap size={12} /> Evaluate ATS
                        </button>
                      )}

                      <span style={{ color: 'var(--text-muted)' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          borderTop: '1px solid var(--border)',
                          padding: '20px',
                          background: 'var(--bg-base)',
                        }}
                      >
                        {/* Sub-tabs: ATS Match vs Parsed Resume Profile */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                          <button
                            type="button"
                            onClick={() => setActiveSubTab('ats')}
                            style={{
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: 8,
                              border: `1px solid ${activeSubTab === 'ats' ? 'var(--primary)' : 'var(--border)'}`,
                              background: activeSubTab === 'ats' ? 'rgba(107,138,58,0.14)' : 'var(--bg-elevated)',
                              color: activeSubTab === 'ats' ? 'var(--primary)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            ATS Match Breakdown
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSubTab('parsed')}
                            style={{
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              borderRadius: 8,
                              border: `1px solid ${activeSubTab === 'parsed' ? 'var(--primary)' : 'var(--border)'}`,
                              background: activeSubTab === 'parsed' ? 'rgba(107,138,58,0.14)' : 'var(--bg-elevated)',
                              color: activeSubTab === 'parsed' ? 'var(--primary)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            Parsed Resume Profile
                          </button>
                        </div>

                        {activeSubTab === 'ats' ? (
                          atsState.loading ? (
                            <AtsScoreCard loading={true} />
                          ) : atsData ? (
                            <AtsScoreCard
                              atsData={atsData}
                              onRefresh={() => handleLoadAts(app.id)}
                              title={`${app.candidate_name || 'Candidate'} vs ${selectedJob?.title || 'Job'}`}
                              subtitle="Direct comparison against job description keywords, section completeness, and ATS parsability."
                            />
                          ) : (
                            <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg-elevated)', borderRadius: 14 }}>
                              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                                {atsState.error || 'No ATS evaluation loaded yet.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleLoadAts(app.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#fff',
                                  background: 'var(--primary)',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '8px 16px',
                                  cursor: 'pointer',
                                }}
                              >
                                <Zap size={13} /> Run ATS Evaluation
                              </button>
                            </div>
                          )
                        ) : (
                          <ParsedResumeCard candidateId={app.candidate_id || app.user_id} isRecruiter={true} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterResumeScreeningPage;
