import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Sun, Moon, Bell, Mail, Smartphone, CalendarDays,
  CheckCircle2, Settings, Palette,
  Shield, Zap, FileSearch, Play, Users, ChevronRight,
  Sparkles,
} from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import recruiterPreferencesService from '../../services/recruiterPreferencesService';

/* ─── Animated toggle ─────────────────────────────────────── */
const Toggle = ({ checked, onChange, id, disabled = false }) => (
  <button
    id={id} role="switch" aria-checked={checked} disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    style={{
      position: 'relative', width: 48, height: 26, borderRadius: 999, flexShrink: 0,
      background: checked ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'var(--border)',
      border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1, transition: 'background 0.22s ease',
      boxShadow: checked ? '0 2px 10px rgba(61,80,22,0.45)' : 'none',
    }}
  >
    <motion.div
      animate={{ x: checked ? 24 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      style={{
        position: 'absolute', top: 3, width: 20, height: 20,
        background: '#fff', borderRadius: '50%',
        boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
      }}
    />
  </button>
);

/* ─── Setting row ─────────────────────────────────────────── */
const SettingRow = ({ label, description, icon: Icon, iconColor, checked, onChange, id, badge, disabled = false }) => (
  <motion.div
    whileHover={disabled ? undefined : { x: 2 }}
    transition={{ duration: 0.15 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 0', borderBottom: '1px solid var(--card-row-border)',
      cursor: 'default', opacity: disabled ? 0.75 : 1,
    }}
  >
    {Icon && (
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>{label}</p>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, ...badge.style }}>
            {badge.text}
          </span>
        )}
      </div>
      {description && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5, margin: 0 }}>{description}</p>}
    </div>
    <Toggle checked={checked} onChange={onChange} id={id} disabled={disabled} />
  </motion.div>
);

