import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserCircle, Camera, Lock, Mail, Building2, Shield,
  AlertCircle, CheckCircle2, Sparkles, Eye, EyeOff,
  User, Key, ArrowRight, TrendingUp, Briefcase,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';

/* ─── Validation schemas ──────────────────────────────────── */
const profileSchema = z.object({
  name:    z.string().min(2, 'Name too short'),
  email:   z.string().email('Invalid email'),
  company: z.string().min(1, 'Company required'),
});

const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Enter current password'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

/* ─── Field component ─────────────────────────────────────── */
const Field = ({ label, error, icon: Icon, children }) => (
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

const inputStyle = (hasIcon = true, focus = false) => ({
  width: '100%', paddingLeft: hasIcon ? 40 : 14, paddingRight: 14,
  paddingTop: 11, paddingBottom: 11, minHeight: 44, borderRadius: 13, fontSize: 13, fontWeight: 500,
  background: 'var(--card-row-bg)', border: `1px solid ${focus ? 'var(--border-hover)' : 'var(--border)'}`,
  boxShadow: focus ? '0 0 0 3px rgba(61,80,22,0.09)' : 'none',
  color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
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
    onMouseEnter={e => { if (!isLoading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(61,80,22,0.55)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = isLoading ? 'none' : '0 4px 18px rgba(61,80,22,0.40)'; }}
  >
    {isLoading
      ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Processing…</>
      : children
    }
  </motion.button>
);

/* ─── Password input with show/hide toggle ────────────────── */
const PwdInput = ({ id, registration, placeholder }) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
      <input
        {...registration} id={id} type={show ? 'text' : 'password'} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...inputStyle(true, focused), paddingRight: 44 }}
      />
      <button type="button" onClick={() => setShow(v => !v)}
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
  const [profileSaved, setProfileSaved]   = useState(false);
  const [pwdSaved,     setPwdSaved]       = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPwd,     setIsSavingPwd]     = useState(false);
  const [nameF, setNameF]       = useState(false);
  const [emailF, setEmailF]     = useState(false);
  const [companyF, setCompanyF] = useState(false);

  const initials = (user?.name ?? 'R').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', company: 'TechCorp India' },
  });
  const pwdForm = useForm({ resolver: zodResolver(pwdSchema) });

  const onProfileSubmit = async () => {
    setIsSavingProfile(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSavingProfile(false); setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };
  const onPwdSubmit = async () => {
    setIsSavingPwd(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSavingPwd(false); setPwdSaved(true); pwdForm.reset();
    setTimeout(() => setPwdSaved(false), 3000);
  };

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
                <button
                  id="profile-avatar-upload"
                  aria-label="Change photo"
                  style={{
                    position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: '50%',
                    background: '#3D5016', border: '2.5px solid rgba(255,255,255,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.35)', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#5a7e22'}
                  onMouseLeave={e => e.currentTarget.style.background = '#3D5016'}
                >
                  <Camera size={14} color="#fff" />
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 'min(100%, 200px)' }}>
                <p style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 4 }}>{user?.name ?? 'Recruiter'}</p>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.65)', marginBottom: 10, wordBreak: 'break-all' }}>{user?.email ?? ''}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(107,138,58,0.22)', color: '#a3e635', border: '1px solid rgba(107,138,58,0.35)' }}>
                    <Shield size={11} /> Recruiter
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(96,165,250,0.14)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.28)' }}>
                    <Briefcase size={11} /> TechCorp India
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {[
                  { label: 'Jobs Posted', value: '12', color: '#60a5fa' },
                  { label: 'Hired',       value: '3',  color: '#34d399' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '12px 18px', textAlign: 'center', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
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

        {/* Account Details */}
        <Section
          title="Account Details"
          subtitle="Update your name, email and company"
          icon={User} iconColor="#60a5fa"
          stripe="linear-gradient(90deg, #60a5fa, #818cf8)"
          delay={0.08}
        >
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Full Name" error={profileForm.formState.errors.name?.message}>
              <UserCircle size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                {...profileForm.register('name')} id="profile-name"
                onFocus={() => setNameF(true)} onBlur={() => setNameF(false)}
                style={inputStyle(true, nameF)}
              />
            </Field>
            <Field label="Email Address" error={profileForm.formState.errors.email?.message}>
              <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                {...profileForm.register('email')} id="profile-email" type="email"
                onFocus={() => setEmailF(true)} onBlur={() => setEmailF(false)}
                style={inputStyle(true, emailF)}
              />
            </Field>
            <Field label="Company" error={profileForm.formState.errors.company?.message}>
              <Building2 size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                {...profileForm.register('company')} id="profile-company"
                onFocus={() => setCompanyF(true)} onBlur={() => setCompanyF(false)}
                style={inputStyle(true, companyF)}
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <SubmitBtn isLoading={isSavingProfile} id="profile-save">
                <CheckCircle2 size={14} /> Save Changes
              </SubmitBtn>
              <AnimatePresence>
                {profileSaved && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#34d399' }}
                  >
                    <CheckCircle2 size={15} /> Changes saved!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Section>

        {/* Change Password */}
        <Section
          title="Change Password"
          subtitle="Use a strong, unique password for security"
          icon={Key} iconColor="#f59e0b"
          stripe="linear-gradient(90deg, #f59e0b, #fb923c)"
          delay={0.14}
        >
          <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Current Password" error={pwdForm.formState.errors.currentPassword?.message}>
              <PwdInput id="profile-current-pwd" registration={pwdForm.register('currentPassword')} placeholder="Enter current password" />
            </Field>
            <Field label="New Password" error={pwdForm.formState.errors.newPassword?.message}>
              <PwdInput id="profile-new-pwd" registration={pwdForm.register('newPassword')} placeholder="Min. 8 characters" />
            </Field>
            <Field label="Confirm Password" error={pwdForm.formState.errors.confirmPassword?.message}>
              <PwdInput id="profile-confirm-pwd" registration={pwdForm.register('confirmPassword')} placeholder="Repeat new password" />
            </Field>

            {/* Password strength hint */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Shield size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Use at least <strong>8 characters</strong> with a mix of letters, numbers & symbols for a strong password.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <SubmitBtn isLoading={isSavingPwd} id="profile-pwd-save">
                <Key size={14} /> Update Password
              </SubmitBtn>
              <AnimatePresence>
                {pwdSaved && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#34d399' }}
                  >
                    <CheckCircle2 size={15} /> Password updated!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RecruiterProfilePage;
