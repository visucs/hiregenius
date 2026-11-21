import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Plus, RefreshCw, Briefcase, Users, Bot,
  Clock, CheckCircle2, AlertTriangle, AlertCircle,
  Eye, Edit3, Send, Sparkles, Shield, ChevronRight,
  Filter, Check, X, ArrowUpRight, RotateCcw, ThumbsUp, ThumbsDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import jobsService from '../../services/jobsService';
import applicationsService from '../../services/applicationsService';
import aiInterviewsService from '../../services/aiInterviewsService';

const STATUS_PILLS = {
  DRAFT: { label: 'Draft', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  PUBLISHED: { label: 'Published / Open', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  IN_PROGRESS: { label: 'In Progress', color: '#facc15', bg: 'rgba(234,179,8,0.12)' },
  SUBMITTED: { label: 'Submitted', color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  EVALUATED: { label: 'Evaluated', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  EXPIRED: { label: 'Expired', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  CANCELLED: { label: 'Cancelled', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

const RECOMMENDATION_THEMES = {
  SHORTLIST: { label: 'Strong Shortlist', color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.3)' },
  CONSIDER: { label: 'Consider / Review', color: '#fbbf24', bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.3)' },
  REJECT: { label: 'Not Recommended', color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.3)' },
};

const RecruiterAIInterviewPage = () => {
  // Navigation & Filter state
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Generator Modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [genDuration, setGenDuration] = useState(30);
  const [genQuestionCount, setGenQuestionCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);

  // Draft Review & Edit Modal state
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [editableQuestions, setEditableQuestions] = useState([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Publish Dialog state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishDays, setPublishDays] = useState(7);
  const [isPublishing, setIsPublishing] = useState(false);

  // Evaluation Detail Drawer state
  const [showEvalDrawer, setShowEvalDrawer] = useState(false);
  const [isTogglingFeedback, setIsTogglingFeedback] = useState(false);
  const [isRetryingEval, setIsRetryingEval] = useState(false);
  const [isUpdatingAts, setIsUpdatingAts] = useState(false);

  // 1. Fetch Recruiter Jobs
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await jobsService.getRecruiterJobs();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setJobs(list);
      if (list.length > 0 && !selectedJobId) {
        setSelectedJobId(String(list[0].id));
      }
    } catch (err) {
      console.error('[RecruiterAIInterview] Error loading jobs:', err);
      toast.error('Failed to load your posted jobs.');
    } finally {
      setLoadingJobs(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // 2. Fetch AI Interviews for selected Job
  const fetchJobInterviews = useCallback(async () => {
    if (!selectedJobId) return;
    setLoadingInterviews(true);
    try {
      const res = await aiInterviewsService.getJobAiInterviews(selectedJobId);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setInterviews(list);
    } catch (err) {
      console.error('[RecruiterAIInterview] Error loading interviews:', err);
      toast.error('Failed to load AI interviews for this job.');
    } finally {
      setLoadingInterviews(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobInterviews();
  }, [fetchJobInterviews]);

  // 3. Fetch applications when opening New Assessment modal
  const handleOpenGenModal = async () => {
    setShowGenModal(true);
    setSelectedAppId('');
    if (!selectedJobId) return;
    setLoadingApps(true);
    try {
      const res = await applicationsService.getJobApplications(selectedJobId);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      // Filter out rejected or hired if needed, or show all
      setApplications(list);
      if (list.length > 0) {
        setSelectedAppId(String(list[0].id));
      }
    } catch (err) {
      console.error('[RecruiterAIInterview] Error loading applications:', err);
      toast.error('Failed to load candidate applications.');
    } finally {
      setLoadingApps(false);
    }
  };

  // 4. Generate AI Interview
  const handleGenerate = async () => {
    if (!selectedAppId) {
      toast.error('Please select an applicant to assess.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await aiInterviewsService.generateInterview({
        applicationId: Number(selectedAppId),
        durationMinutes: Number(genDuration),
        questionCount: Number(genQuestionCount),
      });
      const data = res.data || res;
      toast.success('Interview questions generated successfully!');
      setShowGenModal(false);
      fetchJobInterviews();

      // Open draft reviewer immediately
      openDraftReview(data.id || data.interview?.id);
    } catch (err) {
      console.error('[RecruiterAIInterview] Generation error:', err);
      toast.error(err.response?.data?.message || 'Failed to generate interview questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Open Draft Reviewer
  const openDraftReview = async (interviewId) => {
    setLoadingDetail(true);
    setShowDraftModal(true);
    try {
      const res = await aiInterviewsService.getInterviewDetail(interviewId);
      const detail = res.data || res;
      setSelectedInterview(detail);
      setEditableQuestions(detail.questions || []);
    } catch (err) {
      console.error('[RecruiterAIInterview] Error fetching draft detail:', err);
      toast.error('Failed to load interview draft.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // 6. Save Draft Question edits
  const handleSaveDraft = async () => {
    if (!selectedInterview) return;
    setIsSavingDraft(true);
    try {
      await aiInterviewsService.updateQuestions(selectedInterview.id, {
        questions: editableQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          difficulty: q.difficulty,
          type: q.type,
        })),
      });
      toast.success('Questions updated successfully.');
      fetchJobInterviews();
    } catch (err) {
      console.error('[RecruiterAIInterview] Update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update questions.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 7. Publish Interview & Send Notification
  const handlePublish = async () => {
    if (!selectedInterview) return;
    setIsPublishing(true);
    try {
      const windowStart = new Date().toISOString();
      const windowEnd = new Date(Date.now() + publishDays * 24 * 60 * 60 * 1000).toISOString();
      await aiInterviewsService.publishInterview(selectedInterview.id, {
        windowStart,
        windowEnd,
        durationMinutes: selectedInterview.duration_minutes || 30,
      });
      toast.success('AI Interview published! Candidate has been notified.');
      setShowPublishModal(false);
      setShowDraftModal(false);
      fetchJobInterviews();
    } catch (err) {
      console.error('[RecruiterAIInterview] Publish error:', err);
      toast.error(err.response?.data?.message || 'Failed to publish interview.');
    } finally {
      setIsPublishing(false);
    }
  };

  // 8. Open Evaluation Scorecard
  const openEvaluationView = async (interviewId) => {
    setLoadingDetail(true);
    setShowEvalDrawer(true);
    try {
      const res = await aiInterviewsService.getInterviewDetail(interviewId);
      const detail = res.data || res;
      setSelectedInterview(detail);
    } catch (err) {
      console.error('[RecruiterAIInterview] Detail error:', err);
      toast.error('Failed to load evaluation report.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // 9. Release Feedback toggle
  const handleToggleFeedback = async () => {
    if (!selectedInterview) return;
    setIsTogglingFeedback(true);
    const newReleased = !selectedInterview.feedback_released;
    try {
      await aiInterviewsService.releaseFeedback(selectedInterview.id, newReleased);
      setSelectedInterview((prev) => ({ ...prev, feedback_released: newReleased ? 1 : 0 }));
      toast.success(`Feedback ${newReleased ? 'released to' : 'hidden from'} candidate.`);
      fetchJobInterviews();
    } catch (err) {
      console.error('[RecruiterAIInterview] Feedback toggle error:', err);
      toast.error('Failed to update feedback visibility.');
    } finally {
      setIsTogglingFeedback(false);
    }
  };

  // 10. Retry AI Evaluation
  const handleRetryEvaluation = async () => {
    if (!selectedInterview) return;
    setIsRetryingEval(true);
    try {
      const res = await aiInterviewsService.retryEvaluation(selectedInterview.id);
      toast.success('Evaluation re-calculated successfully.');
      openEvaluationView(selectedInterview.id);
      fetchJobInterviews();
    } catch (err) {
      console.error('[RecruiterAIInterview] Retry error:', err);
      toast.error(err.response?.data?.message || 'Evaluation retry failed.');
    } finally {
      setIsRetryingEval(false);
    }
  };

  // 11. Quick ATS Status Advance
  const handleAdvanceAts = async (newStatus) => {
    if (!selectedInterview?.application_id) return;
    setIsUpdatingAts(true);
    try {
      await applicationsService.updateStatus(selectedInterview.application_id, newStatus);
      toast.success(`Application updated to ${newStatus}`);
      setSelectedInterview((prev) => ({ ...prev, application_status: newStatus }));
      fetchJobInterviews();
    } catch (err) {
      console.error('[RecruiterAIInterview] ATS update error:', err);
      toast.error('Failed to update application status.');
    } finally {
      setIsUpdatingAts(false);
    }
  };

  // Filtered interviews
  const filteredInterviews = useMemo(() => {
    if (statusFilter === 'ALL') return interviews;
    if (statusFilter === 'ACTIVE') return interviews.filter((i) => ['PUBLISHED', 'IN_PROGRESS'].includes(i.status));
    if (statusFilter === 'COMPLETED') return interviews.filter((i) => ['SUBMITTED', 'EVALUATED'].includes(i.status));
    if (statusFilter === 'DRAFT') return interviews.filter((i) => i.status === 'DRAFT');
    return interviews;
  }, [interviews, statusFilter]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      {/* ── Forest Green Hero Banner ─────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 24px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                  <Bot size={12} /> AI Assessment Engine
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                  Phase 7 Live
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
                AI Interview Hub
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.7)', margin: 0 }}>
                Synthesize role-specific assessment questions, dispatch time-window invitations, and review advisory AI performance scorecards.
              </p>
            </div>

            {/* Top Action: New Assessment Button */}
            <button
              onClick={handleOpenGenModal}
              disabled={!selectedJobId || loadingJobs}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: !selectedJobId ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
            >
              <Plus size={16} /> New AI Assessment
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Workspace Content ───────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 28px) clamp(14px, 3vw, 36px) 60px' }}>
        {/* Job Selector & Controls Toolbar */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Job Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase size={16} className="text-emerald-400 shrink-0" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Job Position:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={loadingJobs}
              style={{
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '8px 14px',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Filter size={14} className="text-muted mr-1" />
            {['ALL', 'ACTIVE', 'COMPLETED', 'DRAFT'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: statusFilter === f ? 800 : 600,
                  background: statusFilter === f ? 'var(--primary)' : 'transparent',
                  color: statusFilter === f ? '#0f1e06' : 'var(--text-muted)',
                  border: statusFilter === f ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}

            <button
              onClick={fetchJobInterviews}
              disabled={loadingInterviews}
              style={{
                marginLeft: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="Refresh interviews list"
            >
              <RefreshCw size={13} className={loadingInterviews ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Assessments List Table */}
        {loadingInterviews ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <RefreshCw size={28} className="animate-spin text-emerald-400 mx-auto mb-3" />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Loading AI assessments for selected job…</p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <Bot size={40} className="text-emerald-400 mx-auto mb-3 opacity-70" />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              No AI Assessments Found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6 }}>
              There are no AI interview sessions created under this position yet. Select an applicant and generate tailored technical questions.
            </p>
            <button
              onClick={handleOpenGenModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Create Assessment
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredInterviews.map((item) => {
              const pill = STATUS_PILLS[item.status] || STATUS_PILLS.DRAFT;
              const isEvaluated = ['SUBMITTED', 'EVALUATED'].includes(item.status);
              const isDraft = item.status === 'DRAFT';
              const recTheme = RECOMMENDATION_THEMES[item.recommendation] || RECOMMENDATION_THEMES.CONSIDER;

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  {/* Left Column: Candidate & Application */}
                  <div style={{ minWidth: 240, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.candidate_name || `Applicant #${item.application_id}`}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: pill.bg, color: pill.color }}>
                        {pill.label}
                      </span>
                      {item.recommendation && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: recTheme.bg, color: recTheme.color, border: `1px solid ${recTheme.border}` }}>
                          {item.recommendation}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {item.candidate_email} • Application Status: <strong style={{ color: 'var(--text-secondary)' }}>{item.application_status}</strong>
                    </div>
                  </div>

                  {/* Middle Column: Window & Specs */}
                  <div style={{ minWidth: 200, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div>⏱️ <strong>{item.duration_minutes || 30} mins</strong> duration</div>
                    <div style={{ marginTop: 2 }}>
                      Window: {item.window_start ? new Date(item.window_start).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Now'} → {item.window_end ? new Date(item.window_end).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '7 days'}
                    </div>
                  </div>

                  {/* Score Pill (if evaluated) */}
                  {item.overall_score !== null && item.overall_score !== undefined && (
                    <div style={{ background: '#1a2234', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(56,189,248,0.25)', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Overall Score</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{item.overall_score}%</div>
                    </div>
                  )}

                  {/* Right Column: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isDraft ? (
                      <button
                        onClick={() => openDraftReview(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={13} /> Review Questions
                      </button>
                    ) : isEvaluated ? (
                      <button
                        onClick={() => openEvaluationView(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          borderRadius: 10,
                          background: '#1e293b',
                          color: '#f8fafc',
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={13} /> View Scorecard
                      </button>
                    ) : (
                      <button
                        onClick={() => openDraftReview(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 10,
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        View Setup
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL 1: Create / Synthesize New Assessment ─────────────── */}
      <AnimatePresence>
        {showGenModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 520, width: '100%', background: '#131826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', margin: 0 }}>Create AI Assessment</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Synthesizes tailored questions from Job + Resume</p>
                  </div>
                </div>
                <button onClick={() => setShowGenModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Applicant Picker */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Select Applicant
                </label>
                {loadingApps ? (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading applicants...</div>
                ) : applications.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#f87171' }}>No candidate applications available on this job.</div>
                ) : (
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#f8fafc', fontSize: 13, outline: 'none' }}
                  >
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.candidate_name || `Applicant #${app.id}`} • Stage: {app.status}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Specs Grid: Duration & Question Count */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Allocated Duration
                  </label>
                  <select
                    value={genDuration}
                    onChange={(e) => setGenDuration(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#f8fafc', fontSize: 13, outline: 'none' }}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes (Recommended)</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Number of Questions
                  </label>
                  <select
                    value={genQuestionCount}
                    onChange={(e) => setGenQuestionCount(Number(e.target.value))}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#f8fafc', fontSize: 13, outline: 'none' }}
                  >
                    <option value={4}>4 Questions (Quick Screen)</option>
                    <option value={6}>6 Questions (Standard)</option>
                    <option value={8}>8 Questions (In-depth)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => setShowGenModal(false)}
                  style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedAppId || isGenerating}
                  onClick={handleGenerate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: !selectedAppId || isGenerating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Generate Questions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: Review & Edit Draft Questions ──────────────────── */}
      <AnimatePresence>
        {showDraftModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 840, width: '100%', maxHeight: '90vh', background: '#131826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0 }}>Review Assessment Questions</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Edit or customize generated questions before publishing to candidate</p>
                </div>
                <button onClick={() => setShowDraftModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Questions List Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {loadingDetail ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading draft details...</div>
                ) : editableQuestions.map((q, idx) => (
                  <div key={q.id || idx} style={{ background: '#1a2234', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>Q{idx + 1}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(56,189,248,0.14)', color: '#38bdf8' }}>
                          {q.type}
                        </span>
                      </div>
                      <select
                        value={q.difficulty || 'MEDIUM'}
                        onChange={(e) => {
                          const updated = [...editableQuestions];
                          updated[idx].difficulty = e.target.value;
                          setEditableQuestions(updated);
                        }}
                        style={{ background: '#131826', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', borderRadius: 6, fontSize: 11, padding: '3px 8px' }}
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>

                    <textarea
                      value={q.text || ''}
                      onChange={(e) => {
                        const updated = [...editableQuestions];
                        updated[idx].text = e.target.value;
                        setEditableQuestions(updated);
                      }}
                      style={{ width: '100%', minHeight: 64, background: '#131826', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, color: '#f8fafc', fontSize: 13, resize: 'vertical', outline: 'none' }}
                    />

                    {/* Expected Rubric Criteria */}
                    {Array.isArray(q.expected_points) && q.expected_points.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                        <span style={{ fontWeight: 700, color: '#64748b' }}>Expected criteria (Advisory Rubric): </span>
                        {q.expected_points.join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, cursor: isSavingDraft ? 'not-allowed' : 'pointer' }}
                >
                  {isSavingDraft ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} Save Draft Changes
                </button>

                <button
                  onClick={() => setShowPublishModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  <Send size={14} /> Publish & Invite Candidate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: Publish & Set Time Window ──────────────────────── */}
      <AnimatePresence>
        {showPublishModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 440, width: '100%', background: '#131826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 24 }}
            >
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
                Publish Assessment Window
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
                Publishing will notify the candidate by in-app alert and email. The candidate can take the assessment within the specified time window.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                  Test Window Validity
                </label>
                <select
                  value={publishDays}
                  onChange={(e) => setPublishDays(Number(e.target.value))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#f8fafc', fontSize: 13, outline: 'none' }}
                >
                  <option value={3}>3 Days from now</option>
                  <option value={7}>7 Days from now (Recommended)</option>
                  <option value={14}>14 Days from now</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setShowPublishModal(false)}
                  style={{ padding: '8px 16px', background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  disabled={isPublishing}
                  onClick={handlePublish}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#10b981', color: '#042f2e', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isPublishing ? 'not-allowed' : 'pointer' }}
                >
                  {isPublishing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Confirm & Notify
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DRAWER / MODAL 4: Evaluation Scorecard & ATS Review ──────── */}
      <AnimatePresence>
        {showEvalDrawer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 880, width: '100%', maxHeight: '90vh', background: '#131826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      AI Assessment Scorecard
                    </h3>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(56,189,248,0.14)', color: '#38bdf8' }}>
                      {selectedInterview?.candidate_name}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                    Application #{selectedInterview?.application_id} • Status: {selectedInterview?.application_status}
                  </p>
                </div>
                <button onClick={() => setShowEvalDrawer(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Scorecard Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* AI Advisory Banner */}
                <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Shield size={20} className="text-amber-400 shrink-0" />
                  <span style={{ fontSize: 12, color: '#fef08a' }}>
                    <strong>AI Advisory Notice:</strong> Metrics and textual signals are strictly advisory. The hiring recruiter makes the final selection decision.
                  </span>
                </div>

                {/* Top Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                  <div style={{ background: '#1a2234', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Overall Score</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8' }}>
                      {selectedInterview?.overall_score || 0}%
                    </div>
                  </div>
                  <div style={{ background: '#1a2234', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Technical Substance</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399' }}>
                      {selectedInterview?.technical_score || 0}%
                    </div>
                  </div>
                  <div style={{ background: '#1a2234', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Communication Clarity</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#a78bfa' }}>
                      {selectedInterview?.communication_score || 0}%
                    </div>
                  </div>
                  <div style={{ background: '#1a2234', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Indicative Confidence</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24' }}>
                      {selectedInterview?.confidence_score || 0}%
                    </div>
                  </div>
                </div>

                {/* Per-Question Transcript & Candidate Answers */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', marginBottom: 12 }}>
                    Candidate Responses & Questions
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Array.isArray(selectedInterview?.questions) && selectedInterview.questions.map((q, idx) => (
                      <div key={q.id || idx} style={{ background: '#1a2234', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>Q{idx + 1}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{q.text}</span>
                        </div>
                        <div style={{ background: '#131826', borderRadius: 8, padding: 12, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, marginTop: 8 }}>
                          <strong style={{ color: '#94a3b8', display: 'block', fontSize: 11, marginBottom: 4 }}>CANDIDATE ANSWER:</strong>
                          {q.answer_text || <span style={{ color: '#64748b', fontStyle: 'italic' }}>No answer provided</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evaluation Retry if Failed */}
                {selectedInterview?.evaluation_status === 'FAILED' && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>AI Evaluation Incomplete</span>
                      <p style={{ fontSize: 11, color: '#fca5a5', margin: 0 }}>Candidate answers are safe. You can retry running AI analysis.</p>
                    </div>
                    <button
                      disabled={isRetryingEval}
                      onClick={handleRetryEvaluation}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <RotateCcw size={13} className={isRetryingEval ? 'animate-spin' : ''} /> Retry Evaluation
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Controls: Release Feedback & ATS Actions */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                {/* Feedback Release Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    disabled={isTogglingFeedback}
                    onClick={handleToggleFeedback}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: selectedInterview?.feedback_released ? 'rgba(16,185,129,0.15)' : '#1e293b',
                      color: selectedInterview?.feedback_released ? '#34d399' : '#94a3b8',
                      border: `1px solid ${selectedInterview?.feedback_released ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {selectedInterview?.feedback_released ? <Check size={14} /> : <Eye size={14} />}
                    {selectedInterview?.feedback_released ? 'Feedback Released to Candidate' : 'Release Feedback to Candidate'}
                  </button>
                </div>

                {/* Quick ATS Status Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    disabled={isUpdatingAts || selectedInterview?.application_status === 'REJECTED'}
                    onClick={() => handleAdvanceAts('REJECTED')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'rgba(239,68,68,0.12)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.25)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: selectedInterview?.application_status === 'REJECTED' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ThumbsDown size={14} /> Mark Rejected
                  </button>
                  <button
                    disabled={isUpdatingAts || selectedInterview?.application_status === 'SHORTLISTED'}
                    onClick={() => handleAdvanceAts('SHORTLISTED')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 18px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: selectedInterview?.application_status === 'SHORTLISTED' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ThumbsUp size={14} /> Advance to Shortlist
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterAIInterviewPage;
