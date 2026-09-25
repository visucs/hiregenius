import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Settings, User, Lock, Bell, Sun, Moon, LogOut, Trash2,
  Upload, ShieldCheck, AlertTriangle, Eye, EyeOff, Check,
  FileText, CheckCircle2,
} from 'lucide-react';
import { logout, selectUser } from '../../features/auth/authSlice';
import useTheme from '../../hooks/useTheme';
import candidatesService from '../../services/candidatesService';
import useResumeFileValidation from '../../hooks/useResumeFileValidation';

/* ─── Zod schema ──────────────────────────────────────────── */
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/\d/, 'Must contain a number'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

/* ─── Field wrapper ───────────────────────────────────────── */
const Field = ({ label, error, children, hint }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>{label}</label>
    {children}
    {hint  && !error && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>{hint}</p>}
    {error && <p style={{ fontSize: 11, color: '#f87171', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} />{error}</p>}
  </div>
);

/* ─── Input style ─────────────────────────────────────────── */
const inputStyle = (hasError) => ({
  width: '100%', minHeight: 44, padding: '11px 14px', borderRadius: 12, fontSize: 13,
  background: 'var(--card-row-bg)', border: `1px solid ${hasError ? 'rgba(248,113,113,0.60)' : 'var(--border)'}`,
  color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
});

/* ─── Section card ────────────────────────────────────────── */
const Section = ({ icon: Icon, iconColor, title, children, delay = 0, stripe, danger }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{ background: danger ? 'rgba(248,113,113,0.03)' : 'var(--bg-elevated)', border: danger ? '1px solid rgba(248,113,113,0.25)' : '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
  >
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: '16px clamp(14px, 3vw, 24px) 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: danger ? '#f87171' : 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
    </div>
    <div style={{ padding: 'clamp(16px, 3vw, 20px) clamp(14px, 3vw, 24px) 24px' }}>{children}</div>
  </motion.div>
);

/* ─── Toggle Switch ───────────────────────────────────────── */
const Toggle = ({ enabled, onToggle }) => (
  <button type="button" onClick={onToggle}
    style={{ width: 46, height: 26, borderRadius: 999, background: enabled ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'var(--border)', border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.22s', flexShrink: 0, boxShadow: enabled ? '0 2px 10px rgba(61,80,22,0.45)' : 'none' }}
  >
    <motion.div animate={{ left: enabled ? 22 : 3 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
    />
  </button>
);

/* ─── Password input with show/hide ──────────────────────── */
const PasswordInput = ({ hasError, ...rest }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} {...rest} style={{ ...inputStyle(hasError), paddingRight: 42 }} />
      <button type="button" onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   CANDIDATE SETTINGS PAGE
════════════════════════════════════════════════════════════ */
const CandidateSettingsPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector(selectUser);
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [loadingCandidate, setLoadingCandidate] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeFileRef = useRef(null);

  const [savingProfile, setSavingProfile]     = useState(false);
  const [notifications, setNotifications]     = useState({
    statusEmail: true,
    interviewInviteEmail: true,
    resumeTipsEmail: false,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(passwordSchema) });

  // Sync profile when user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Fetch real candidate profile (GET /api/candidates/me)
  const fetchCandidateProfile = async () => {
    setLoadingCandidate(true);
    try {
      const res = await candidatesService.getMyProfile();
      setCandidateProfile(res?.data ?? null);
    } catch (err) {
      // 404 is normal if no resume has been uploaded yet
      if (err.response?.status !== 404) {
        console.warn('[CandidateSettings] Fetch candidate error:', err?.message);
      }
      setCandidateProfile(null);
    } finally {
      setLoadingCandidate(false);
    }
  };

  useEffect(() => {
    fetchCandidateProfile();
  }, []);

  const handleResumeUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate type and size
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

  const handleSaveProfile = e => {
    e.preventDefault(); setSavingProfile(true);
    setTimeout(() => { setSavingProfile(false); toast.success('Profile preferences updated!'); }, 400);
  };
  const onPasswordSubmit = async () => {
    await new Promise(r => setTimeout(r, 500));
    toast.success('Password updated!'); reset();
  };
  const handleToggleNotification = key => {
    setNotifications(prev => { const next = { ...prev, [key]: !prev[key] }; toast.success('Preference saved'); return next; });
  };
  const handleLogout = () => { dispatch(logout()); toast.success('Logged out'); navigate('/login'); };
  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') { toast.error('Type "DELETE" to confirm'); return; }
    toast.success('Account deleted'); dispatch(logout()); navigate('/');
  };

  const NOTIF_ITEMS = [
    { key: 'statusEmail',          title: 'Application Status Updates',      desc: 'Email me when an application status changes (Screening, Interview, Shortlisted).' },
    { key: 'interviewInviteEmail', title: 'Interview Invitations',          desc: 'Email me when an AI interview session is scheduled.' },
    { key: 'resumeTipsEmail',      title: 'AI Resume Optimization Tips',    desc: 'Receive periodic recommendations to improve your resume match scores.' },
  ];

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

        {/* A. Profile Details */}
        <Section icon={User} iconColor="#60a5fa" title="Profile Details" delay={0.04} stripe="linear-gradient(90deg, #1e3a5f, #3b82f6)">
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Candidate Account · HireGenius AI</p>
              </div>
            </div>

            {/* Name + Email in responsive auto-fit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
              <Field label="Full Name">
                <input type="text" id="settings-name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={inputStyle(false)} />
              </Field>
              <Field label="Email Address"
                hint="Managed by Auth Service. Verified primary email."
              >
                <div style={{ position: 'relative' }}>
                  <input type="email" readOnly value={profile.email}
                    style={{ ...inputStyle(false), color: 'var(--text-muted)', cursor: 'not-allowed', paddingRight: 90 }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.24)', padding: '3px 8px', borderRadius: 999 }}>
                    <ShieldCheck size={10} /> Verified
                  </span>
                </div>
              </Field>
            </div>

            {/* Phone */}
            <Field label="Phone Number (Optional)">
              <input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1 (555) 000-0000" style={inputStyle(false)} />
            </Field>

            <div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={savingProfile}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 8, padding: '10px 22px', borderRadius: 13, background: savingProfile ? 'rgba(61,80,22,0.40)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: savingProfile ? 'wait' : 'pointer', boxShadow: savingProfile ? 'none' : '0 4px 16px rgba(61,80,22,0.40)', letterSpacing: '-0.01em', transition: 'all 0.18s' }}
                id="save-profile-btn"
              >
                {savingProfile
                  ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</>
                  : <><Check size={14} />Save Profile Changes</>
                }
              </motion.button>
            </div>
          </form>
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

        {/* B. Password & Security */}
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
            <div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={isSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 8, padding: '10px 22px', borderRadius: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 800, cursor: isSubmitting ? 'wait' : 'pointer', letterSpacing: '-0.01em', transition: 'all 0.18s' }}
                id="update-password-btn"
              >
                {isSubmitting
                  ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(100,100,100,0.35)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Updating…</>
                  : <><Lock size={13} />Update Password</>
                }
              </motion.button>
            </div>
          </form>
        </Section>

        {/* C. Notifications */}
        <Section icon={Bell} iconColor="#f59e0b" title="Notification Preferences" delay={0.12} stripe="linear-gradient(90deg, #78350f, #f59e0b)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {NOTIF_ITEMS.map((item, i) => {
              const enabled = notifications[item.key];
              return (
                <motion.div key={item.key}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 + i * 0.05 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: `1px solid ${enabled ? 'rgba(107,138,58,0.25)' : 'var(--card-row-border)'}`, transition: 'all 0.18s ease' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 3 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.desc}</p>
                  </div>
                  <Toggle enabled={enabled} onToggle={() => handleToggleNotification(item.key)} />
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* D. Appearance */}
        <Section icon={theme === 'dark' ? Moon : Sun} iconColor="#34d399" title="Appearance Theme" delay={0.16} stripe="linear-gradient(90deg, #052e1a, #34d399)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 'min(100%, 240px)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Current theme: <span style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{theme} mode</span></p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>Switch between light and dark UI themes. Your preference is saved automatically.</p>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={toggleTheme}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 8, padding: '10px 18px', borderRadius: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              id="toggle-theme-btn"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </motion.button>
          </div>
        </Section>

        {/* E. Danger Zone */}
        <Section icon={AlertTriangle} iconColor="#f87171" title="Account & Danger Zone" delay={0.20} danger>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Sign out */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>Sign Out</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Log out of your current session on this device.</p>
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleLogout}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 7, padding: '9px 16px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                id="logout-btn"
              ><LogOut size={14} />Log Out</motion.button>
            </div>

            {/* Delete account */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.22)' }}>
              <div style={{ flex: 1, minWidth: 'min(100%, 200px)' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#f87171', marginBottom: 3 }}>Delete Candidate Account</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Permanently remove all your application data and interview scorecards. This cannot be undone.</p>
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setDeleteModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 7, padding: '9px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.30)', color: '#f87171', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                id="delete-account-trigger-btn"
              ><Trash2 size={14} />Delete Account</motion.button>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Delete Confirm Modal ───────────────────────────── */}
      <AnimatePresence>
        {deleteModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
              onClick={() => setDeleteModalOpen(false)}
            />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px, 3vw, 24px)', pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 420, background: 'var(--bg-elevated)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 24, boxShadow: '0 32px 96px rgba(0,0,0,0.40)', textAlign: 'center', pointerEvents: 'auto', overflow: 'hidden' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #7f1d1d, #ef4444, #f87171)', borderRadius: '24px 24px 0 0' }} />
                <div style={{ padding: '28px clamp(16px, 4vw, 28px) 24px' }}>
                  <motion.div animate={{ rotate: [0, -8, 8, -6, 6, 0] }} transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}
                  ><Trash2 size={24} style={{ color: '#f87171' }} /></motion.div>
                  <h3 style={{ fontSize: 19, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 10 }}>Are you absolutely sure?</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 20 }}>
                    This action <strong>cannot be undone</strong>. All your application data and interview scorecards will be permanently deleted.<br /><br />
                    Type <strong style={{ color: '#f87171' }}>DELETE</strong> below to confirm.
                  </p>
                  <input type="text" placeholder='Type "DELETE" to confirm' value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    style={{ ...inputStyle(false), textAlign: 'center', fontWeight: 800, color: '#f87171', marginBottom: 18, border: '1px solid rgba(248,113,113,0.35)' }}
                    id="delete-account-confirm-input"
                  />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(''); }}
                      style={{ flex: '1 1 100px', minHeight: 44, padding: '11px 0', borderRadius: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={handleDeleteAccount}
                      style={{ flex: '1 1 140px', minHeight: 44, padding: '11px 0', borderRadius: 13, background: 'linear-gradient(135deg, #7f1d1d, #ef4444)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.40)' }}
                      id="delete-account-confirm-btn"
                    >Confirm Delete</motion.button>
                  </div>
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

export default CandidateSettingsPage;
