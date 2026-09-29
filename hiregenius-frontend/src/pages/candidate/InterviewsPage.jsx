import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Calendar, Clock, Video, ExternalLink,
  CheckCircle2, Ban, RefreshCw, AlertCircle, Briefcase,
  Copy, Check, ArrowRight, MessageSquare, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import interviewsService from '../../services/interviewsService';

/* ─── Status configuration ────────────────────────────────── */
const STATUS_CFG = {
  SCHEDULED: { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.28)', color: '#38bdf8', label: 'Scheduled' },
  COMPLETED: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.28)', color: '#34d399', label: 'Completed' },
  CANCELLED: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)', color: '#f87171', label: 'Cancelled' },
};

/* ─── Format date & time helper ────────────────────────────── */
const formatInterviewDateTime = (dateStr) => {
  if (!dateStr) return { date: 'Not set', time: '', isUpcoming: false };
  const d = new Date(dateStr);
  const now = new Date();
  const isUpcoming = d > now;

  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { date, time, isUpcoming, raw: d };
};

const InterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch Candidate Interviews (GET /api/candidates/me/interviews)
  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await interviewsService.getCandidateInterviews();
      // res.data is an array of candidate interviews
      setInterviews(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('[CandidateInterviews] Error fetching interviews:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load interviews';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleCopyLink = (link, id) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success('Meeting link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const counts = useMemo(() => {
    return {
      total: interviews.length,
      scheduled: interviews.filter((i) => i.status === 'SCHEDULED').length,
      completed: interviews.filter((i) => i.status === 'COMPLETED').length,
      cancelled: interviews.filter((i) => i.status === 'CANCELLED').length,
    };
  }, [interviews]);

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
            backgroundImage:
              'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)',
            backgroundSize: '26px 26px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: '12%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  <CalendarDays size={11} /> Interview Portal
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
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#4ade80',
                      display: 'inline-block',
                    }}
                  />{' '}
                  Phase 4 Live
                </span>
              </div>

              <button
                onClick={fetchInterviews}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
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
              My Interviews
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(190,220,140,0.60)',
                paddingBottom: 28,
              }}
            >
              View your scheduled recruitment interviews, join video calls, and track evaluation statuses.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area ───────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px' }}>
        {/* Phase 5 Notice Box */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(107,138,58,0.25)',
            borderRadius: 16,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Scheduled Interviews are Live
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Recruiter interview dates, times, and Google Meet/Zoom links are synchronized in real-time. Automated AI voice evaluator rooms will launch in Phase 5.
              </p>
            </div>
          </div>
          <Link
            to="/candidate/applications"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            My Applications <ArrowRight size={13} />
          </Link>
        </div>

        {/* ── Metrics Strip ─────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Total Scheduled', value: counts.total, color: '#a3e635', icon: CalendarDays },
            { label: 'Upcoming', value: counts.scheduled, color: '#38bdf8', icon: Clock },
            { label: 'Completed', value: counts.completed, color: '#34d399', icon: CheckCircle2 },
            { label: 'Cancelled', value: counts.cancelled, color: '#f87171', icon: Ban },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: `${stat.color}15`,
                    border: `1px solid ${stat.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={17} color={stat.color} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Interviews List ────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Loading your interview schedule…</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid rgba(239,68,68,0.30)' }}>
            <AlertCircle size={28} color="#ef4444" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{error}</p>
            <button onClick={fetchInterviews} style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Try Again
            </button>
          </div>
        ) : interviews.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <CalendarDays size={38} color="var(--primary)" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              No interviews scheduled yet
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>
              When a recruiter reviews your application and schedules an interview slot, the date, time, and meeting link will be visible here.
            </p>
            <Link
              to="/candidate/applications"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <Briefcase size={15} /> View My Applications
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {interviews.map((item, i) => {
              const chip = STATUS_CFG[item.status] ?? STATUS_CFG.SCHEDULED;
              const { date, time, isUpcoming } = formatInterviewDateTime(item.scheduled_at);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Left: Job & Company */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: 1 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #18280a, #3D5016)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a3e635',
                        fontSize: 18,
                        fontWeight: 900,
                        flexShrink: 0,
                        border: '1px solid rgba(107,138,58,0.30)',
                      }}
                    >
                      <Briefcase size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {item.job_title}
                        </p>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 999,
                            background: chip.bg,
                            color: chip.color,
                            border: `1px solid ${chip.border}`,
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: chip.color }} />
                          {chip.label}
                        </span>
                      </div>

                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {item.job_company || 'Hiring Company'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>Application #{item.application_id}</span>
                        <span>·</span>
                        <span>Interview #{item.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Scheduled Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: isUpcoming ? 'rgba(56,189,248,0.14)' : 'var(--card-row-bg)',
                        border: `1px solid ${isUpcoming ? 'rgba(56,189,248,0.30)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Calendar size={18} color={isUpcoming ? '#38bdf8' : 'var(--text-muted)'} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{date}</p>
                        {isUpcoming && item.status === 'SCHEDULED' && (
                          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '1px 5px', borderRadius: 4, background: 'rgba(56,189,248,0.18)', color: '#38bdf8' }}>
                            Upcoming
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{time}</p>
                    </div>
                  </div>

                  {/* Right: Join Video Call or Link status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160, justifyContent: 'flex-end' }}>
                    {item.meeting_link ? (
                      <>
                        <a
                          href={item.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 16px',
                            minHeight: 38,
                            borderRadius: 12,
                            background: item.status === 'CANCELLED'
                              ? 'var(--card-row-bg)'
                              : 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                            color: item.status === 'CANCELLED' ? 'var(--text-muted)' : '#fff',
                            fontSize: 12,
                            fontWeight: 800,
                            textDecoration: 'none',
                            boxShadow: item.status === 'CANCELLED' ? 'none' : '0 4px 14px rgba(14,165,233,0.35)',
                            pointerEvents: item.status === 'CANCELLED' ? 'none' : 'auto',
                            opacity: item.status === 'CANCELLED' ? 0.6 : 1,
                          }}
                        >
                          <Video size={14} /> Join Call <ExternalLink size={12} />
                        </a>
                        <button
                          onClick={() => handleCopyLink(item.meeting_link, item.id)}
                          style={{
                            padding: 8,
                            minHeight: 38,
                            borderRadius: 12,
                            background: 'var(--card-row-bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Copy meeting link"
                        >
                          {copiedId === item.id ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Meeting link pending
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewsPage;
