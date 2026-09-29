import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Globe, Mail, Shield, Database,
  CheckCircle2, AlertTriangle, Zap, AlertCircle, RefreshCw,
} from 'lucide-react';
import adminService from '../../services/adminService';

const Toggle = ({ checked, onChange, id, disabled = false }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    style={{
      position: 'relative', width: 52, height: 44, background: 'transparent',
      border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 0, flexShrink: 0, opacity: disabled ? 0.6 : 1,
    }}
  >
    <div style={{
      position: 'relative', width: 48, height: 26, borderRadius: 999,
      background: checked ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'var(--border)',
      transition: 'background 0.22s ease',
      boxShadow: checked ? '0 2px 10px rgba(79,70,229,0.45)' : 'none',
    }}>
      <motion.div
        animate={{ x: checked ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          position: 'absolute', top: 3, width: 20, height: 20,
          background: '#fff', borderRadius: '50%', boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  </button>
);

const IS = {
  width: '100%', minHeight: 44, padding: '11px 14px', borderRadius: 13,
  fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const Section = ({ title, subtitle, icon: Icon, iconColor, stripe, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
    }}
  >
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
    <div style={{ padding: '16px 22px 22px' }}>{children}</div>
  </motion.div>
);

const SettingRow = ({ label, desc, icon: Icon, iconColor, checked, onChange, id, badge = null, disabled = false }) => (
  <motion.div
    whileHover={{ x: 2 }} transition={{ duration: 0.15 }}
    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid var(--card-row-border)' }}
  >
    {Icon && (
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: iconColor }} />
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(99,102,241,0.14)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
            {badge}
          </span>
        )}
      </div>
      {desc && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, margin: 0, lineHeight: 1.5 }}>{desc}</p>}
    </div>
    <Toggle checked={checked} onChange={onChange} id={id} disabled={disabled} />
  </motion.div>
);

