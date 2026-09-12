import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Globe, Mail, Shield, Database,
  CheckCircle2, AlertTriangle, Zap, AlertCircle,
} from 'lucide-react';

const Toggle = ({ checked, onChange, id }) => (
  <button id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
    style={{ position: 'relative', width: 48, height: 26, borderRadius: 999, flexShrink: 0, background: checked ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'var(--border)', border: 'none', cursor: 'pointer', transition: 'background 0.22s ease', boxShadow: checked ? '0 2px 10px rgba(79,70,229,0.45)' : 'none' }}
  >
    <motion.div animate={{ x: checked ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      style={{ position: 'absolute', top: 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 6px rgba(0,0,0,0.25)' }}
    />
  </button>
);

const IS = { width: '100%', padding: '11px 14px', borderRadius: 13, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

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
    <div style={{ padding: '16px 22px 22px' }}>{children}</div>
  </motion.div>
);

const SettingRow = ({ label, desc, icon: Icon, iconColor, checked, onChange, id }) => (
  <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }}
    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid var(--card-row-border)' }}
  >
    {Icon && <div style={{ width: 34, height: 34, borderRadius: 10, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} style={{ color: iconColor }} />
    </div>}
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
      {desc && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{desc}</p>}
    </div>
    <Toggle checked={checked} onChange={onChange} id={id} />
  </motion.div>
);

const AdminSystemSettingsPage = () => {
  const [saved, setSaved]     = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig]   = useState({
    platformName:        'HireGenius AI',
    supportEmail:        'support@hiregenius.ai',
    maxJobsPerRecruiter: 25,
    maxCandidatesPerJob: 500,
    aiScreeningEnabled:  true,
    aiInterviewEnabled:  true,
    registrationOpen:    true,
    maintenanceMode:     false,
  });

  const set = key => val => setConfig(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setIsSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)', padding: '32px 36px 36px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                <Settings size={11} /> System Settings
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>System Settings</h1>
            <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)' }}>Platform-wide configuration and feature flag controls</p>
          </motion.div>
        </div>
      </div>

      <div style={{ padding: '24px 36px 60px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

        {/* General */}
        <Section title="General" subtitle="Basic platform identity settings" icon={Globe} iconColor="#818cf8" stripe="linear-gradient(90deg, #4f46e5, #818cf8)" delay={0.06}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>Platform Name</label>
              <input value={config.platformName} onChange={e => set('platformName')(e.target.value)} id="sysset-name" style={IS} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>Support Email</label>
              <input value={config.supportEmail} onChange={e => set('supportEmail')(e.target.value)} type="email" id="sysset-email" style={IS} />
            </div>
          </div>
        </Section>

        {/* Limits */}
        <Section title="Platform Limits" subtitle="Maximum usage quotas per entity" icon={Database} iconColor="#22d3ee" stripe="linear-gradient(90deg, #06b6d4, #22d3ee)" delay={0.12}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Max Jobs / Recruiter',   key: 'maxJobsPerRecruiter', id: 'sysset-max-jobs'  },
              { label: 'Max Candidates / Job',    key: 'maxCandidatesPerJob', id: 'sysset-max-cands' },
            ].map(({ label, key, id }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>{label}</label>
                <input value={config[key]} onChange={e => set(key)(Number(e.target.value))} type="number" id={id} style={IS} />
              </div>
            ))}
          </div>
        </Section>

        {/* Feature flags */}
        <Section title="Feature Flags" subtitle="Enable or disable platform capabilities in real-time" icon={Zap} iconColor="#f59e0b" stripe="linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)" delay={0.18}>
          <SettingRow label="AI Resume Screening"  desc="Enable AI-powered resume analysis for all recruiters"     icon={Shield}        iconColor="#818cf8" checked={config.aiScreeningEnabled} onChange={set('aiScreeningEnabled')} id="sysset-ai-screening" />
          <SettingRow label="AI Interview"          desc="Enable AI interview generation and evaluation"            icon={Zap}           iconColor="#22d3ee" checked={config.aiInterviewEnabled} onChange={set('aiInterviewEnabled')} id="sysset-ai-interview" />
          <SettingRow label="Open Registration"     desc="Allow new recruiters to self-register on the platform"   icon={Globe}         iconColor="#4ade80" checked={config.registrationOpen}    onChange={set('registrationOpen')}    id="sysset-registration" />
          <div style={{ borderBottom: 'none' }}>
            <SettingRow label="Maintenance Mode"    desc="Take the platform offline for all non-admin users"        icon={AlertTriangle} iconColor="#ef4444" checked={config.maintenanceMode}    onChange={set('maintenanceMode')}    id="sysset-maintenance" />
          </div>
        </Section>

        {/* Maintenance warning */}
        <AnimatePresence>
          {config.maintenanceMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', gap: 12, padding: '16px 18px', borderRadius: 16, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', overflow: 'hidden' }}
            >
              <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, lineHeight: 1.6 }}>
                ⚠️ Maintenance mode is <strong>ON</strong>. All non-admin users are currently locked out of the platform.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={isSaving} id="sysset-save"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', background: isSaving ? 'rgba(99,102,241,0.35)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: isSaving ? 'none' : '0 4px 18px rgba(79,70,229,0.40)', transition: 'all 0.18s', letterSpacing: '-0.01em' }}
          >
            {isSaving ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</> : <><CheckCircle2 size={14} />Save Settings</>}
          </motion.button>
          <AnimatePresence>
            {saved && <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#4ade80' }}
            ><CheckCircle2 size={15} />Settings saved!</motion.span>}
          </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminSystemSettingsPage;
