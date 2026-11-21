import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Info,
  AlertCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import jobsService from '../../services/jobsService';
import applicationsService from '../../services/applicationsService';
import rankingsService from '../../services/rankingsService';

/* ─── Score Color & Label Helpers ────────────────────────────────────────── */
const getScoreTheme = (score) => {
  if (score >= 80) {
    return {
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      label: 'Strong Match',
    };
  }
  if (score >= 65) {
    return {
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.3)',
      label: 'Good Match',
    };
  }
  if (score >= 50) {
    return {
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      label: 'Moderate Fit',
    };
  }
  return {
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.3)',
    label: 'Needs Review',
  };
};

const getRankBadge = (rank) => {
  if (rank === 1) {
    return {
      label: '#1',
      bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: '#ffffff',
      shadow: '0 0 14px rgba(245, 158, 11, 0.4)',
    };
  }
  if (rank === 2) {
    return {
      label: '#2',
      bg: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
      color: '#ffffff',
      shadow: '0 0 10px rgba(148, 163, 184, 0.3)',
    };
  }
  if (rank === 3) {
    return {
      label: '#3',
      bg: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
      color: '#ffffff',
      shadow: '0 0 10px rgba(180, 83, 9, 0.3)',
    };
  }
  return {
    label: `#${rank}`,
    bg: 'rgba(255, 255, 255, 0.08)',
    color: '#94a3b8',
    shadow: 'none',
  };
};

