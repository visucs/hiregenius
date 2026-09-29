import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, useInView, animate } from 'framer-motion';
import {
  FileText, MessageSquare, Briefcase, ArrowRight, Sparkles,
  CheckCircle2, Clock, BarChart3, ChevronRight, Target, Zap,
  ArrowUpRight, Upload, Building2, RefreshCw, X, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUser } from '../../features/auth/authSlice';
import useResumeFileValidation from '../../hooks/useResumeFileValidation';
import jobsService from '../../services/jobsService';
import candidatesService from '../../services/candidatesService';
import applicationsService from '../../services/applicationsService';

/* ─── Helpers ─────────────────────────────────────────────── */
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const Counter = ({ to, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [val, setVal] = useState(0);
  const fired = useRef(false);
  useEffect(() => {
    if (inView && !fired.current) {
      fired.current = true;
      animate(0, to, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
    }
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
};

/* Shared card shell */
const Card = ({ children, style = {}, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      overflow: 'hidden', ...style,
    }}
  >
    {children}
  </motion.div>
);

const CardHead = ({ icon: Icon, iconColor = 'var(--primary)', title, subtitle, action, stripe }) => (
  <>
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `${iconColor}15`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
          {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  </>
);

const ViewAll = ({ to, label = 'View all' }) => (
  <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
    {label} <ChevronRight size={13} />
  </Link>
);

const QUICK_ACTIONS = [
  { label: 'Upload Resume',       icon: Upload,        id: 'qa-upload',  color: '#34d399', bg: 'rgba(52,211,153,0.10)', primary: true  },
  { label: 'My Applications',     icon: Briefcase,     to: '/candidate/applications',  color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', primary: false },
  { label: 'Candidate Settings',   icon: Zap,           to: '/candidate/settings',      color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  primary: false },
  { label: 'AI Interviews',       icon: MessageSquare, to: '/candidate/interviews',    color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', primary: false },
];

/* ══════════════════════════════════════════════════════════════
   CANDIDATE DASHBOARD — Real Core API Integration
══════════════════════════════════════════════════════════════ */
const CandidateDashboard = () => {
  const user = useSelector(selectUser);

  // Real backend states
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [loadingProfile, setLoadingProfile]     = useState(true);

  const [applications, setApplications]         = useState([]);
  const [loadingApps, setLoadingApps]           = useState(true);

  const [openJobs, setOpenJobs]                 = useState([]);
  const [loadingJobs, setLoadingJobs]           = useState(true);

  const [applyingJobId, setApplyingJobId]       = useState(null);
  const [uploadingResume, setUploadingResume]   = useState(false);

  // Resume drag & drop hook
  const {
    file, fileInputRef, dragging,
    handleFileChange, handleDrop, handleDragOver, handleDragLeave,
    clearFile,
  } = useResumeFileValidation();

  // 1. Fetch Candidate Profile (GET /api/candidates/me)
  const fetchProfile = useCallback(async () => {
    try {
      const res = await candidatesService.getMyProfile();
      setCandidateProfile(res?.data ?? null);
    } catch (err) {
      // 404 means no resume on file yet — valid initial state
      if (err.response?.status !== 404) {
        console.warn('[CandidateDashboard] Profile fetch warning:', err?.message);
      }
      setCandidateProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // 2. Fetch Candidate Applications (GET /api/applications/mine)
  const fetchApplications = useCallback(async () => {
    try {
      const res = await applicationsService.getMyApplications();
      setApplications(res?.data ?? []);
    } catch (err) {
      console.warn('[CandidateDashboard] Applications fetch warning:', err?.message);
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  // 3. Fetch Public Open Jobs (GET /api/jobs)
  const fetchOpenJobs = useCallback(async () => {
    try {
      const res = await jobsService.getPublicJobs({ status: 'OPEN', limit: 6 });
      setOpenJobs(res?.data?.jobs ?? []);
    } catch (err) {
      console.warn('[CandidateDashboard] Open jobs fetch warning:', err?.message);
      setOpenJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchApplications();
    fetchOpenJobs();
  }, [fetchProfile, fetchApplications, fetchOpenJobs]);

  // Set of job IDs the candidate has already applied to
  const appliedJobIds = useMemo(() => {
    return new Set(applications.map(a => Number(a.job_id)));
  }, [applications]);

  // Handle Apply to a Job
  const handleApplyToJob = async (job) => {
    if (!candidateProfile?.resume_path) {
      toast.error('Please upload your resume below before applying to jobs');
      document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (appliedJobIds.has(Number(job.id))) {
      toast('You have already applied for this job', { icon: 'ℹ️' });
      return;
    }

    setApplyingJobId(job.id);
    try {
      await applicationsService.applyToJob(job.id);
      toast.success(`Successfully applied to ${job.title}!`);
      // Refresh applications list
      fetchApplications();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit application';
      if (err.response?.status === 409) {
        toast.error('You have already applied for this job');
      } else if (err.response?.status === 400 && msg.toLowerCase().includes('resume')) {
        toast.error('Please upload your resume below before applying');
        document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        toast.error(msg);
      }
    } finally {
      setApplyingJobId(null);
    }
  };

  // Handle Resume Upload submission
  const handleUploadResumeSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setUploadingResume(true);
    try {
      const res = await candidatesService.uploadResume(formData);
      toast.success(res?.message || 'Resume uploaded successfully!');
      clearFile();
      fetchProfile();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload resume';
      toast.error(msg);
    } finally {
      setUploadingResume(false);
    }
  };

  // Pipeline stage counts from real applications
  const pipelineCounts = useMemo(() => {
    const counts = { APPLIED: 0, SCREENING: 0, INTERVIEW: 0, SHORTLISTED: 0, HIRED: 0, REJECTED: 0 };
    applications.forEach(app => {
      const s = (app.status || 'APPLIED').toUpperCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [applications]);

  const totalApplications = applications.length;
  const activeApplications = pipelineCounts.APPLIED + pipelineCounts.SCREENING + pipelineCounts.INTERVIEW;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ════════════════════════════════════════════════════
          HERO BAND
      ════════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 50%, #0f1e06 100%)',
        padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 36px) 0',
      }}>
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: -80, right: '20%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header row */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                  <Sparkles size={11} /> Candidate Portal
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Phase 3 Live
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                {greet()}, {user?.name?.split(' ')[0] ?? 'Candidate'}! 🎯
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(190,220,140,0.65)', lineHeight: 1.6 }}>
                Track your job applications, keep your resume updated, and explore active openings.
              </p>
            </div>

            {/* Hero CTA — Upload Resume */}
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
              <button
                onClick={() => document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth' })}
                id="hero-resume-check"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '12px 24px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  boxShadow: '0 6px 28px rgba(61,80,22,0.60)',
                  border: '1px solid rgba(107,138,58,0.35)',
                  cursor: 'pointer', letterSpacing: '-0.01em',
                }}
              >
                <Upload size={16} strokeWidth={2.5} />
                {candidateProfile?.resume_path ? 'Update My Resume' : 'Upload Resume'}
                <ArrowUpRight size={14} />
              </button>
            </motion.div>
          </motion.div>

          {/* Stat cards — Real data on dark band */}
          <div className="cand-dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {/* Card 1: Applications Submitted (REAL) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '18px 18px 0 0', padding: '22px 22px 26px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #60a5fa00, #60a5fa88, #60a5fa00)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(96,165,250,0.18)', border: '1px solid rgba(96,165,250,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} style={{ color: '#60a5fa' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={11} /> Real Data
                </span>
              </div>
              <p style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                {loadingApps ? '...' : <Counter to={totalApplications} />}
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>Applications Submitted</p>
            </motion.div>

            {/* Card 2: Open Jobs Available (REAL) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '18px 18px 0 0', padding: '22px 22px 26px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #34d39900, #34d39988, #34d39900)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={18} style={{ color: '#34d399' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.14)', padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={11} /> Real Data
                </span>
              </div>
              <p style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 6 }}>
                {loadingJobs ? '...' : <Counter to={openJobs.length} />}
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>Open Roles to Apply</p>
            </motion.div>

            {/* Card 3: Resume on File (REAL) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '18px 18px 0 0', padding: '22px 22px 26px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #a78bfa00, #a78bfa88, #a78bfa00)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={18} style={{ color: '#a78bfa' }} />
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700,
                  color: candidateProfile?.resume_path ? '#34d399' : '#fbbf24',
                  background: candidateProfile?.resume_path ? 'rgba(52,211,153,0.14)' : 'rgba(251,191,36,0.14)',
                  padding: '3px 9px', borderRadius: 999,
                  border: `1px solid ${candidateProfile?.resume_path ? 'rgba(52,211,153,0.22)' : 'rgba(251,191,36,0.22)'}`,
                }}>
                  {candidateProfile?.resume_path ? 'Active' : 'Action Required'}
                </span>
              </div>
              <p style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                {loadingProfile ? '...' : candidateProfile?.resume_path ? 'Uploaded' : 'None'}
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>Resume on File</p>
            </motion.div>

            {/* Card 4: AI Interviews (Honest Pending) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '18px 18px 0 0', padding: '22px 22px 26px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #f59e0b00, #f59e0b88, #f59e0b00)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={18} style={{ color: '#f59e0b' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.14)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.22)' }}>
                  <Clock size={10} /> Pending Phase 5
                </span>
              </div>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                —
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(180,215,130,0.60)' }}>AI Interviews (Phase 5)</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          CONTENT AREA
      ════════════════════════════════════════════════════ */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px' }}>

        {/* ── Row A: Resume Status Card + App Tracker + Quick Actions ── */}
        <div className="cand-dash-row-a" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.8fr', gap: 18, marginBottom: 18 }}>

          {/* Resume Profile Status Card */}
          <Card delay={0.08}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #34d399, #059669)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '22px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Resume Document</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Core API Candidate Profile</p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: candidateProfile?.resume_path ? '#34d399' : '#fbbf24',
                  background: candidateProfile?.resume_path ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
                  padding: '3px 10px', borderRadius: 999,
                  border: `1px solid ${candidateProfile?.resume_path ? 'rgba(52,211,153,0.22)' : 'rgba(251,191,36,0.22)'}`,
                }}>
                  {candidateProfile?.resume_path ? 'Ready' : 'Not Uploaded'}
                </span>
              </div>

              {/* Status block */}
              <div style={{ background: 'linear-gradient(135deg, #18280a, #0c1505)', borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: candidateProfile?.resume_path ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: `1px solid ${candidateProfile?.resume_path ? 'rgba(52,211,153,0.30)' : 'rgba(251,191,36,0.30)'}` }}>
                  <FileText size={26} style={{ color: candidateProfile?.resume_path ? '#34d399' : '#fbbf24' }} />
                </div>
                {candidateProfile?.resume_path ? (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4, maxWidth: '100%', wordBreak: 'break-all' }}>
                      {candidateProfile.resume_original_name || 'Resume Document'}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(163,230,53,0.7)', fontWeight: 600 }}>Active resume attached to applications</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>No Resume Uploaded</p>
                    <p style={{ fontSize: 11, color: 'rgba(251,191,36,0.85)', fontWeight: 600 }}>Upload below before applying to jobs</p>
                  </>
                )}
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                <Clock size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: 'var(--primary)' }} />
                <span>AI Resume Scoring & Match reports will activate here in Phase 4.</span>
              </div>

              <button
                onClick={() => document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                {candidateProfile?.resume_path ? 'Replace Resume Below' : 'Upload Resume Below'} <ArrowRight size={13} />
              </button>
            </div>
          </Card>

          {/* Application Pipeline Tracker (Real) */}
          <Card delay={0.13}>
            <CardHead
              icon={Target}
              iconColor="#60a5fa"
              title="Application Tracker"
              subtitle={`${totalApplications} total applications submitted`}
              action={<ViewAll to="/candidate/applications" />}
            />
            <div style={{ padding: '18px 22px 22px' }}>
              {[
                { label: 'Applied',      count: pipelineCounts.APPLIED,      color: '#60a5fa' },
                { label: 'Screening',    count: pipelineCounts.SCREENING,    color: '#f59e0b' },
                { label: 'Interview',    count: pipelineCounts.INTERVIEW,    color: '#a78bfa' },
                { label: 'Shortlisted',  count: pipelineCounts.SHORTLISTED + pipelineCounts.HIRED,  color: '#10b981' },
              ].map((stage, i) => {
                const pct = totalApplications > 0 ? Math.round((stage.count / totalApplications) * 100) : 0;
                return (
                  <div key={stage.label} style={{ marginBottom: i < 3 ? 14 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color, boxShadow: `0 0 0 3px ${stage.color}28`, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{stage.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: stage.color }}>{stage.count}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--card-row-bg)', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'var(--card-row-bg)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Status summary footer */}
              <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(107,138,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={17} style={{ color: 'var(--primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {totalApplications > 0 ? `${activeApplications} Active In-Review` : 'Ready to begin?'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {totalApplications > 0 ? 'Your applications are live with recruiters' : 'Apply to open listings below to start tracking'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card delay={0.18}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '20px 20px 0 0' }} />
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: '#a3e635' }} />
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Quick Actions</p>
            </div>
            <div style={{ padding: '12px 12px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {QUICK_ACTIONS.map(({ label, icon: Icon, to, color, bg, primary }, i) => {
                const actionContent = (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11,
                      padding: primary ? '13px 15px' : '11px 15px', borderRadius: 14,
                      background: primary ? 'linear-gradient(135deg, #2d4010, #4a6b25)' : 'var(--card-row-bg)',
                      border: primary ? '1px solid rgba(107,138,58,0.30)' : '1px solid var(--card-row-border)',
                      boxShadow: primary ? '0 4px 16px rgba(61,80,22,0.30)' : 'none',
                      cursor: 'pointer', transition: 'all 0.16s ease',
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: primary ? 'rgba(163,230,53,0.15)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} style={{ color: primary ? '#a3e635' : color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: primary ? 700 : 600, color: primary ? '#e5f5c8' : 'var(--text-primary)', flex: 1 }}>{label}</span>
                    <ArrowRight size={13} style={{ color: primary ? 'rgba(163,230,53,0.5)' : 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                );

                if (to) {
                  return (
                    <motion.div key={label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, delay: 0.2 + i * 0.04 }}>
                      <Link to={to} style={{ textDecoration: 'none' }}>
                        {actionContent}
                      </Link>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, delay: 0.2 + i * 0.04 }}>
                    <div onClick={() => document.getElementById('resume-upload-panel')?.scrollIntoView({ behavior: 'smooth' })}>
                      {actionContent}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── Row B: Open Jobs to Apply (Real) + Activity Feed (Real) ── */}
        <div className="cand-dash-row-b" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* Open Jobs List (Real Core API) */}
          <Card delay={0.23}>
            <CardHead
              icon={Briefcase}
              iconColor="#34d399"
              title="Open Job Openings"
              subtitle="Browse active listings and apply directly"
              action={<ViewAll to="/candidate/applications" label="My Applications" />}
            />
            <div style={{ padding: '12px 14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingJobs && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading open jobs…
                </div>
              )}

              {!loadingJobs && openJobs.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', background: 'var(--card-row-bg)', borderRadius: 14 }}>
                  <Briefcase size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No open jobs found</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Check back soon as recruiters publish new listings.</p>
                </div>
              )}

              {!loadingJobs && openJobs.map((job, i) => {
                const isApplied = appliedJobIds.has(Number(job.id));
                const isApplyingThis = applyingJobId === job.id;

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                    style={{
                      padding: '16px 18px', borderRadius: 16,
                      background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
                      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #18280a, #2d4010)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3e635', fontSize: 14, fontWeight: 900, flexShrink: 0, border: '1px solid rgba(107,138,58,0.25)' }}>
                      <Building2 size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{job.title}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 7px', borderRadius: 999 }}>Open</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {job.company} {job.location ? `· ${job.location}` : ''}
                      </p>
                      {Array.isArray(job.skills) && job.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {job.skills.slice(0, 3).map(skill => (
                            <span key={skill} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(107,138,58,0.10)', color: 'var(--primary)' }}>
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{job.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isApplied ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.24)' }}>
                          <CheckCircle2 size={13} /> Applied
                        </span>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleApplyToJob(job)}
                          disabled={isApplyingThis}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 16px', minHeight: 36, borderRadius: 10,
                            background: isApplyingThis ? 'rgba(107,138,58,0.30)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                            border: 'none', color: '#fff', fontSize: 12, fontWeight: 800,
                            cursor: isApplyingThis ? 'wait' : 'pointer',
                            boxShadow: isApplyingThis ? 'none' : '0 3px 12px rgba(61,80,22,0.35)',
                          }}
                        >
                          {isApplyingThis ? <RefreshCw size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                          {isApplyingThis ? 'Applying…' : 'Apply Now'}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          {/* Activity Feed (Real) */}
          <Card delay={0.28} style={{ display: 'flex', flexDirection: 'column' }}>
            <CardHead
              icon={BarChart3}
              iconColor="#60a5fa"
              title="Recent Activity"
              subtitle={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '1px 7px', borderRadius: 999 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live Activity
                </span>
              }
              action={<ViewAll to="/candidate/applications" label="History" />}
            />
            <div style={{ flex: 1, padding: '8px 10px 16px', display: 'flex', flexDirection: 'column' }}>
              {applications.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Clock size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>No applications submitted yet</p>
                  <p style={{ fontSize: 11, marginTop: 4 }}>Apply to jobs to see your timeline activity here.</p>
                </div>
              ) : (
                applications.slice(0, 5).map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, delay: 0.25 + i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'default' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <FileText size={14} style={{ color: '#60a5fa' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        Applied: {app.job_title}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {app.job_company} · Status: <strong style={{ color: 'var(--primary)' }}>{app.status}</strong>
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ── Row C: Resume Upload Panel (Core API Phase 3) ─── */}
        <Card delay={0.34} style={{ overflow: 'visible' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635, #6B8A3A)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '22px 28px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Upload size={17} style={{ color: 'var(--primary)' }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {candidateProfile?.resume_path ? 'Update Resume Document' : 'Upload Resume Document'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Core API Candidate Profile · PDF or DOCX format (Max 5MB)
                  </p>
                </div>
              </div>
              {file && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.10)', padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)' }}>
                  <CheckCircle2 size={13} /> {file.name}
                  <button onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(52,211,153,0.7)', display: 'flex', padding: 0 }}>
                    <X size={13} />
                  </button>
                </span>
              )}
            </div>

            {/* Drop zone */}
            <div
              id="resume-upload-panel"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '40px 24px',
                border: `2px dashed ${dragging ? 'var(--primary)' : file ? '#34d399' : 'var(--border)'}`,
                borderRadius: 18, textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(61,80,22,0.06)' : file ? 'rgba(52,211,153,0.04)' : 'var(--card-row-bg)',
                transition: 'all 0.2s ease',
                transform: dragging ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} id="resume-upload-input" />

              <div style={{ width: 56, height: 56, borderRadius: 16, background: file ? 'rgba(52,211,153,0.12)' : 'var(--icon-circle-bg)', border: `1px solid ${file ? 'rgba(52,211,153,0.25)' : 'var(--border-hover)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                {file ? <CheckCircle2 size={26} style={{ color: '#34d399' }} /> : <Upload size={24} style={{ color: 'var(--primary)' }} />}
              </div>

              {file ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#34d399', marginBottom: 4 }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB · Ready to save</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {candidateProfile?.resume_path ? 'Drop a new resume to update your file' : 'Drop your resume here to get started'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>or click to browse — PDF or DOCX accepted (Max 5MB)</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--pill-badge-bg)', padding: '5px 14px', borderRadius: 999, border: '1px solid var(--pill-badge-border)' }}>
                    <Sparkles size={11} /> Core API Phase 3 Storage
                  </span>
                </>
              )}
            </div>

            {file && (
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                onClick={handleUploadResumeSubmit}
                disabled={uploadingResume}
                style={{
                  width: '100%', marginTop: 14, padding: '14px', borderRadius: 14, border: 'none',
                  background: uploadingResume ? 'rgba(61,80,22,0.40)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff', fontSize: 14, fontWeight: 800, cursor: uploadingResume ? 'wait' : 'pointer',
                  boxShadow: uploadingResume ? 'none' : '0 6px 24px rgba(61,80,22,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  letterSpacing: '-0.01em',
                }}
                id="resume-analyse-btn"
              >
                {uploadingResume ? (
                  <><RefreshCw size={16} className="animate-spin" /> Uploading to Core API…</>
                ) : (
                  <><CheckCircle2 size={16} /> Save Resume to Profile <ArrowRight size={15} /></>
                )}
              </motion.button>
            )}
          </div>
        </Card>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .cand-dash-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .cand-dash-row-a {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .cand-dash-row-b {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .cand-dash-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CandidateDashboard;
