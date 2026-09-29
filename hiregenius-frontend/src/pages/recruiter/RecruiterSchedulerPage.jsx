import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Search, Mail, Calendar,
  Clock, Video, ExternalLink, X, PlusCircle, AlertCircle,
  RefreshCw, CheckCircle2, Edit2, Ban,
  Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import interviewsService from '../../services/interviewsService';
import jobsService from '../../services/jobsService';
import applicationsService from '../../services/applicationsService';

/* ─── Status configuration ────────────────────────────────── */
const STATUS_CFG = {
  SCHEDULED: { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.28)', color: '#38bdf8', label: 'Scheduled' },
  COMPLETED: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.28)', color: '#34d399', label: 'Completed' },
  CANCELLED: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)', color: '#f87171', label: 'Cancelled' },
};

const FILTER_TABS = ['All', 'Scheduled', 'Completed', 'Cancelled'];

/* ─── Format date & time helper ────────────────────────────── */
const formatInterviewDateTime = (dateStr) => {
  if (!dateStr) return { date: 'Not set', time: '' };
  const d = new Date(dateStr);
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
  return { date, time, raw: d };
};

/* ─── Minimum datetime helper (now + 5 min in YYYY-MM-DDTHH:mm) ── */
const getMinDateTimeLocal = () => {
  const d = new Date(Date.now() + 5 * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const RecruiterSchedulerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillAppId = searchParams.get('applicationId');

  // Main state
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInterviewForEdit, setSelectedInterviewForEdit] = useState(null);

  // Scheduling Form state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobApplications, setJobApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(prefillAppId || '');
  const [scheduledAtInput, setScheduledAtInput] = useState('');
  const [meetingLinkInput, setMeetingLinkInput] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Edit / Reschedule Form state
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editMeetingLink, setEditMeetingLink] = useState('');
  const [editStatus, setEditStatus] = useState('SCHEDULED');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Copy helper
  const [copiedId, setCopiedId] = useState(null);

  // 1. Fetch Recruiter Interviews (GET /api/interviews/mine)
  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await interviewsService.getMyInterviews({ limit: 100 });
      setInterviews(res?.data?.interviews || []);
    } catch (err) {
      console.error('[RecruiterScheduler] Error fetching interviews:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load interviews';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // 2. Fetch Jobs for Scheduling Modal
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await jobsService.getMyJobs({ limit: 100 });
      setJobs(res?.data?.jobs || []);
    } catch (err) {
      console.error('[RecruiterScheduler] Error loading jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // 3. Fetch applications for selected job in Scheduling Modal
  useEffect(() => {
    if (!selectedJobId) {
      setJobApplications([]);
      return;
    }
    const loadApps = async () => {
      setLoadingApps(true);
      try {
        const res = await applicationsService.getJobApplications(selectedJobId);
        setJobApplications(res?.data || []);
      } catch (err) {
        console.error('[RecruiterScheduler] Error loading job applications:', err);
      } finally {
        setLoadingApps(false);
      }
    };
    loadApps();
  }, [selectedJobId]);

  // Handle URL prefill params (e.g. from Candidates page)
  useEffect(() => {
    if (prefillAppId) {
      setSelectedAppId(prefillAppId);
      setIsScheduleModalOpen(true);
      fetchJobs();
    }
  }, [prefillAppId, fetchJobs]);

  const handleOpenScheduleModal = () => {
    setIsScheduleModalOpen(true);
    fetchJobs();
  };

  // 4. Submit Schedule Interview (POST /api/interviews)
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      toast.error('Please select an application to schedule');
      return;
    }
    if (!scheduledAtInput) {
      toast.error('Please select date and time for the interview');
      return;
    }

    const scheduledDate = new Date(scheduledAtInput);
    if (scheduledDate <= new Date()) {
      toast.error('Interview cannot be scheduled in the past');
      return;
    }

    setSubmittingSchedule(true);
    try {
      await interviewsService.scheduleInterview({
        applicationId: Number(selectedAppId),
        scheduledAt: scheduledDate.toISOString(),
        meetingLink: meetingLinkInput.trim() || undefined,
      });

      toast.success('Interview scheduled successfully!');
      setIsScheduleModalOpen(false);
      // Reset form
      setSelectedAppId('');
      setScheduledAtInput('');
      setMeetingLinkInput('');
      // Clean query params if any
      setSearchParams({}, { replace: true });
      // Refresh list
      fetchInterviews();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;

      if (status === 409) {
        toast.error('An interview has already been scheduled for this application');
      } else if (status === 400) {
        toast.error(msg || 'Interview cannot be scheduled in the past');
      } else if (status === 403) {
        toast.error('Forbidden: You do not own the job for this application');
      } else {
        toast.error(msg || 'Failed to schedule interview');
      }
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // 5. Open Edit/Reschedule Modal
  const handleOpenEditModal = (interview) => {
    setSelectedInterviewForEdit(interview);
    const d = new Date(interview.scheduled_at);
    const pad = (n) => String(n).padStart(2, '0');
    const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditScheduledAt(localStr);
    setEditMeetingLink(interview.meeting_link || '');
    setEditStatus(interview.status || 'SCHEDULED');
    setIsEditModalOpen(true);
  };

  // 6. Submit Edit/Reschedule (PATCH /api/interviews/:id)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInterviewForEdit) return;

    const payload = {};
    if (editScheduledAt) {
      const dateObj = new Date(editScheduledAt);
      if (dateObj <= new Date()) {
        toast.error('Interview cannot be scheduled in the past');
        return;
      }
      payload.scheduledAt = dateObj.toISOString();
    }
    payload.meetingLink = editMeetingLink.trim() || null;
    payload.status = editStatus;

    setSubmittingEdit(true);
    try {
      await interviewsService.updateInterview(selectedInterviewForEdit.id, payload);
      toast.success(
        payload.status === 'CANCELLED'
          ? 'Interview has been cancelled'
          : 'Interview details updated successfully'
      );
      setIsEditModalOpen(false);
      setSelectedInterviewForEdit(null);
      fetchInterviews();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update interview';
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // 7. Quick Cancel action
  const handleQuickCancel = async (interview) => {
    if (!window.confirm(`Are you sure you want to cancel the interview for ${interview.candidate_name || 'this candidate'}?`)) {
      return;
    }
    try {
      await interviewsService.updateInterview(interview.id, { status: 'CANCELLED' });
      toast.success('Interview cancelled');
      fetchInterviews();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel interview';
      toast.error(msg);
    }
  };

  // Copy link
  const handleCopyLink = (link, id) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success('Meeting link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const matchesFilter =
        selectedFilter === 'All' ||
        (item.status || '').toUpperCase() === selectedFilter.toUpperCase();
      const q = searchQuery.toLowerCase();
      const name = (item.candidate_name || '').toLowerCase();
      const email = (item.candidate_email || '').toLowerCase();
      const title = (item.job_title || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || title.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [interviews, selectedFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: interviews.length,
      scheduled: interviews.filter((i) => i.status === 'SCHEDULED').length,
      completed: interviews.filter((i) => i.status === 'COMPLETED').length,
      cancelled: interviews.filter((i) => i.status === 'CANCELLED').length,
    };
  }, [interviews]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      {/* ── Hero band ─────────────────────────────────────── */}
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
            right: '15%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)',
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
                  <CalendarDays size={11} /> Interview Coordination
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

              {/* Schedule Interview CTA */}
              <button
                onClick={handleOpenScheduleModal}
                id="rec-scheduler-open-modal"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 800,
                  border: '1px solid rgba(107,138,58,0.40)',
                  boxShadow: '0 4px 18px rgba(61,80,22,0.5)',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                }}
              >
                <PlusCircle size={15} /> Schedule Interview
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
              Interview Scheduler
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(190,220,140,0.60)',
                paddingBottom: 28,
              }}
            >
              Manage upcoming candidate interviews, calendar links, and scheduling statuses.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Content Area ───────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px' }}>
        {/* ── Metrics Strip ─────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Total Scheduled', value: counts.all, color: '#a3e635', icon: CalendarDays },
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
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: `${stat.color}15`,
                    border: `1px solid ${stat.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={stat.color} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filters & Search Row ───────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTER_TABS.map((tab) => {
              const active = selectedFilter === tab;
              const count =
                tab === 'All'
                  ? counts.all
                  : tab === 'Scheduled'
                  ? counts.scheduled
                  : tab === 'Completed'
                  ? counts.completed
                  : counts.cancelled;

              return (
                <button
                  key={tab}
                  onClick={() => setSelectedFilter(tab)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: active
                      ? 'linear-gradient(135deg, #3D5016, #6B8A3A)'
                      : 'var(--bg-elevated)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    boxShadow: active ? '0 3px 12px rgba(61,80,22,0.40)' : 'none',
                  }}
                >
                  {tab} {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Search Box & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 360 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search candidate or job…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 38,
                  padding: '8px 12px 8px 34px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={fetchInterviews}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 12px',
                minHeight: 38,
                borderRadius: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
              title="Refresh interviews"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Interviews List ────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Loading scheduled interviews…</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid rgba(239,68,68,0.30)' }}>
            <AlertCircle size={28} color="#ef4444" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{error}</p>
            <button onClick={fetchInterviews} style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Try Again
            </button>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <CalendarDays size={36} color="var(--primary)" style={{ margin: '0 auto 14px', opacity: 0.8 }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {searchQuery || selectedFilter !== 'All' ? 'No interviews match your search' : 'No interviews scheduled yet'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6 }}>
              {searchQuery || selectedFilter !== 'All'
                ? 'Try resetting the filters or modifying your search terms.'
                : 'Schedule interviews with applicants to coordinate calendar dates, Google Meet links, and automated candidate reminders.'}
            </p>
            <button
              onClick={handleOpenScheduleModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={15} /> Schedule First Interview
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredInterviews.map((item, i) => {
              const chip = STATUS_CFG[item.status] ?? STATUS_CFG.SCHEDULED;
              const { date, time } = formatInterviewDateTime(item.scheduled_at);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Left: Candidate Info & Job */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 13,
                        background: 'linear-gradient(135deg, #18280a, #3D5016)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a3e635',
                        fontSize: 16,
                        fontWeight: 900,
                        flexShrink: 0,
                        border: '1px solid rgba(107,138,58,0.30)',
                      }}
                    >
                      {item.candidate_name ? item.candidate_name.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {item.candidate_name || `Candidate #${item.candidate_id}`}
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

                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {item.job_title} {item.job_company && `· ${item.job_company}`}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-muted)', marginTop: 4, flexWrap: 'wrap' }}>
                        {item.candidate_email && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={11} /> {item.candidate_email}
                          </span>
                        )}
                        <span>·</span>
                        <span>App #{item.application_id}</span>
                        <span>·</span>
                        <span>Interview #{item.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Scheduled Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'rgba(56,189,248,0.12)',
                        border: '1px solid rgba(56,189,248,0.22)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Calendar size={17} color="#38bdf8" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{date}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{time}</p>
                    </div>
                  </div>

                  {/* Right: Meeting Link & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {item.meeting_link ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <a
                          href={item.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '7px 12px',
                            minHeight: 34,
                            borderRadius: 10,
                            background: 'rgba(56,189,248,0.12)',
                            border: '1px solid rgba(56,189,248,0.30)',
                            color: '#38bdf8',
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <Video size={13} /> Join Meeting <ExternalLink size={11} />
                        </a>
                        <button
                          onClick={() => handleCopyLink(item.meeting_link, item.id)}
                          style={{
                            padding: 7,
                            minHeight: 34,
                            borderRadius: 10,
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
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No meeting link
                      </span>
                    )}

                    {/* Edit / Reschedule Button */}
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '7px 12px',
                        minHeight: 34,
                        borderRadius: 10,
                        background: 'var(--card-row-bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>

                    {/* Quick Cancel if Scheduled */}
                    {item.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleQuickCancel(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '7px 10px',
                          minHeight: 34,
                          borderRadius: 10,
                          background: 'rgba(248,113,113,0.10)',
                          border: '1px solid rgba(248,113,113,0.25)',
                          color: '#f87171',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Cancel this interview"
                      >
                        <Ban size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL 1: Schedule Interview Modal ─────────────── */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                width: '100%',
                maxWidth: 480,
                padding: 24,
                boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                position: 'relative',
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      background: 'rgba(107,138,58,0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                    }}
                  >
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Schedule New Interview
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Select application and pick date & time
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleScheduleSubmit}>
                {/* 1. Job Selection */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    1. Select Job Posting
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => {
                      setSelectedJobId(e.target.value);
                      setSelectedAppId('');
                    }}
                    disabled={loadingJobs}
                    style={{
                      width: '100%',
                      minHeight: 40,
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Choose a Job Posting --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.company}) — #{j.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Application Selection */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    2. Select Candidate Application
                  </label>
                  {selectedJobId ? (
                    loadingApps ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Loading applicants…</div>
                    ) : jobApplications.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#f59e0b', padding: '6px 0' }}>
                        No candidate applications found for this job yet.
                      </div>
                    ) : (
                      <select
                        value={selectedAppId}
                        onChange={(e) => setSelectedAppId(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          minHeight: 40,
                          padding: '8px 12px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 600,
                          background: 'var(--card-row-bg)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                      >
                        <option value="">-- Choose an Applicant --</option>
                        {jobApplications.map((app) => (
                          <option key={app.id} value={app.id}>
                            App #{app.id} — {app.candidate_name || `Candidate #${app.candidate_id}`} [{app.status}]
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        placeholder="Or enter Application ID directly (e.g. 58)"
                        value={selectedAppId}
                        onChange={(e) => setSelectedAppId(e.target.value)}
                        required
                        style={{
                          flex: 1,
                          minHeight: 40,
                          padding: '8px 12px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 600,
                          background: 'var(--card-row-bg)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Date & Time */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    3. Date & Time (Future Only)
                  </label>
                  <input
                    type="datetime-local"
                    min={getMinDateTimeLocal()}
                    value={scheduledAtInput}
                    onChange={(e) => setScheduledAtInput(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      minHeight: 40,
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                    Dates in the past are strictly rejected by the server.
                  </span>
                </div>

                {/* 4. Meeting Link */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    4. Meeting Link (Google Meet / Zoom URL - Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={meetingLinkInput}
                    onChange={(e) => setMeetingLinkInput(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 40,
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Submit button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 10,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingSchedule}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 22px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 800,
                      border: 'none',
                      cursor: submittingSchedule ? 'wait' : 'pointer',
                    }}
                  >
                    {submittingSchedule && <RefreshCw size={13} className="animate-spin" />}
                    Confirm Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: Edit / Reschedule Modal ──────────────── */}
      <AnimatePresence>
        {isEditModalOpen && selectedInterviewForEdit && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                width: '100%',
                maxWidth: 460,
                padding: 24,
                boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      background: 'rgba(56,189,248,0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                    }}
                  >
                    <Edit2 size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Edit Interview #{selectedInterviewForEdit.id}
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {selectedInterviewForEdit.candidate_name || 'Candidate'} · {selectedInterviewForEdit.job_title}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                {/* Reschedule Date/Time */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    min={getMinDateTimeLocal()}
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 40,
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Meeting Link */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={editMeetingLink}
                    onChange={(e) => setEditMeetingLink(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 40,
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Status Selector */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Interview Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 40,
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="SCHEDULED">SCHEDULED (Active slot)</option>
                    <option value="COMPLETED">COMPLETED (Interview finished)</option>
                    <option value="CANCELLED">CANCELLED (Notifies candidate)</option>
                  </select>
                  {editStatus === 'CANCELLED' && (
                    <span style={{ fontSize: 10, color: '#f87171', display: 'block', marginTop: 4 }}>
                      Cancelling will trigger an automatic INTERVIEW_CANCELLED notification to the candidate.
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 10,
                      background: 'var(--card-row-bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingEdit}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 22px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 800,
                      border: 'none',
                      cursor: submittingEdit ? 'wait' : 'pointer',
                    }}
                  >
                    {submittingEdit && <RefreshCw size={13} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterSchedulerPage;
