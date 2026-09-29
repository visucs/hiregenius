import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserCircle, Camera, Lock, Mail, Building2, Shield,
  AlertCircle, CheckCircle2, Eye, EyeOff,
  User, Key, Briefcase, Info, AlertTriangle, Clock, ShieldCheck,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import authService from '../../services/authService';
import analyticsService from '../../services/analyticsService';
import EmailOtpVerificationModal from '../../components/common/EmailOtpVerificationModal';

/* ─── Validation schema for Password Change ───────────────── */
const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'At least 8 characters').regex(/\d/, 'Must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/* ─── Field component ─────────────────────────────────────── */
const Field = ({ label, error, icon: Icon, hint, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      {Icon && (
        <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
      )}
      {children}
    </div>
    {hint && !error && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>{hint}</p>}
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600 }}
        >
          <AlertCircle size={11} />{error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const inputStyle = (hasIcon = true, focus = false, isReadOnly = false) => ({
  width: '100%', paddingLeft: hasIcon ? 40 : 14, paddingRight: 14,
  paddingTop: 11, paddingBottom: 11, minHeight: 44, borderRadius: 13, fontSize: 13, fontWeight: 500,
  background: isReadOnly ? 'rgba(255,255,255,0.03)' : 'var(--card-row-bg)',
  border: `1px solid ${focus ? 'var(--border-hover)' : 'var(--border)'}`,
  boxShadow: focus ? '0 0 0 3px rgba(61,80,22,0.09)' : 'none',
  color: isReadOnly ? 'var(--text-muted)' : 'var(--text-primary)',
  outline: 'none', fontFamily: 'inherit',
  cursor: isReadOnly ? 'not-allowed' : 'text',
  boxSizing: 'border-box',
  transition: 'all 0.16s ease',
});

/* ─── Section card ────────────────────────────────────────── */
const Section = ({ title, subtitle, icon: Icon, iconColor = 'var(--primary)', children, delay = 0, stripe }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
  >
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: 'clamp(14px, 2.5vw, 18px) clamp(16px, 2.5vw, 24px) 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
    <div style={{ padding: 'clamp(16px, 2.5vw, 22px) clamp(16px, 2.5vw, 24px) 26px' }}>{children}</div>
  </motion.div>
);

/* ─── Submit button ───────────────────────────────────────── */
const SubmitBtn = ({ isLoading, id, children }) => (
  <motion.button
    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
    type="submit" disabled={isLoading} id={id}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '11px 22px', minHeight: 44, borderRadius: 12, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
      background: isLoading ? 'rgba(107,138,58,0.35)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)',
      color: '#fff', fontSize: 13, fontWeight: 800,
      boxShadow: isLoading ? 'none' : '0 4px 18px rgba(61,80,22,0.40)',
      transition: 'all 0.18s', letterSpacing: '-0.01em',
    }}
  >
    {isLoading ? (
      <>
        <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Processing…
      </>
    ) : children}
  </motion.button>
);

/* ─── Password input with show/hide toggle ────────────────── */
const PwdInput = ({ id, registration, placeholder, error }) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
      <input
        {...registration} id={id} type={show ? 'text' : 'password'} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...inputStyle(true, focused, false), paddingRight: 44, borderColor: error ? '#ef4444' : undefined }}
      />
      <button
        type="button" onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   RECRUITER PROFILE PAGE
