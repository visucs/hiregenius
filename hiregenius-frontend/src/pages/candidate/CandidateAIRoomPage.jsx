import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Shield, AlertTriangle, CheckCircle2, ChevronRight,
  ChevronLeft, Send, Sparkles, AlertCircle, FileText,
  HelpCircle, ArrowLeft, RefreshCw, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import aiInterviewsService from '../../services/aiInterviewsService';

const CandidateAIRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savingStatus, setSavingStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Consent modal state (Addendum 1)
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const timerIntervalRef = useRef(null);

  // Debounced autosave ref
  const autosaveTimeoutRef = useRef(null);

  // Load room details
  const fetchRoom = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await aiInterviewsService.getRoom(id);
      const data = res.data || res;
      setRoomData(data);

      // Hydrate answers map from current answers
      const initialAnswers = {};
      if (Array.isArray(data.questions)) {
        data.questions.forEach((q) => {
          initialAnswers[q.id] = q.currentAnswer || '';
        });
      }
      setAnswers(initialAnswers);

      // Check status
      if (['SUBMITTED', 'EVALUATED'].includes(data.status)) {
        setIsSubmitted(true);
      } else if (data.status === 'PUBLISHED') {
        setShowConsentModal(true);
        setSecondsRemaining(data.durationMinutes * 60);
      } else if (data.status === 'IN_PROGRESS') {
        setShowConsentModal(false);
        setSecondsRemaining(data.remainingSeconds ?? data.durationMinutes * 60);
      }
    } catch (err) {
      console.error('[CandidateAIRoom] Error loading room:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load assessment room.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoom();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [fetchRoom]);

  // Handle server-synchronized timer
  useEffect(() => {
    if (roomData?.status === 'IN_PROGRESS' && !isSubmitted) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerIntervalRef.current);
    }
  }, [roomData?.status, isSubmitted]);

  // Auto-submit when time expires
  const handleAutoSubmit = async () => {
    toast.error('Assessment duration has ended. Submitting your answers automatically...', { duration: 5000 });
    try {
      await aiInterviewsService.submitInterview(id);
      setIsSubmitted(true);
      fetchRoom();
    } catch (err) {
      console.error('[CandidateAIRoom] Auto-submit error:', err);
    }
  };

  // Start interview with explicit consent (Addendum 1)
  const handleStartInterview = async () => {
    if (!consentChecked) {
      toast.error('Please acknowledge the consent checkbox to begin the interview.');
      return;
    }
    setStartingSession(true);
    try {
      const res = await aiInterviewsService.startInterview(id, true);
      const updated = res.data || res;
      setRoomData(updated);
      setShowConsentModal(false);
      setSecondsRemaining(updated.remainingSeconds ?? updated.durationMinutes * 60);
      toast.success('Assessment started. Good luck!');
    } catch (err) {
      console.error('[CandidateAIRoom] Start error:', err);
      toast.error(err.response?.data?.message || 'Failed to start assessment.');
    } finally {
      setStartingSession(false);
    }
  };

  // Autosave handler (debounced by 800ms)
  const handleAnswerChange = (questionId, newText) => {
    if (newText.length > 2000) return; // 2,000 char cap

    setAnswers((prev) => ({ ...prev, [questionId]: newText }));
    setSavingStatus('saving');

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        await aiInterviewsService.autosaveAnswer(id, questionId, newText);
        setSavingStatus('saved');
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('[CandidateAIRoom] Autosave error:', err);
        setSavingStatus('error');
      }
    }, 800);
  };

  // Final submission handler
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      await aiInterviewsService.submitInterview(id);
      setShowSubmitModal(false);
      setIsSubmitted(true);
      toast.success('Your assessment has been successfully submitted!');
      fetchRoom();
    } catch (err) {
      console.error('[CandidateAIRoom] Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Time formatter MM:SS
  const formatTime = (secs) => {
    if (secs === null || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = secondsRemaining !== null && secondsRemaining < 300; // < 5 mins
  const questionsList = roomData?.questions || [];
  const currentQuestion = questionsList[activeQuestionIdx];
  const answeredCount = questionsList.filter((q) => (answers[q.id] || '').trim().length > 0).length;

  // ── Render Loading & Error States ──────────────────────────────────────────
  if (loading && !roomData) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin text-emerald-400 mx-auto mb-3" size={32} />
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Initializing Secure AI Interview Room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 480, background: '#131826', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <AlertCircle className="text-rose-400 mx-auto mb-3" size={40} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>Access Blocked</h2>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>{error}</p>
          <Link
            to="/candidate/interviews"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#1e293b', color: '#f8fafc', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Return to Interviews
          </Link>
        </div>
      </div>
    );
  }

  // ── Render Post-Submission / Results View ──────────────────────────────────
  if (isSubmitted) {
    const evaluation = roomData?.evaluation;
    return (
      <div style={{ minHeight: '100vh', background: '#0a0d14', color: '#f8fafc', padding: 'clamp(24px, 4vw, 48px) 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Assessment Completed!
            </h1>
            <p style={{ fontSize: 15, color: '#94a3b8' }}>
              Your responses for <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{roomData?.jobTitle}</span> have been safely recorded.
            </p>
          </div>

          {/* Feedback Released Scorecard */}
          {evaluation ? (
            <div style={{ background: '#131826', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 'clamp(20px, 3vw, 32px)', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Performance Evaluation Report</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Released by recruiter for your review</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                  {evaluation.recommendation}
                </span>
              </div>

              {/* Advisory Disclaimer Notice */}
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Shield size={20} className="text-amber-400 shrink-0" />
                <p style={{ fontSize: 12, color: '#fef08a', margin: 0, lineHeight: 1.5 }}>
                  <strong>Advisory Notice:</strong> AI assessments are strictly advisory to support evaluation. The hiring team and human recruiter make all final hiring decisions.
                </p>
              </div>

              {/* Numerical Metrics Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#1a2234', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Overall Score</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#38bdf8' }}>{evaluation.overall_score || 0}%</div>
                </div>
                <div style={{ background: '#1a2234', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Technical Substance</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399' }}>{evaluation.technical_score || 0}%</div>
                </div>
                <div style={{ background: '#1a2234', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Communication Clarity</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#a78bfa' }}>{evaluation.communication_score || 0}%</div>
                </div>
                <div style={{ background: '#1a2234', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Indicative Confidence</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24' }}>{evaluation.confidence_score || 0}%</div>
                </div>
              </div>
            </div>
          ) : (
            /* Confidential Review Placeholder */
            <div style={{ background: '#131826', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 'clamp(24px, 4vw, 40px)', textAlign: 'center', marginBottom: 28 }}>
              <Shield size={36} className="text-emerald-400 mx-auto mb-3" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>Under Recruiter Review</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.6 }}>
                Your responses have been successfully locked and forwarded to the hiring team. You will receive an in-app and email notification once feedback is released.
              </p>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/candidate/interviews"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#10b981', color: '#042f2e', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              <ArrowLeft size={16} /> Back to My Interviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Active Assessment Room ──────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <header style={{ background: '#111625', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px clamp(16px, 3vw, 32px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'sticky', top: 0, zIndex: 30 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 4 }}>
              Live Assessment
            </span>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              {roomData?.jobTitle || 'AI Assessment'}
            </h1>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Question {activeQuestionIdx + 1} of {questionsList.length} • {answeredCount} answered
          </div>
        </div>

        {/* Center / Right: Timer & Autosave & Submit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Autosave Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: savingStatus === 'error' ? '#f87171' : '#94a3b8' }}>
            {savingStatus === 'saving' && <RefreshCw size={13} className="animate-spin text-amber-400" />}
            {savingStatus === 'saved' && <Check size={13} className="text-emerald-400" />}
            {savingStatus === 'error' && <AlertCircle size={13} className="text-rose-400" />}
            <span>
              {savingStatus === 'saving' && 'Saving...'}
              {savingStatus === 'saved' && (lastSavedTime ? `Saved ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'All changes saved')}
              {savingStatus === 'error' && 'Failed to save'}
            </span>
          </div>

          {/* Countdown Clock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 8,
            background: isTimeCritical ? 'rgba(239,68,68,0.15)' : '#1a2234',
            border: `1px solid ${isTimeCritical ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: isTimeCritical ? '#f87171' : '#38bdf8',
            fontWeight: 700,
            fontSize: 15,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <Clock size={16} className={isTimeCritical ? 'animate-pulse text-rose-400' : 'text-sky-400'} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          {/* Submit Trigger */}
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#10b981',
              color: '#042f2e',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Send size={14} /> Submit
          </button>
        </div>
      </header>

      {/* ── Language & Fairness Tip Banner (Addendum 3) ───────────────── */}
      <div style={{ background: 'linear-gradient(90deg, rgba(56,189,248,0.08) 0%, rgba(16,185,129,0.08) 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Sparkles size={14} className="text-sky-400 shrink-0" />
        <span style={{ fontSize: 12, color: '#cbd5e1' }}>
          <strong>Tip:</strong> Answers in English or conversational Hinglish are evaluated strictly on substance and clarity. No penalty for language choice (English recommended).
        </span>
      </div>

      {/* ── Main Assessment Body ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Navigation Sidebar */}
        <aside style={{ width: 260, background: '#0e121d', borderRight: '1px solid rgba(255,255,255,0.06)', padding: 16, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: 12 }}>
            Question Navigator
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questionsList.map((q, idx) => {
              const hasAnswer = (answers[q.id] || '').trim().length > 0;
              const isCurrent = idx === activeQuestionIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: isCurrent ? 'rgba(16,185,129,0.12)' : 'transparent',
                    border: `1px solid ${isCurrent ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.04)'}`,
                    color: isCurrent ? '#10b981' : '#cbd5e1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Q{idx + 1}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>({q.type})</span>
                  </div>
                  {hasAnswer ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569' }} />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Active Question Canvas */}
        <main style={{ flex: 1, padding: 'clamp(20px, 3vw, 36px)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {currentQuestion ? (
            <div style={{ maxWidth: 860, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Question Meta Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(56,189,248,0.14)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}>
                  {currentQuestion.type}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                  {currentQuestion.difficulty}
                </span>
              </div>

              {/* Question Text */}
              <div style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', lineHeight: 1.6, marginBottom: 20 }}>
                {currentQuestion.text}
              </div>

              {/* Answer Text Area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer here. Be specific, share practical examples or technical considerations where relevant..."
                  style={{
                    width: '100%',
                    minHeight: 280,
                    flex: 1,
                    background: '#131826',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: 16,
                    color: '#f8fafc',
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    resize: 'none',
                    outline: 'none',
                  }}
                />

                {/* Character Counter Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  <span>Max 2,000 characters</span>
                  <span style={{ color: (answers[currentQuestion.id] || '').length > 1800 ? '#f59e0b' : '#64748b' }}>
                    {(answers[currentQuestion.id] || '').length} / 2,000
                  </span>
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  disabled={activeQuestionIdx === 0}
                  onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#1e293b',
                    color: activeQuestionIdx === 0 ? '#475569' : '#f8fafc',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: activeQuestionIdx === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={16} /> Previous Question
                </button>

                {activeQuestionIdx < questionsList.length - 1 ? (
                  <button
                    onClick={() => setActiveQuestionIdx((prev) => Math.min(questionsList.length - 1, prev + 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#10b981',
                      color: '#042f2e',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Next Question <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#38bdf8',
                      color: '#082f49',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Review & Final Submit <Send size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 60, color: '#64748b' }}>
              No questions found for this assessment.
            </div>
          )}
        </main>
      </div>

      {/* ── Consent Notice Modal (Addendum 1) ────────────────────────── */}
      <AnimatePresence>
        {showConsentModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{ maxWidth: 540, width: '100%', background: '#131826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    AI Interview Assessment Notice
                  </h2>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                    Required acknowledgement before entering
                  </p>
                </div>
              </div>

              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0 }}>
                  Welcome! Before starting your assessment for <strong style={{ color: '#fff' }}>{roomData?.jobTitle}</strong>, please review our assessment transparency guidelines:
                </p>
                <div style={{ background: '#1a2234', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#10b981' }}>•</span>
                    <span><strong>AI Assistance:</strong> Your written responses are evaluated with AI assistance for structure, clarity, and technical relevance.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#10b981' }}>•</span>
                    <span><strong>Recruiter Oversight:</strong> The human recruiter reviews all candidate submissions. The final hiring decision rests solely with the recruiter.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#10b981' }}>•</span>
                    <span><strong>Non-Stop Server Timer:</strong> Once started, your {roomData?.durationMinutes || 30}-minute timer runs on the server and cannot be paused.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#10b981' }}>•</span>
                    <span><strong>Inclusive Language:</strong> You may answer in English or conversational Hinglish; answers are graded on substance only.</span>
                  </div>
                </div>
              </div>

              {/* Checkbox acknowledgement */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, marginBottom: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  style={{ marginTop: 3, accentColor: '#10b981', width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.4 }}>
                  I understand that my answers will be evaluated with AI assistance, that the recruiter will review my submission, and that the recruiter makes the final hiring decision.
                </span>
              </label>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Link
                  to="/candidate/interviews"
                  style={{ padding: '10px 18px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                >
                  Exit
                </Link>
                <button
                  disabled={!consentChecked || startingSession}
                  onClick={handleStartInterview}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 20px',
                    background: consentChecked ? '#10b981' : '#334155',
                    color: consentChecked ? '#042f2e' : '#94a3b8',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: consentChecked && !startingSession ? 'pointer' : 'not-allowed',
                  }}
                >
                  {startingSession ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Start Assessment Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Submit Confirmation Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showSubmitModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 460, width: '100%', background: '#131826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28 }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
                Ready to submit your assessment?
              </h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
                You have completed <strong style={{ color: '#fff' }}>{answeredCount}</strong> of <strong style={{ color: '#fff' }}>{questionsList.length}</strong> questions.
              </p>

              {answeredCount < questionsList.length && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: 12, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span style={{ fontSize: 12, color: '#fca5a5' }}>
                    You still have {questionsList.length - answeredCount} unanswered questions. Unanswered questions will receive zero points.
                  </span>
                </div>
              )}

              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 24 }}>
                Once submitted, answers cannot be modified or retaken.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  style={{ padding: '8px 16px', background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                >
                  Keep Editing
                </button>
                <button
                  disabled={submitting}
                  onClick={handleConfirmSubmit}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#10b981', color: '#042f2e', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Confirm Submission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateAIRoomPage;
