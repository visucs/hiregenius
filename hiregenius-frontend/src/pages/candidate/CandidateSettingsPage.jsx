import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Settings, User, Lock, Bell, Sun, Moon, LogOut, Mail,
  Upload, ShieldCheck, AlertTriangle, Eye, EyeOff,
  FileText, CheckCircle2, Shield, Info, Sparkles,
} from 'lucide-react';
import { logout, selectUser } from '../../features/auth/authSlice';
import useTheme from '../../hooks/useTheme';
import candidatesService from '../../services/candidatesService';
import authService from '../../services/authService';

/* ─── Zod schema for Password Change ──────────────────────── */
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/\d/, 'Must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/* ─── Field wrapper ───────────────────────────────────────── */
const Field = ({ label, error, children, hint }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>
      {label}
    </label>
    {children}
    {hint && !error && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>{hint}</p>}
    {error && (
      <p style={{ fontSize: 11, color: '#f87171', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
        <AlertTriangle size={11} />{error}
      </p>
    )}
  </div>
);

/* ─── Input style ─────────────────────────────────────────── */
const inputStyle = (hasError, isReadOnly = false) => ({
  width: '100%', minHeight: 44, padding: '11px 14px', borderRadius: 12, fontSize: 13,
  background: isReadOnly ? 'rgba(255,255,255,0.03)' : 'var(--card-row-bg)',
  border: `1px solid ${hasError ? 'rgba(248,113,113,0.60)' : 'var(--border)'}`,
  color: isReadOnly ? 'var(--text-muted)' : 'var(--text-primary)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  cursor: isReadOnly ? 'not-allowed' : 'text',
  transition: 'border-color 0.15s',
});

/* ─── Section card ────────────────────────────────────────── */
const Section = ({ icon: Icon, iconColor, title, children, delay = 0, stripe, danger }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: danger ? 'rgba(248,113,113,0.03)' : 'var(--bg-elevated)',
      border: danger ? '1px solid rgba(248,113,113,0.25)' : '1px solid var(--border)',
      borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
    }}
  >
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: '16px clamp(14px, 3vw, 24px) 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: danger ? '#f87171' : 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
        {title}
      </h2>
    </div>
    <div style={{ padding: 'clamp(16px, 3vw, 20px) clamp(14px, 3vw, 24px) 24px' }}>{children}</div>
  </motion.div>
);

/* ─── Toggle Switch ───────────────────────────────────────── */
const Toggle = ({ enabled, onToggle, disabled = false, id }) => (
  <button
    type="button" id={id} disabled={disabled} onClick={onToggle}
    style={{
      width: 46, height: 26, borderRadius: 999,
      background: enabled ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'var(--border)',
      border: 'none', position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, transition: 'background 0.22s', flexShrink: 0,
      boxShadow: enabled ? '0 2px 10px rgba(61,80,22,0.45)' : 'none',
    }}
  >
    <motion.div
      animate={{ left: enabled ? 22 : 3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }}
    />
  </button>
);

/* ─── Password input with show/hide ──────────────────────── */
const PasswordInput = ({ hasError, ...rest }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} {...rest} style={{ ...inputStyle(hasError), paddingRight: 42 }} />
      <button
        type="button" onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   CANDIDATE SETTINGS PAGE