/* ─── Section card wrapper ────────────────────────────────── */
const Section = ({ title, subtitle, icon: Icon, iconColor, stripe, children, delay = 0 }) => (
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
    <div style={{ padding: '8px clamp(16px, 2.5vw, 24px) 22px' }}>{children}</div>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════
   RECRUITER SETTINGS PAGE
════════════════════════════════════════════════════════════ */
const RecruiterSettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  // Real Preferences from Core API: recruiter_notification_preferences
  const [prefs, setPrefs] = useState({
    notify_on_new_application: false,
    job_alert_dispatch_enabled: true,
  });

  // Fetch real preferences on load (GET /api/recruiters/me/notification-preferences)
  const fetchPrefs = useCallback(async () => {
    setLoadingPrefs(true);
    try {
      const res = await recruiterPreferencesService.getPreferences();
      if (res?.data) {
        setPrefs({
          notify_on_new_application: Boolean(res.data.notify_on_new_application),
          job_alert_dispatch_enabled: Boolean(res.data.job_alert_dispatch_enabled),
        });
      }
    } catch (err) {
      console.warn('[RecruiterSettings] Error fetching preferences:', err?.message);
    } finally {
      setLoadingPrefs(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleToggle = (key) => (val) => {
    setPrefs((prev) => ({ ...prev, [key]: val }));
  };

  // Real Save to Core API (PATCH /api/recruiters/me/notification-preferences)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await recruiterPreferencesService.updatePreferences({
        notify_on_new_application: prefs.notify_on_new_application,
        job_alert_dispatch_enabled: prefs.job_alert_dispatch_enabled,
      });
      setIsSaving(false);
      setSaved(true);
      toast.success('Preferences saved successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setIsSaving(false);
      const msg = err.response?.data?.message || err.message || 'Failed to save preferences';
      toast.error(msg);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ───────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 36px',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -80, right: '10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                <Settings size={11} /> Workspace Settings
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Settings</h1>
            <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>Manage your appearance, notifications, and workspace preferences</p>
          </motion.div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

        {/* ── Appearance ─────────────────────────────────────── */}
        <Section
          title="Appearance"
          subtitle="Choose your preferred color theme"
          icon={Palette} iconColor="#a78bfa"
          stripe="linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)"
          delay={0.06}
        >
          <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 12 }}>
            {[
              { key: 'light', label: 'Light Mode', desc: 'Clean & bright', icon: Sun,  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', activeBg: 'rgba(245,158,11,0.13)', activeBorder: 'rgba(245,158,11,0.40)' },
              { key: 'dark',  label: 'Dark Mode',  desc: 'Easy on eyes', icon: Moon, color: '#818cf8', bg: 'rgba(129,140,248,0.08)', activeBg: 'rgba(129,140,248,0.14)', activeBorder: 'rgba(129,140,248,0.40)' },
            ].map(({ key, label, desc, icon: ThemeIcon, color, bg, activeBg, activeBorder }) => {
              const active = theme === key;
              return (
                <motion.button
                  key={key} whileTap={{ scale: 0.97 }}
                  id={`settings-theme-${key}`}
                  onClick={toggleTheme}
                  style={{
                    padding: '18px 20px', minHeight: 44, borderRadius: 16, border: `2px solid ${active ? activeBorder : 'var(--border)'}`,
                    background: active ? activeBg : 'var(--card-row-bg)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s ease',
                    boxShadow: active ? `0 4px 20px ${color}22` : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = 'var(--border-hover)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'var(--card-row-bg)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
                >
                  {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)` }} />}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? `${color}22` : `${color}12`, border: `1px solid ${active ? `${color}38` : `${color}20`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <ThemeIcon size={20} style={{ color }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: active ? color : 'var(--text-primary)', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
                  {active && (
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={12} color="#fff" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </Section>

        {/* ── Notifications (Real Core API GET/PATCH /api/recruiters/me/notification-preferences) ──────────────── */}
        <Section
          title="Notification Preferences"
          subtitle="Control how and when you get notified about hiring activity"
          icon={Bell} iconColor="#34d399"
          stripe="linear-gradient(90deg, #34d399, #10b981)"
          delay={0.12}
        >
          <div style={{ paddingTop: 4 }}>
            {/* Real 1: notify_on_new_application */}
            <SettingRow
              label="New Application Email Alerts"
              description="Get emailed immediately whenever a candidate applies to one of your active job postings"
              icon={Mail}
              iconColor="#60a5fa"
              checked={prefs.notify_on_new_application}
              onChange={handleToggle('notify_on_new_application')}
              id="settings-notif-new-app"
              badge={{ text: 'Live Core API', style: { color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' } }}
              disabled={loadingPrefs}
            />

            {/* Real 2: job_alert_dispatch_enabled */}
            <SettingRow
              label="Candidate Job Alert Dispatch"
              description="Automatically send email alerts to opted-in candidates when you publish a new job opening"
              icon={Zap}
              iconColor="#a3e635"
              checked={prefs.job_alert_dispatch_enabled}
              onChange={handleToggle('job_alert_dispatch_enabled')}
              id="settings-notif-job-alerts"
              badge={{ text: 'Live Core API', style: { color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' } }}
              disabled={loadingPrefs}
            />

            {/* Honest Placeholder 1: AI Interview notifications */}
            <SettingRow
              label="AI Interview Completed Alerts"
              description="Get emailed a transcript and evaluation scorecard when an AI interview session concludes"
              icon={Play}
              iconColor="#a78bfa"
              checked={false}
              onChange={() => {}}
              id="settings-notif-interview"
              badge={{ text: 'Phase 7 · AI Evaluator', style: { color: '#a78bfa', background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.22)' } }}
              disabled
            />

            {/* Honest Placeholder 2: Resume Screening */}
            <SettingRow
              label="Resume Screening Results"
              description="Real-time email alerts for ATS parsing and candidate match score completions"
              icon={FileSearch}
              iconColor="#f59e0b"
              checked={false}
              onChange={() => {}}
              id="settings-notif-screening"
              badge={{ text: 'Phase 6 · Coming Soon', style: { color: '#f59e0b', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)' } }}
              disabled
            />

            {/* Honest Placeholder 3: Weekly Digest */}
            <SettingRow
              label="Weekly Hiring Funnel Digest"
              description="Summary of all candidate applicants, screening ratios, and weekly pipeline changes"
              icon={CalendarDays}
              iconColor="#ec4899"
              checked={false}
              onChange={() => {}}
              id="settings-notif-digest"
              badge={{ text: 'Coming Soon', style: { color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' } }}
              disabled
            />

            <div style={{ paddingTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                onClick={handleSave} disabled={isSaving || loadingPrefs} id="settings-save"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 22px', minHeight: 44, borderRadius: 12, border: 'none',
                  cursor: (isSaving || loadingPrefs) ? 'not-allowed' : 'pointer',
                  background: (isSaving || loadingPrefs) ? 'rgba(107,138,58,0.35)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                  color: '#fff', fontSize: 13, fontWeight: 800,
                  boxShadow: isSaving ? 'none' : '0 4px 18px rgba(61,80,22,0.40)',
                  transition: 'all 0.18s', letterSpacing: '-0.01em',
                }}
              >
                {isSaving ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />Save Preferences
                  </>
                )}
              </motion.button>

              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#34d399' }}
                  >
                    <CheckCircle2 size={15} /> Preferences saved!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Section>

        {/* ── Account Security quick links ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #fb923c)', borderRadius: '20px 20px 0 0' }} />
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Account & Security</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Manage your account credentials</p>
            </div>
          </div>
          <div style={{ padding: '8px 16px 16px' }}>
            {[
              { label: 'View Profile Info', sub: 'Identity and credentials overview', icon: Users, color: '#60a5fa', to: '/recruiter/profile' },
              { label: 'Change Password', sub: 'Update your login password', icon: Shield, color: '#f59e0b', to: '/recruiter/profile' },
            ].map(({ label, sub, icon: Icon, color, to }) => (
              <a
                key={label} href={to}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 12, textDecoration: 'none', transition: 'background 0.13s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--card-row-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, margin: 0 }}>{sub}</p>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RecruiterSettingsPage;
