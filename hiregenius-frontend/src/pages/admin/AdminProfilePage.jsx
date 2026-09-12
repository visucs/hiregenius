import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield, Camera, Lock, Mail, CheckCircle2,
  AlertCircle, Eye, EyeOff, User, Key,
  Activity, Users, Briefcase,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';

/* ─── Schemas ─────────────────────────────────────────────── */
const profileSchema = z.object({
  name:  z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
});
const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

/* ─── Shared styles ───────────────────────────────────────── */
const IS = { width: '100%', padding: '11px 14px', borderRadius: 13, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

const Field = ({ label, error, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>{label}</label>
    {children}
    <AnimatePresence>
      {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#ef4444', marginTop: 6, fontWeight: 600 }}
      ><AlertCircle size={11} />{error}</motion.p>}
    </AnimatePresence>
  </div>
);

/* ─── Section card ────────────────────────────────────────── */
const Section = ({ title, subtitle, icon: Icon, iconColor, stripe, children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
  >
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
    <div style={{ padding: '20px 22px 24px' }}>{children}</div>
  </motion.div>
);

/* ─── Password input with show/hide ──────────────────────── */
const PwdInput = ({ id, registration }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      <input {...registration} id={id} type={show ? 'text' : 'password'}
        style={{ ...IS, paddingLeft: 40, paddingRight: 42 }}
      />
      <button type="button" onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
      >{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
    </div>
  );
};

/* ─── Submit button ───────────────────────────────────────── */
const SubmitBtn = ({ isLoading, id, children }) => (
  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={isLoading} id={id}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: isLoading ? 'rgba(99,102,241,0.35)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: isLoading ? 'none' : '0 4px 18px rgba(79,70,229,0.40)', transition: 'all 0.18s', letterSpacing: '-0.01em' }}
  >
    {isLoading
      ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Processing…</>
      : children
    }
  </motion.button>
);

/* ════════════════════════════════════════════════════════════
   ADMIN PROFILE PAGE
════════════════════════════════════════════════════════════ */
const AdminProfilePage = () => {
  const user = useSelector(selectUser);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwdSaved,     setPwdSaved]     = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPwd,     setIsSavingPwd]     = useState(false);

  const initials = (user?.name ?? 'AD').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? 'Admin', email: user?.email ?? 'admin@hiregenius.ai' } });
  const pwdForm = useForm({ resolver: zodResolver(pwdSchema) });

  const onProfileSubmit = async () => {
    setIsSavingProfile(true);
    await new Promise(r => setTimeout(r, 700));
    setIsSavingProfile(false); setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };
  const onPwdSubmit = async () => {
    setIsSavingPwd(true);
    await new Promise(r => setTimeout(r, 700));
    setIsSavingPwd(false); setPwdSaved(true); pwdForm.reset();
    setTimeout(() => setPwdSaved(false), 3000);
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Indigo Hero ───────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)', padding: '32px 36px 36px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: '10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                <User size={11} /> Admin Profile
              </span>
            </div>

            {/* Identity card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '22px 26px', borderRadius: 22, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 32px rgba(0,0,0,0.20)' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 900, boxShadow: '0 6px 24px rgba(79,70,229,0.55), 0 0 0 3px rgba(99,102,241,0.30)', letterSpacing: '-0.02em' }}>
                  {initials}
                </div>
                <button id="admin-profile-avatar" aria-label="Change photo"
                  style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', border: '2.5px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.35)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                ><Camera size={13} color="#fff" /></button>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 4 }}>{user?.name ?? 'Admin'}</p>
                <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)', marginBottom: 10 }}>{user?.email ?? 'admin@hiregenius.ai'}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.22)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.35)' }}>
                    <Shield size={11} /> Super Admin
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(74,222,128,0.14)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.28)' }}>
                    <Activity size={11} /> Full Access
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {[
                  { label: 'Users Managed', value: '3.8k', color: '#818cf8' },
                  { label: 'Actions Today', value: '24',   color: '#4ade80' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '12px 18px', textAlign: 'center', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 5 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

        {/* Account Details */}
        <Section title="Account Details" subtitle="Update your admin identity" icon={User} iconColor="#818cf8" stripe="linear-gradient(90deg, #4f46e5, #818cf8)" delay={0.08}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Full Name" error={profileForm.formState.errors.name?.message}>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...profileForm.register('name')} id="admin-profile-name" style={{ ...IS, paddingLeft: 40 }} />
              </div>
            </Field>
            <Field label="Email Address" error={profileForm.formState.errors.email?.message}>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...profileForm.register('email')} type="email" id="admin-profile-email" style={{ ...IS, paddingLeft: 40 }} />
              </div>
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <SubmitBtn isLoading={isSavingProfile} id="admin-profile-save"><CheckCircle2 size={14} />Save Changes</SubmitBtn>
              <AnimatePresence>
                {profileSaved && <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#4ade80' }}
                ><CheckCircle2 size={15} />Changes saved!</motion.span>}
              </AnimatePresence>
            </div>
          </form>
        </Section>

        {/* Change Password */}
        <Section title="Change Password" subtitle="Keep your admin account secure" icon={Key} iconColor="#f59e0b" stripe="linear-gradient(90deg, #d97706, #f59e0b)" delay={0.14}>
          <form onSubmit={pwdForm.handleSubmit(onPwdSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Current Password" error={pwdForm.formState.errors.currentPassword?.message}>
              <PwdInput id="admin-profile-pwd-current" registration={pwdForm.register('currentPassword')} />
            </Field>
            <Field label="New Password" error={pwdForm.formState.errors.newPassword?.message}>
              <PwdInput id="admin-profile-pwd-new" registration={pwdForm.register('newPassword')} />
            </Field>
            <Field label="Confirm Password" error={pwdForm.formState.errors.confirmPassword?.message}>
              <PwdInput id="admin-profile-pwd-confirm" registration={pwdForm.register('confirmPassword')} />
            </Field>
            {/* Security hint */}
            <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)' }}>
              <Shield size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>As a Super Admin, use a <strong>strong unique password</strong> with at least 8 characters including numbers and symbols.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <SubmitBtn isLoading={isSavingPwd} id="admin-profile-pwd-save"><Key size={14} />Update Password</SubmitBtn>
              <AnimatePresence>
                {pwdSaved && <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#4ade80' }}
                ><CheckCircle2 size={15} />Password updated!</motion.span>}
              </AnimatePresence>
            </div>
          </form>
        </Section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminProfilePage;