const AdminSystemSettingsPage = () => {
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [config, setConfig] = useState({
    platformName:              'HireGenius AI',
    supportEmail:              'support@hiregenius.ai',
    maxJobsPerRecruiter:       50,
    maxCandidatesPerJob:       500,
    aiResumeScreeningEnabled:  false,
    aiInterviewEnabled:        false,
    openRegistrationEnabled:   true,
    maintenanceModeEnabled:    false,
  });

  const set = (key) => (val) => setConfig((prev) => ({ ...prev, [key]: val }));

  // Fetch real settings from Core API (:4000)
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminService.getSettings();
      const data = res?.data?.data ?? res?.data;
      if (data) {
        setConfig({
          platformName:              data.platformName ?? 'HireGenius AI',
          supportEmail:              data.supportEmail ?? 'support@hiregenius.ai',
          maxJobsPerRecruiter:       data.maxJobsPerRecruiter ?? 50,
          maxCandidatesPerJob:       data.maxCandidatesPerJob ?? 500,
          aiResumeScreeningEnabled:  Boolean(data.aiResumeScreeningEnabled),
          aiInterviewEnabled:        Boolean(data.aiInterviewEnabled),
          openRegistrationEnabled:   Boolean(data.openRegistrationEnabled),
          maintenanceModeEnabled:    Boolean(data.maintenanceModeEnabled),
        });
      }
    } catch (err) {
      console.error('[AdminSystemSettings] Load error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load platform settings';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save settings via PATCH /api/admin/settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const payload = {
        platformName:              config.platformName.trim(),
        supportEmail:              config.supportEmail.trim(),
        maxJobsPerRecruiter:       Number(config.maxJobsPerRecruiter),
        maxCandidatesPerJob:       Number(config.maxCandidatesPerJob),
        aiResumeScreeningEnabled:  config.aiResumeScreeningEnabled,
        aiInterviewEnabled:        config.aiInterviewEnabled,
        openRegistrationEnabled:   config.openRegistrationEnabled,
        maintenanceModeEnabled:    config.maintenanceModeEnabled,
      };

      const res = await adminService.updateSettings(payload);
      const data = res?.data?.data ?? res?.data;
      if (data) {
        setConfig((prev) => ({ ...prev, ...data }));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error('[AdminSystemSettings] Save error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save platform settings';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) clamp(24px, 4vw, 36px)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                <Settings size={11} /> System Settings
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#4ade80', background: 'rgba(74,222,128,0.10)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(74,222,128,0.22)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Live Core API
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>System Settings</h1>
            <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)' }}>Platform-wide configuration, quotas, and feature flag controls</p>
          </motion.div>
        </div>
      </div>

      <div style={{ padding: 'clamp(20px, 3vw, 24px) clamp(16px, 4vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

        {/* Load Error Banner */}
        {loadError && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderRadius: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} />
              <span>{loadError}</span>
            </div>
            <button onClick={fetchSettings} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )}

        {/* General */}
        <Section title="General" subtitle="Basic platform identity settings" icon={Globe} iconColor="#818cf8" stripe="linear-gradient(90deg, #4f46e5, #818cf8)" delay={0.06}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>Platform Name</label>
              <input value={config.platformName} onChange={(e) => set('platformName')(e.target.value)} id="sysset-name" style={IS} disabled={loading} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>Support Email</label>
              <input value={config.supportEmail} onChange={(e) => set('supportEmail')(e.target.value)} type="email" id="sysset-email" style={IS} disabled={loading} />
            </div>
          </div>
        </Section>

        {/* Limits */}
        <Section title="Platform Limits" subtitle="Maximum usage quotas enforced server-side" icon={Database} iconColor="#22d3ee" stripe="linear-gradient(90deg, #06b6d4, #22d3ee)" delay={0.12}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16 }}>
            {[
              { label: 'Max Jobs / Recruiter', key: 'maxJobsPerRecruiter', id: 'sysset-max-jobs', hint: 'Default: 50' },
              { label: 'Max Candidates / Job', key: 'maxCandidatesPerJob', id: 'sysset-max-cands', hint: 'Default: 500' },
            ].map(({ label, key, id, hint }) => (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 }}>{label}</label>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{hint}</span>
                </div>
                <input value={config[key]} onChange={(e) => set(key)(Number(e.target.value))} type="number" id={id} style={IS} disabled={loading} min="1" />
              </div>
            ))}
          </div>
        </Section>

        {/* Feature flags */}
        <Section title="Feature Flags" subtitle="Enable or disable platform capabilities in real-time" icon={Zap} iconColor="#f59e0b" stripe="linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)" delay={0.18}>
          <SettingRow
            label="Open Registration"
            desc="Allow new candidates and recruiters to self-register. When disabled, Auth Service blocks public registration."
            icon={Globe}
            iconColor="#4ade80"
            checked={config.openRegistrationEnabled}
            onChange={set('openRegistrationEnabled')}
            id="sysset-registration"
            disabled={loading}
          />
          <SettingRow
            label="AI Resume Screening"
            desc="Toggle AI resume screening readiness. (Full ML screening pipeline pending Phase 6)."
            icon={Shield}
            iconColor="#818cf8"
            checked={config.aiResumeScreeningEnabled}
            onChange={set('aiResumeScreeningEnabled')}
            id="sysset-ai-screening"
            badge="Phase 6"
            disabled={loading}
          />
          <SettingRow
            label="AI Interview Assistant"
            desc="Toggle automated AI technical interview evaluator. (Full LLM engine pending Phase 6)."
            icon={Zap}
            iconColor="#22d3ee"
            checked={config.aiInterviewEnabled}
            onChange={set('aiInterviewEnabled')}
            id="sysset-ai-interview"
            badge="Phase 6"
            disabled={loading}
          />
          <div style={{ borderBottom: 'none' }}>
            <SettingRow
              label="Maintenance Mode"
              desc="Takes the entire platform offline (returns 503) for non-admin users. Admins retain full access."
              icon={AlertTriangle}
              iconColor="#ef4444"
              checked={config.maintenanceModeEnabled}
              onChange={set('maintenanceModeEnabled')}
              id="sysset-maintenance"
              disabled={loading}
            />
          </div>
        </Section>

        {/* Maintenance warning */}
        <AnimatePresence>
          {config.maintenanceModeEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', gap: 12, padding: '16px 18px', borderRadius: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', overflow: 'hidden' }}
            >
              <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                ⚠️ Maintenance mode is <strong>ON</strong>. All non-admin API requests will receive HTTP 503. Only administrators can access platform endpoints.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Error Banner */}
        <AnimatePresence>
          {saveError && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444', fontSize: 13, fontWeight: 600 }}
            >
              <AlertCircle size={16} />
              <span>{saveError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={isSaving || loading}
            id="sysset-save"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 8,
              padding: '11px 22px', borderRadius: 12, border: 'none', cursor: isSaving || loading ? 'not-allowed' : 'pointer',
              background: isSaving || loading ? 'rgba(99,102,241,0.35)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: isSaving ? 'none' : '0 4px 18px rgba(79,70,229,0.40)',
              transition: 'all 0.18s', letterSpacing: '-0.01em',
            }}
          >
            {isSaving ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</>
            ) : (
              <><CheckCircle2 size={14} />Save Settings</>
            )}
          </motion.button>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#4ade80' }}
              >
                <CheckCircle2 size={15} />Settings saved to MySQL!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminSystemSettingsPage;