════════════════════════════════════════════════════════════ */
const CandidateSettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { theme, toggleTheme } = useTheme();

  // Candidate resume state
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [loadingCandidate, setLoadingCandidate] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeFileRef = useRef(null);

  // Real Notification Preferences (Core API job_alerts_opt_in)
  const [jobAlertsOptIn, setJobAlertsOptIn] = useState(true);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [togglingPref, setTogglingPref] = useState(false);

  // React Hook Form for Password Change
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  // 1. Fetch real candidate profile (GET /api/candidates/me)
  const fetchCandidateProfile = useCallback(async () => {
    setLoadingCandidate(true);
    try {
      const res = await candidatesService.getMyProfile();
      setCandidateProfile(res?.data ?? null);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.warn('[CandidateSettings] Fetch candidate error:', err?.message);
      }
      setCandidateProfile(null);
    } finally {
      setLoadingCandidate(false);
    }
  }, []);

  // 2. Fetch real candidate notification preferences (GET /api/candidates/me/preferences)
  const fetchPreferences = useCallback(async () => {
    setLoadingPrefs(true);
    try {
      const res = await candidatesService.getPreferences();
      setJobAlertsOptIn(res?.data?.job_alerts_opt_in ?? true);
    } catch (err) {
      console.warn('[CandidateSettings] Fetch preferences error:', err?.message);
    } finally {
      setLoadingPrefs(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidateProfile();
    fetchPreferences();
  }, [fetchCandidateProfile, fetchPreferences]);

  // Handle Resume Upload
  const handleResumeUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx', '.doc'].includes(ext)) {
      toast.error('Only PDF and DOCX files are accepted');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be 5MB or less');
      return;
    }

    const formData = new FormData();
    formData.append('resume', selectedFile);

    setUploadingResume(true);
    try {
      const res = await candidatesService.uploadResume(formData);
      toast.success(res?.message || 'Resume uploaded successfully!');
      fetchCandidateProfile();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload resume';
      toast.error(msg);
    } finally {
      setUploadingResume(false);
      if (resumeFileRef.current) resumeFileRef.current.value = '';
    }
  };

  // Real Change Password Handler (Auth Service: POST /api/auth/change-password)
  const onPasswordSubmit = async (formData) => {
    try {
      const res = await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(res?.data?.message || 'Password updated successfully!');
      reset();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password';
      toast.error(msg);
    }
  };

  // Real Job Alerts Toggle Handler (Core API: PATCH /api/candidates/me/preferences)
  const handleToggleJobAlerts = async () => {
    if (togglingPref) return;
    const nextVal = !jobAlertsOptIn;
    setJobAlertsOptIn(nextVal);
    setTogglingPref(true);

    try {
      await candidatesService.updatePreferences({ job_alerts_opt_in: nextVal });
      toast.success(nextVal ? 'Job alert emails enabled' : 'Job alert emails disabled');
    } catch (err) {
      setJobAlertsOptIn(!nextVal); // Revert on failure
      const msg = err.response?.data?.message || err.message || 'Failed to save preference';
      toast.error(msg);
    } finally {
      setTogglingPref(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out');
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Olive/Forest Hero ─────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) clamp(24px, 4vw, 36px)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '12%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                <Settings size={11} /> Account
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Candidate Settings</h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>Manage your account profile, resume document, security credentials, and preferences.</p>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860, margin: '0 auto' }}>

        {/* A. Profile Details (Read-only from Auth Service) */}
        <Section icon={User} iconColor="#60a5fa" title="Profile Details" delay={0.04} stripe="linear-gradient(90deg, #1e3a5f, #3b82f6)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Avatar Initials Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #18280a, #3D5016)',
                border: '2px solid rgba(107,138,58,0.40)',
                boxShadow: '0 4px 18px rgba(61,80,22,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a3e635', fontSize: 24, fontWeight: 900,
                flexShrink: 0,
              }}>
                {userInitial}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{user?.name || 'Candidate User'}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Candidate Account · Identity managed by Auth Service</p>
              </div>
            </div>

            {/* Name + Email Read-only display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
              <Field label="Full Name" hint="Managed by Auth Service.">
                <input
                  type="text"
                  id="settings-name"
                  readOnly
                  value={user?.name || ''}
                  style={inputStyle(false, true)}
                />
              </Field>

              <Field label="Email Address" hint="Verified primary email managed by Auth Service.">
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    style={{ ...inputStyle(false, true), paddingRight: 90 }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.24)', padding: '3px 8px', borderRadius: 999 }}>
                    <ShieldCheck size={10} /> Verified
                  </span>
                </div>
              </Field>
            </div>
          </div>
        </Section>

        {/* B. Resume on File (Core API Phase 3) */}
        <Section icon={FileText} iconColor="#34d399" title="Resume Document" delay={0.06} stripe="linear-gradient(90deg, #064e3b, #10b981)">
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Your resume is stored securely and attached whenever you apply to job postings. Single active resume per candidate profile.
            </p>

            {loadingCandidate ? (
              <div style={{ height: 64, borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading resume status…</span>
              </div>
            ) : candidateProfile?.resume_path ? (
              <div style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} style={{ color: '#34d399' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{candidateProfile.resume_original_name || 'Resume Document'}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.25)' }}>
                        Active on File
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Uploaded: {candidateProfile.updated_at ? new Date(candidateProfile.updated_at).toLocaleDateString() : 'Active'} · PDF/DOCX
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    ref={resumeFileRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleResumeUpload}
                    style={{ display: 'none' }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => resumeFileRef.current?.click()}
                    disabled={uploadingResume}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '9px 16px', minHeight: 40, borderRadius: 12,
                      background: 'rgba(107,138,58,0.12)', border: '1px solid rgba(107,138,58,0.25)',
                      color: 'var(--primary)', fontSize: 12, fontWeight: 700,
                      cursor: uploadingResume ? 'wait' : 'pointer',
                    }}
                  >
                    <Upload size={13} />
                    {uploadingResume ? 'Uploading…' : 'Replace Resume'}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px 22px', borderRadius: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>No Resume on File</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>You must upload a resume before applying to jobs.</p>
                </div>
                <div>
                  <input
                    ref={resumeFileRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleResumeUpload}
                    style={{ display: 'none' }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => resumeFileRef.current?.click()}
                    disabled={uploadingResume}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '10px 18px', minHeight: 42, borderRadius: 12,
                      background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', border: 'none',
                      color: '#fff', fontSize: 12, fontWeight: 800,
                      cursor: uploadingResume ? 'wait' : 'pointer',
                      boxShadow: '0 4px 16px rgba(61,80,22,0.35)',
                    }}
                  >
                    <Upload size={13} />
                    {uploadingResume ? 'Uploading…' : 'Upload Resume (PDF/DOCX)'}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* C. Password & Security (Auth Service POST /api/auth/change-password) */}
        <Section icon={Lock} iconColor="#a78bfa" title="Password & Security" delay={0.08} stripe="linear-gradient(90deg, #2e1065, #7c3aed)">
          <form onSubmit={handleSubmit(onPasswordSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Current Password" error={errors.currentPassword?.message}>
              <PasswordInput hasError={!!errors.currentPassword} {...register('currentPassword')} id="current-password" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
              <Field label="New Password" error={errors.newPassword?.message}>
                <PasswordInput hasError={!!errors.newPassword} {...register('newPassword')} id="new-password" />
              </Field>
              <Field label="Confirm New Password" error={errors.confirmPassword?.message}>
                <PasswordInput hasError={!!errors.confirmPassword} {...register('confirmPassword')} id="confirm-password" />
              </Field>
            </div>

            {/* Complexity requirement note */}
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.20)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                New password must be at least <strong>8 characters</strong> and contain at least <strong>one number</strong>.
              </p>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                type="submit" disabled={isSubmitting}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 8,
                  padding: '10px 22px', borderRadius: 13, background: 'var(--card-row-bg)',
                  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13,
                  fontWeight: 800, cursor: isSubmitting ? 'wait' : 'pointer', letterSpacing: '-0.01em',
                  transition: 'all 0.18s',
                }}
                id="update-password-btn"
              >
                {isSubmitting ? (
                  <>
                    <div style={{ width: 13, height: 13, border: '2px solid rgba(100,100,100,0.35)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Updating…
                  </>
                ) : (
                  <>
                    <Lock size={13} />Update Password
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </Section>

        {/* D. Notification Preferences (Real Core API GET/PATCH /api/candidates/me/preferences) */}
        <Section icon={Bell} iconColor="#f59e0b" title="Notification Preferences" delay={0.12} stripe="linear-gradient(90deg, #78350f, #f59e0b)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* 1. Real Job Alerts Toggle */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)',
                border: `1px solid ${jobAlertsOptIn ? 'rgba(107,138,58,0.25)' : 'var(--card-row-border)'}`,
                transition: 'all 0.18s ease',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                    Automated Job Alerts
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.25)' }}>
                    Live Core API
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Receive email alerts when recruiters publish new job openings matching the platform.
                </p>
              </div>
              <Toggle
                enabled={jobAlertsOptIn}
                disabled={loadingPrefs || togglingPref}
                onToggle={handleToggleJobAlerts}
                id="toggle-job-alerts"
              />
            </div>

            {/* 2. Mandatory: Application Status Updates */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--card-row-border)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                    Application Status Notifications
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.25)' }}>
                    System Essential · Always On
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Essential transactional notifications when your application is moved to Screening, Interview, Shortlisted, or Hired.
                </p>
              </div>
              <CheckCircle2 size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
            </div>

            {/* 3. Mandatory: Interview Invitations */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--card-row-border)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                    Interview Session Invitations
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.25)' }}>
                    System Essential · Always On
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Critical scheduling confirmations, session links, and calendar reminders for your upcoming interview evaluations.
                </p>
              </div>
              <CheckCircle2 size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
            </div>

            {/* 4. Phase 6 Placeholder: AI Resume Tips */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 16px', borderRadius: 14, background: 'rgba(245,158,11,0.03)',
                border: '1px solid rgba(245,158,11,0.18)', opacity: 0.85,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                    AI Resume Optimization Recommendations
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.10)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.22)' }}>
                    Phase 6 · Coming Soon
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  AI recommendations to improve ATS compatibility and role match scores will be available when Phase 6 AI service launches.
                </p>
              </div>
              <Sparkles size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            </div>

          </div>
        </Section>

        {/* E. Appearance */}
        <Section icon={theme === 'dark' ? Moon : Sun} iconColor="#34d399" title="Appearance Theme" delay={0.16} stripe="linear-gradient(90deg, #052e1a, #34d399)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 'min(100%, 240px)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Current theme: <span style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{theme} mode</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Switch between light and dark UI themes. Your preference is saved automatically.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={toggleTheme}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 8,
                padding: '10px 18px', borderRadius: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
              id="toggle-theme-btn"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </motion.button>
          </div>
        </Section>

        {/* F. Danger Zone (Contact Support instead of fake delete) */}
        <Section icon={AlertTriangle} iconColor="#f87171" title="Account & Danger Zone" delay={0.20} danger>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Sign out */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>Sign Out</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Log out of your current session on this device.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleLogout}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 7, padding: '9px 16px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                id="logout-btn"
              >
                <LogOut size={14} />Log Out
              </motion.button>
            </div>

            {/* Account Deletion Info & Support Mailto */}
            <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 'min(100%, 240px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Info size={14} style={{ color: '#f87171' }} />
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#f87171', margin: 0 }}>Account Deletion Request</p>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  To permanently remove your candidate profile, applications, and stored resume, please contact our support team at <strong style={{ color: 'var(--text-primary)' }}>support@hiregenius.ai</strong>. Requests are verified and processed within 48 hours.
                </p>
              </div>
              <a
                href="mailto:support@hiregenius.ai?subject=Candidate%20Account%20Deletion%20Request"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 42, gap: 7,
                  padding: '9px 18px', borderRadius: 12, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.30)',
                  color: '#f87171', fontSize: 13, fontWeight: 800, textDecoration: 'none', cursor: 'pointer', flexShrink: 0,
                }}
                id="contact-support-delete-btn"
              >
                <Mail size={14} />Contact Support
              </a>
            </div>
          </div>
        </Section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CandidateSettingsPage;