═══════════════════════════════════════════════════════════════ */
const RecruiterProfilePage = () => {
  const user = useSelector(selectUser);

  // Real stats from Core API analytics
  const [stats, setStats] = useState({ jobsPosted: 0, hired: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Password change form
  const pwdForm = useForm({ resolver: zodResolver(pwdSchema) });

  // Email verification & Admin approval state
  const isEmailVerified = Boolean(user?.email_verified ?? user?.emailVerified);
  const isAdminApproved = Boolean(user?.admin_approved ?? user?.adminApproved);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleStartVerification = async () => {
    if (!user?.email) {
      toast.error('No email address associated with account');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await authService.resendOtp({ email: user.email, purpose: 'EMAIL_VERIFICATION' });
      toast.success(res?.data?.message || 'Verification code sent to your email.');
      setShowOtpModal(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification code requested';
      toast(msg, { icon: 'ℹ️' });
      setShowOtpModal(true);
    } finally {
      setSendingOtp(false);
    }
  };

  // Fetch real recruiter summary stats (GET /api/analytics/recruiter/summary)
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await analyticsService.getRecruiterSummary();
        if (isMounted && res?.data) {
          setStats({
            jobsPosted: res.data.totalJobs ?? 0,
            hired: res.data.applicationsByStatus?.HIRED ?? 0,
          });
        }
      } catch (err) {
        console.warn('[RecruiterProfile] Failed to fetch recruiter summary:', err?.message);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  // Real Change Password submission to Auth Service
  const onPwdSubmit = async (data) => {
    try {
      const res = await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(res?.data?.message || 'Password updated successfully!');
      pwdForm.reset();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password';
      toast.error(msg);
    }
  };

  const initials = (user?.name ?? 'R').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 36px',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: '10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                <UserCircle size={11} /> My Profile
              </span>
            </div>

            {/* Profile identity card inside hero */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2.5vw, 22px)',
              padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)', borderRadius: 22,
              background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.20)',
              flexWrap: 'wrap',
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 22,
                  background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 26, fontWeight: 900,
                  boxShadow: '0 6px 24px rgba(61,80,22,0.55), 0 0 0 3px rgba(107,138,58,0.30)',
                  letterSpacing: '-0.02em',
                }}>
                  {initials}
                </div>
                {/* Disabled Avatar upload button with coming soon tooltip */}
                <button
                  id="profile-avatar-upload"
                  aria-label="Change photo (Coming Soon)"
                  disabled
                  title="Avatar photo upload coming soon"
                  style={{
                    position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(61,80,22,0.7)', border: '2.5px solid rgba(255,255,255,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.35)', opacity: 0.7,
                  }}
                >
                  <Camera size={14} color="#fff" />
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 'min(100%, 200px)' }}>
                <p style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 4 }}>
                  {user?.name ?? 'Recruiter'}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.65)', marginBottom: 10, wordBreak: 'break-all' }}>
                  {user?.email ?? ''}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(107,138,58,0.22)', color: '#a3e635', border: '1px solid rgba(107,138,58,0.35)' }}>
                    <Shield size={11} /> Recruiter
                  </span>
                  {isAdminApproved ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(52,211,153,0.14)', color: '#34d399', border: '1px solid rgba(52,211,153,0.28)' }}>
                      <ShieldCheck size={11} /> Approved by Admin
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.14)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.28)' }}>
                      <Clock size={11} /> Pending Admin Approval
                    </span>
                  )}
                  {user?.company && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(96,165,250,0.14)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.28)' }}>
                      <Briefcase size={11} /> {user.company}
                    </span>
                  )}
                </div>
              </div>

              {/* Real Stats from Core API */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {[
                  { label: 'Jobs Posted', value: loadingStats ? '…' : stats.jobsPosted, color: '#60a5fa' },
                  { label: 'Hired',       value: loadingStats ? '…' : stats.hired,      color: '#34d399' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '12px 18px', textAlign: 'center', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', minWidth: 80 }}>
                    <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 600, marginTop: 4 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

        {/* Account Details (Read-only from Auth Service) */}
        <Section
          title="Account Details"
          subtitle="Identity credentials managed by Auth Service"
          icon={User} iconColor="#60a5fa"
          stripe="linear-gradient(90deg, #60a5fa, #818cf8)"
          delay={0.08}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Full Name" icon={UserCircle} hint="Identity managed by Auth Service.">
              <input
                id="profile-name"
                readOnly
                value={user?.name ?? ''}
                style={inputStyle(true, false, true)}
              />
            </Field>

            <Field label="Email Address" icon={Mail} hint={isEmailVerified ? "Verified primary email address." : "Email verification required to post jobs."}>
              <div style={{ position: 'relative' }}>
                <input
                  id="profile-email"
                  type="email"
                  readOnly
                  value={user?.email ?? ''}
                  style={{ ...inputStyle(true, false, true), paddingRight: 110 }}
                />
                {isEmailVerified ? (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.24)', padding: '3px 8px', borderRadius: 999 }}>
                    <ShieldCheck size={10} /> Verified
                  </span>
                ) : (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.30)', padding: '3px 8px', borderRadius: 999 }}>
                    <AlertTriangle size={10} /> Unverified
                  </span>
                )}
              </div>
            </Field>

            {/* Unverified Email Warning Banner */}
            {!isEmailVerified && (
              <div style={{
                padding: '16px 20px',
                borderRadius: 14,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 'min(100%, 280px)' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    flexShrink: 0,
                  }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', margin: '0 0 2px' }}>
                      Your email address is not verified
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', margin: 0, lineHeight: 1.4 }}>
                      You cannot post jobs until you verify your email.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartVerification}
                  disabled={sendingOtp}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 18px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    color: '#000',
                    fontSize: 12,
                    fontWeight: 800,
                    border: 'none',
                    cursor: sendingOtp ? 'wait' : 'pointer',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <Mail size={14} />
                  {sendingOtp ? 'Sending code…' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {/* Recruiter Account Approval Status Card */}
            <div style={{
              padding: '14px 18px',
              borderRadius: 14,
              background: isAdminApproved ? 'rgba(52,211,153,0.06)' : 'rgba(245,158,11,0.06)',
              border: `1px solid ${isAdminApproved ? 'rgba(52,211,153,0.22)' : 'rgba(245,158,11,0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isAdminApproved ? (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,211,153,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', flexShrink: 0 }}>
                    <ShieldCheck size={18} />
                  </div>
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
                    <Clock size={18} />
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: isAdminApproved ? '#34d399' : '#fbbf24', margin: '0 0 2px' }}>
                    {isAdminApproved ? 'Approved by Admin' : 'Pending Admin Approval'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {isAdminApproved
                      ? 'Your account is approved by an administrator to post jobs.'
                      : 'Your account is awaiting administrator review before you can post jobs.'}
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 999,
                color: isAdminApproved ? '#34d399' : '#fbbf24',
                background: isAdminApproved ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.15)',
                border: `1px solid ${isAdminApproved ? 'rgba(52,211,153,0.28)' : 'rgba(245,158,11,0.28)'}`,
              }}>
                {isAdminApproved ? 'Approved' : 'Pending Review'}
              </span>
            </div>

            {user?.company && (
              <Field label="Company" icon={Building2} hint="Company affiliation.">
                <input
                  id="profile-company"
                  readOnly
                  value={user.company}
                  style={inputStyle(true, false, true)}
                />
              </Field>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <Info size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Profile identity fields are authenticated and managed via the central Auth Service.
              </p>
            </div>
          </div>
        </Section>

        {/* Change Password (Real Auth Service: POST /api/auth/change-password) */}
        <Section
          title="Change Password"
          subtitle="Use a strong, unique password for security"
          icon={Key} iconColor="#f59e0b"
          stripe="linear-gradient(90deg, #f59e0b, #fb923c)"
          delay={0.14}
        >
          <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Current Password" error={pwdForm.formState.errors.currentPassword?.message}>
              <PwdInput
                id="profile-current-pwd"
                registration={pwdForm.register('currentPassword')}
                placeholder="Enter current password"
                error={!!pwdForm.formState.errors.currentPassword}
              />
            </Field>
            <Field label="New Password" error={pwdForm.formState.errors.newPassword?.message}>
              <PwdInput
                id="profile-new-pwd"
                registration={pwdForm.register('newPassword')}
                placeholder="Min. 8 characters with at least one number"
                error={!!pwdForm.formState.errors.newPassword}
              />
            </Field>
            <Field label="Confirm Password" error={pwdForm.formState.errors.confirmPassword?.message}>
              <PwdInput
                id="profile-confirm-pwd"
                registration={pwdForm.register('confirmPassword')}
                placeholder="Repeat new password"
                error={!!pwdForm.formState.errors.confirmPassword}
              />
            </Field>

            {/* Password strength hint */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Shield size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Use at least <strong>8 characters</strong> including at least <strong>one number</strong> for a secure password.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <SubmitBtn isLoading={pwdForm.formState.isSubmitting} id="profile-pwd-save">
                <Key size={14} /> Update Password
              </SubmitBtn>
            </div>
          </form>
        </Section>
      </div>

      <EmailOtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={user?.email ?? ''}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RecruiterProfilePage;