const RecruiterCandidateRankingPage = () => {
  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Ranking snapshot state
  const [rankingData, setRankingData] = useState(null);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // ALL | STRONG | GOOD | MODERATE | LOW
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('RANK'); // RANK | SCORE_DESC | EXPERIENCE_DESC

  // UI state
  const [expandedReasoning, setExpandedReasoning] = useState({});
  const [showNotRankable, setShowNotRankable] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState({});

  // ── 1. Fetch Recruiter Jobs on Mount ───────────────────────────────────────
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
        toast.error('Failed to load your job postings');
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // ── 2. Fetch Latest Ranking for Selected Job ──────────────────────────────
  const fetchRanking = useCallback(async (jobId) => {
    if (!jobId) return;
    setLoadingRanking(true);
    setError(null);
    try {
      const res = await rankingsService.getJobRanking(jobId);
      setRankingData(res?.data || null);
    } catch (err) {
      console.error('Failed to load ranking for job:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load candidate ranking';
      setError(msg);
    } finally {
      setLoadingRanking(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchRanking(selectedJobId);
    }
  }, [selectedJobId, fetchRanking]);

  // ── 3. Run / Re-Run Candidate Ranking ────────────────────────────────────
  const handleRunRanking = async () => {
    if (!selectedJobId || isRanking) return;
    setIsRanking(true);
    setError(null);
    try {
      const res = await rankingsService.createJobRanking(selectedJobId);
      setRankingData(res?.data || null);
      toast.success(
        res?.data?.ranking
          ? `Ranking snapshot created: ${res.data.ranking.ranked_count} applicants ranked!`
          : 'Ranking completed successfully!'
      );
    } catch (err) {
      console.error('Failed to run candidate ranking:', err);
      const status = err.response?.status;
      if (status === 429) {
        toast.error('Rate limit reached: maximum 10 rankings per 10 minutes. Please wait.');
      } else if (status === 504) {
        toast.error('Ranking request timed out. AI model may be under heavy load, please retry.');
      } else if (status === 503) {
        toast.error('AI ranking service is temporarily unavailable. Please retry shortly.');
      } else {
        const msg = err.response?.data?.message || err.message || 'Failed to generate ranking';
        toast.error(msg);
        setError(msg);
      }
    } finally {
      setIsRanking(false);
    }
  };

  // ── 4. Candidate Shortlist / Reject Status Flow ───────────────────────────
  const handleUpdateStatus = async (applicationId, candidateId, newStatus) => {
    const targetId = applicationId || candidateId;
    if (!targetId || updatingStatus[targetId]) return;
    setUpdatingStatus((prev) => ({ ...prev, [targetId]: true }));
    try {
      if (applicationId) {
        await applicationsService.updateStatus(applicationId, newStatus);
      }
      toast.success(`Applicant marked as ${newStatus}`);

      // Optimistically update the application_status in local rankingData state for this specific applicant ONLY
      setRankingData((prev) => {
        if (!prev || !prev.ranking) return prev;
        const updateItem = (item) => {
          const matchApp = applicationId && item.application_id && Number(item.application_id) === Number(applicationId);
          const matchCand = candidateId && item.candidate_id && Number(item.candidate_id) === Number(candidateId);
          return (matchApp || matchCand) ? { ...item, application_status: newStatus } : item;
        };

        return {
          ...prev,
          ranking: {
            ...prev.ranking,
            items: (prev.ranking.items || []).map(updateItem),
            rankings: (prev.ranking.rankings || []).map(updateItem),
            not_rankable: (prev.ranking.not_rankable || []).map(updateItem),
          },
        };
      });
    } catch (err) {
      console.error('Failed to update application status:', err);
      toast.error('Failed to update candidate status');
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const toggleReasoning = (candidateId) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  };

  // Ranked candidates list with filters applied
  const filteredRankings = useMemo(() => {
    const list = rankingData?.ranking?.rankings || [];
    return list
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const nameMatch = (item.candidate_name || '').toLowerCase().includes(q);
        const emailMatch = (item.candidate_email || '').toLowerCase().includes(q);
        const skillMatch = (item.matched_skills || []).some((s) => s.toLowerCase().includes(q));
        return nameMatch || emailMatch || skillMatch;
      })
      .filter((item) => {
        if (tierFilter === 'ALL') return true;
        if (tierFilter === 'STRONG') return item.score >= 80;
        if (tierFilter === 'GOOD') return item.score >= 65 && item.score < 80;
        if (tierFilter === 'MODERATE') return item.score >= 50 && item.score < 65;
        if (tierFilter === 'LOW') return item.score < 50;
        return true;
      })
      .filter((item) => {
        if (statusFilter === 'ALL') return true;
        return item.application_status === statusFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'RANK') return (a.rank || 999) - (b.rank || 999);
        if (sortBy === 'SCORE_DESC') return (b.score || 0) - (a.score || 0);
        if (sortBy === 'EXPERIENCE_DESC') return (b.candidate_years || 0) - (a.candidate_years || 0);
        return 0;
      });
  }, [rankingData, searchQuery, tierFilter, statusFilter, sortBy]);

  const notRankableList = rankingData?.ranking?.not_rankable || [];
  const rankingSnapshot = rankingData?.ranking;
  const isStale = Boolean(rankingData?.is_stale);
  const newApplicantsCount = rankingData?.new_applicants_count || 0;
  const semanticUnavailable = Boolean(rankingSnapshot?.semantic_unavailable);

  return (
    <div style={{ background: 'var(--bg-base, #0b0f19)', minHeight: '100vh', color: '#f8fafc', paddingBottom: 80 }}>
      {/* ── Hero & Header Band ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(150deg, #132210 0%, #091206 55%, #0d1a08 100%)',
          padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 24px',
          borderBottom: '1px solid rgba(107, 138, 58, 0.2)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(107, 138, 58, 0.12) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: '12%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#6ee7b7',
                    background: 'rgba(16, 185, 129, 0.16)',
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Trophy size={11} /> Phase 8 • RAG Candidate Ranking
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#fcd34d',
                    background: 'rgba(245, 158, 11, 0.14)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                  }}
                >
                  <Shield size={11} /> Advisory • PII Stripped
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
                Candidate Ranking
              </h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>
                Multi-factor composite stack ranking combining Semantic RAG, ATS Keyword Match, Experience, and Education Fit.
              </p>
            </div>

            {/* Run / Re-rank Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                disabled={!selectedJobId || isRanking || loadingRanking}
                onClick={handleRunRanking}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: isRanking
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isRanking || !selectedJobId ? 'not-allowed' : 'pointer',
                  boxShadow: isRanking ? 'none' : '0 4px 18px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <RefreshCw size={15} className={isRanking ? 'animate-spin' : ''} />
                {isRanking ? 'Analyzing & Ranking...' : rankingSnapshot ? 'Re-run Ranking' : 'Generate Ranking'}
              </button>
            </div>
          </div>

          {/* ── Job Selector Bar ────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: 22,
              padding: '12px 18px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px' }}>
              <Briefcase size={16} color="#10b981" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>Select Target Job:</span>
              <select
                disabled={loadingJobs}
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                style={{
                  flex: 1,
                  maxWidth: 420,
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  padding: '7px 12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} — {job.company || 'TechCorp'} ({job.status || 'OPEN'})
                  </option>
                ))}
              </select>
            </div>

            {/* Snapshot Metadata Timestamp */}
            {rankingSnapshot && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
                <Clock size={13} />
                <span>
                  Snapshot generated:{' '}
                  <strong style={{ color: '#cbd5e1' }}>
                    {new Date(rankingSnapshot.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span>{rankingSnapshot.applicant_count || 0} applicants evaluated</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content Container ────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px clamp(16px, 4vw, 36px) 0' }}>
        {/* ── Notice: Stale Snapshot Banner ─────────────────────────────────── */}
        {isStale && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 20,
              padding: '14px 20px',
              borderRadius: 12,
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                  Ranking Snapshot Is Out of Date
                </div>
                <div style={{ fontSize: 12, color: '#d1d5db', marginTop: 2 }}>
                  {newApplicantsCount > 0 ? (
                    <span>
                      <strong>{newApplicantsCount} new applicant(s)</strong> or updated resumes have arrived since this ranking was generated.
                    </span>
                  ) : (
                    <span>Candidate resumes or applications have been modified since this ranking was snapshot.</span>
                  )}
                </div>
              </div>
            </div>
            <button
              disabled={isRanking}
              onClick={handleRunRanking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: isRanking ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={13} className={isRanking ? 'animate-spin' : ''} />
              Re-rank With Latest Applicants
            </button>
          </motion.div>
        )}

        {/* ── Notice: Semantic Unavailable Fallback ─────────────────────────── */}
        {semanticUnavailable && (
          <div
            style={{
              marginBottom: 20,
              padding: '12px 18px',
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: '#93c5fd',
            }}
          >
            <Info size={16} />
            <span>
              <strong>Fallback Active:</strong> Semantic vector search was temporarily unavailable during generation. Ranking was calculated deterministically from required skills, years of experience, and educational credentials.
            </span>
          </div>
        )}

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: '14px 20px',
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} color="#ef4444" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchRanking(selectedJobId)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fff',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Summary Stat Metrics ──────────────────────────────────────────── */}
        {rankingSnapshot && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginBottom: 24,
            }}
          >
            {/* Total Evaluated */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Total Applicants</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 4 }}>
                {rankingSnapshot.applicant_count || 0}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Submitted for this opening</div>
            </div>

            {/* Top Match Score */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>Top Candidate Score</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                {filteredRankings.length > 0 ? `${Math.round(filteredRankings[0].score)}%` : '—'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {filteredRankings.length > 0 ? filteredRankings[0].candidate_name : 'No ranked applicants'}
              </div>
            </div>

            {/* Successfully Ranked */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Ranked Pool</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 4 }}>
                {rankingSnapshot.ranked_count || 0}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Rankable with structured CVs</div>
            </div>

            {/* Unrankable Count */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Unrankable Applicants</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: notRankableList.length > 0 ? '#f59e0b' : '#64748b', marginTop: 4 }}>
                {rankingSnapshot.unrankable_count || 0}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Missing or unreadable CVs</div>
            </div>
          </div>
        )}

        {/* ── Filters & Search Controls ────────────────────────────────────── */}
        {rankingSnapshot && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates or skills..."
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: '7px 12px 7px 34px',
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Fit Tier:</span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'STRONG', label: 'Strong (≥80%)' },
                { id: 'GOOD', label: 'Good (65-79%)' },
                { id: 'MODERATE', label: 'Moderate (50-64%)' },
                { id: 'LOW', label: 'Low (<50%)' },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setTierFilter(tier.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: tierFilter === tier.id ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                    color: tierFilter === tier.id ? '#fff' : '#94a3b8',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tier.label}
                </button>
              ))}

              <span style={{ opacity: 0.3, margin: '0 4px' }}>|</span>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  color: '#cbd5e1',
                  fontSize: 11,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="RANK">Sort: Rank Position</option>
                <option value="SCORE_DESC">Sort: Score Descending</option>
                <option value="EXPERIENCE_DESC">Sort: Years Experience</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Main Loading State ────────────────────────────────────────────── */}
        {loadingRanking && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 16px', color: '#10b981' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Loading Ranking Snapshot...</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Retrieving applicant evaluations and grounded citations
            </div>
          </div>
        )}

        {/* ── Empty State: No Ranking Snapshot Yet ──────────────────────────── */}
        {!loadingRanking && !rankingSnapshot && (
          <div
            style={{
              padding: '64px 24px',
              textAlign: 'center',
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
            }}
          >
            <Trophy size={42} style={{ margin: '0 auto 16px', color: '#10b981', opacity: 0.8 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              No Candidate Ranking Snapshot Yet
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 520, margin: '0 auto 24px' }}>
              Run the AI ranking engine to generate a multi-factor stack rank of all applicants for this opening, including semantic match, skill coverage, and grounded selection explanations.
            </p>
            <button
              disabled={isRanking}
              onClick={handleRunRanking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: isRanking ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Sparkles size={16} />
              {isRanking ? 'Analyzing Applicants...' : 'Generate Initial Ranking Snapshot'}
            </button>
          </div>
        )}

        {/* ── Ranked Candidates Cards List ──────────────────────────────────── */}
        {!loadingRanking && rankingSnapshot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredRankings.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 12,
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                No ranked candidates match the selected filters.
              </div>
            ) : (
              filteredRankings.map((candidate) => {
                const theme = getScoreTheme(candidate.score);
                const rankBadge = getRankBadge(candidate.rank);
                const isExpanded = Boolean(expandedReasoning[candidate.candidate_id]);
                const comp = candidate.components || {};

                return (
                  <motion.div
                    key={candidate.candidate_id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.025)',
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Header Row: Rank, Candidate Name, Match Score & Action Buttons */}
                    <div
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 14,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      {/* Left: Rank Badge & Candidate Identity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: rankBadge.bg,
                            color: rankBadge.color,
                            boxShadow: rankBadge.shadow,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 900,
                          }}
                        >
                          {rankBadge.label}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                              {candidate.candidate_name || `Candidate #${candidate.candidate_id}`}
                            </span>
                            {/* Application Status Badge */}
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background:
                                  candidate.application_status === 'SHORTLISTED'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : candidate.application_status === 'REJECTED'
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : 'rgba(255, 255, 255, 0.06)',
                                color:
                                  candidate.application_status === 'SHORTLISTED'
                                    ? '#34d399'
                                    : candidate.application_status === 'REJECTED'
                                    ? '#f87171'
                                    : '#94a3b8',
                                border: `1px solid ${
                                  candidate.application_status === 'SHORTLISTED'
                                    ? 'rgba(16, 185, 129, 0.3)'
                                    : candidate.application_status === 'REJECTED'
                                    ? 'rgba(239, 68, 68, 0.3)'
                                    : 'rgba(255, 255, 255, 0.1)'
                                }`,
                              }}
                            >
                              {candidate.application_status || 'APPLIED'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {candidate.candidate_email || 'Verified Candidate'}
                          </div>
                        </div>
                      </div>

                      {/* Right: Score Ring & Quick Shortlist/Reject Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Match Score Display */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: theme.color }}>
                              {Math.round(candidate.score)}%
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: theme.color }}>Match</span>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: theme.color,
                              background: theme.bg,
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: `1px solid ${theme.border}`,
                            }}
                          >
                            {theme.label}
                          </span>
                        </div>

                        {/* Quick Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            disabled={
                              updatingStatus[candidate.application_id] ||
                              candidate.application_status === 'SHORTLISTED'
                            }
                            onClick={() =>
                              handleUpdateStatus(candidate.application_id, candidate.candidate_id, 'SHORTLISTED')
                            }
                            title="Shortlist applicant"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '7px 12px',
                              borderRadius: 8,
                              background:
                                candidate.application_status === 'SHORTLISTED'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : 'rgba(255, 255, 255, 0.06)',
                              color: candidate.application_status === 'SHORTLISTED' ? '#34d399' : '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor:
                                candidate.application_status === 'SHORTLISTED' ? 'default' : 'pointer',
                            }}
                          >
                            <ThumbsUp size={13} />
                            Shortlist
                          </button>

                          <button
                            disabled={
                              updatingStatus[candidate.application_id] ||
                              candidate.application_status === 'REJECTED'
                            }
                            onClick={() =>
                              handleUpdateStatus(candidate.application_id, candidate.candidate_id, 'REJECTED')
                            }
                            title="Reject applicant"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '7px 12px',
                              borderRadius: 8,
                              background:
                                candidate.application_status === 'REJECTED'
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : 'rgba(255, 255, 255, 0.06)',
                              color: candidate.application_status === 'REJECTED' ? '#f87171' : '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor:
                                candidate.application_status === 'REJECTED' ? 'default' : 'pointer',
                            }}
                          >
                            <ThumbsDown size={13} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Multi-Factor Component Score Breakdown */}
                    <div
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(0, 0, 0, 0.15)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: 12,
                        fontSize: 12,
                      }}
                    >
                      {/* 1. Semantic Match */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 4 }}>
                          <span>Semantic Fit (40%)</span>
                          <strong style={{ color: '#fff' }}>{Math.round(comp.semantic_score || 0)}%</strong>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, comp.semantic_score || 0)}%`,
                              height: '100%',
                              background: '#10b981',
                            }}
                          />
                        </div>
                      </div>

                      {/* 2. Skills Coverage */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 4 }}>
                          <span>Skills Match (35%)</span>
                          <strong style={{ color: '#fff' }}>{Math.round(comp.skills_score || 0)}%</strong>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, comp.skills_score || 0)}%`,
                              height: '100%',
                              background: '#06b6d4',
                            }}
                          />
                        </div>
                      </div>

                      {/* 3. Experience Fit */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 4 }}>
                          <span>Experience Fit (15%)</span>
                          <strong style={{ color: '#fff' }}>{Math.round(comp.experience_score || 0)}%</strong>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, comp.experience_score || 0)}%`,
                              height: '100%',
                              background: '#f59e0b',
                            }}
                          />
                        </div>
                      </div>

                      {/* 4. Education Fit */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 4 }}>
                          <span>Education Fit (10%)</span>
                          <strong style={{ color: '#fff' }}>{Math.round(comp.education_score || 0)}%</strong>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, comp.education_score || 0)}%`,
                              height: '100%',
                              background: '#a855f7',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Skills Breakdown Tags: Matched & Missing */}
                    <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                      {/* Matched Skills */}
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                          Matched:
                        </span>
                        {(candidate.matched_skills || []).length === 0 ? (
                          <span style={{ fontSize: 11, color: '#64748b' }}>None directly matched</span>
                        ) : (
                          (candidate.matched_skills || []).map((skill, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                              }}
                            >
                              ✓ {skill}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Missing Skills */}
                      {(candidate.missing_skills || []).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
                            Missing:
                          </span>
                          {(candidate.missing_skills || []).map((skill, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                              }}
                            >
                              ✗ {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Grounded AI Rationale Snippet Accordion */}
                    {candidate.explanation && (
                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255, 255, 255, 0.015)' }}>
                        <button
                          onClick={() => toggleReasoning(candidate.candidate_id)}
                          style={{
                            width: '100%',
                            padding: '10px 20px',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Sparkles size={14} color="#10b981" />
                            <span>
                              {isExpanded ? 'Hide Grounded Selection Rationale' : 'View Grounded Selection Rationale & Chunk Citations'}
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{ padding: '0 20px 16px', overflow: 'hidden' }}
                            >
                              <div
                                style={{
                                  padding: '14px 18px',
                                  borderRadius: 10,
                                  background: 'rgba(15, 23, 42, 0.6)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                }}
                              >
                                {/* Executive Summary */}
                                <div style={{ fontSize: 13, color: '#f1f5f9', lineHeight: 1.5, marginBottom: 12 }}>
                                  "{candidate.explanation.summary}"
                                </div>

                                {/* Strengths */}
                                {(candidate.explanation.strengths || []).length > 0 && (
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: 4 }}>
                                      Demonstrated Strengths:
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                                      {candidate.explanation.strengths.map((str, idx) => (
                                        <li key={idx}>{str}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Development Gaps */}
                                {(candidate.explanation.gaps || []).length > 0 && (
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: 4 }}>
                                      Considerations & Gaps:
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                                      {candidate.explanation.gaps.map((gap, idx) => (
                                        <li key={idx}>{gap}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Grounded Evidence Chunk Citations */}
                                {(candidate.explanation.chunk_citations || []).length > 0 && (
                                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                                      Grounded Citations:
                                    </span>
                                    {candidate.explanation.chunk_citations.map((cite, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          fontSize: 10,
                                          fontFamily: 'monospace',
                                          padding: '1px 6px',
                                          borderRadius: 4,
                                          background: 'rgba(255, 255, 255, 0.06)',
                                          color: '#94a3b8',
                                        }}
                                      >
                                        [{cite}]
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ── Unrankable Applicants Section ─────────────────────────────────── */}
        {notRankableList.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div
              onClick={() => setShowNotRankable((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={16} color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                  Not Rankable Applicants ({notRankableList.length})
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  — Candidates whose resumes were missing, scanned, or unparsable
                </span>
              </div>
              {showNotRankable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            <AnimatePresence>
              {showNotRankable && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}
                >
                  {notRankableList.map((item) => (
                    <div
                      key={item.candidate_id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'rgba(245, 158, 11, 0.04)',
                        border: '1px solid rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <User size={15} color="#94a3b8" />
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                            {item.candidate_name || `Applicant #${item.candidate_id}`}
                          </span>
                          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                            {item.candidate_email}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                          }}
                        >
                          Reason: {item.reason || 'Missing or unreadable CV'}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#94a3b8',
                          }}
                        >
                          Status: {item.application_status || 'APPLIED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Footer Disclaimer: Honesty & Fairness Protocol ───────────────── */}
        <div
          style={{
            marginTop: 40,
            padding: '14px 20px',
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Shield size={20} color="#10b981" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            <strong style={{ color: '#cbd5e1' }}>AI-Assisted Advisory Ranking Disclaimer:</strong> Component weights (Semantic 40%, Skills 35%, Experience 15%, Education 10%) are uncalibrated configuration defaults. This ranking is strictly advisory to assist human recruiters in triaging review pools and <strong>never automates rejection or hiring decisions</strong>. Personal demographics (names, emails, gender, age, nationality) and institutional prestige are sanitized prior to embedding.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterCandidateRankingPage;
