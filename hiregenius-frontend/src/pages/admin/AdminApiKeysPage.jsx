import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Key, Eye, EyeOff, Save, CheckCircle2, AlertCircle,
  Cpu, ChevronDown, Shield, Zap, Lock,
} from 'lucide-react';

const keySchema = z.object({
  provider:  z.enum(['OPENAI', 'GEMINI', 'ANTHROPIC', 'COHERE']),
  apiKey:    z.string().min(10, 'Enter a valid API key'),
  model:     z.string().min(1, 'Select a model'),
  maxTokens: z.coerce.number().min(256).max(128000),
});

const PROVIDER_MODELS = {
  OPENAI:    ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  GEMINI:    ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  ANTHROPIC: ['claude-sonnet-4-5', 'claude-3-haiku'],
  COHERE:    ['command-r-plus', 'command-r'],
};

const PROVIDER_COLORS = { OPENAI: '#10b981', GEMINI: '#60a5fa', ANTHROPIC: '#f97316', COHERE: '#a78bfa' };

const IS = { width: '100%', minHeight: 44, padding: '11px 14px', borderRadius: 13, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

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

const AdminApiKeysPage = () => {
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [savedKey, setSavedKey] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(keySchema),
    defaultValues: { provider: 'GEMINI', apiKey: '', model: 'gemini-2.0-flash', maxTokens: 4096 },
  });

  const provider = watch('provider');
  const models   = PROVIDER_MODELS[provider] ?? [];
  const provColor = PROVIDER_COLORS[provider] ?? '#818cf8';

  const onSubmit = async (data) => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSavedKey(data.apiKey.slice(-4));
    setIsSaving(false); setSaved(true); setShowKey(false);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) clamp(24px, 4vw, 36px)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                <Key size={11} /> AI Provider Settings
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>AI Provider Keys</h1>
            <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)' }}>Configure the LLM backend for resume screening and AI interviews</p>
          </motion.div>
        </div>
      </div>

      <div style={{ padding: 'clamp(20px, 3vw, 24px) clamp(16px, 4vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 680, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

        {/* Active key status banner */}
        <AnimatePresence>
          {savedKey && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.28)' }}
            >
              <Lock size={16} style={{ color: '#818cf8' }} />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Active key ending in <strong>••••{savedKey}</strong></span>
              {saved && (
                <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#4ade80' }}
                ><CheckCircle2 size={14} />Saved!</motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* LLM Configuration */}
        <Section title="LLM Configuration" subtitle="Select provider, model and enter your API key" icon={Cpu} iconColor="#818cf8" stripe="linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)" delay={0.08}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Provider selector */}
            <Field label="AI Provider" error={errors.provider?.message}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: 8 }}>
                {Object.keys(PROVIDER_MODELS).map(p => {
                  const active = provider === p;
                  const pc = PROVIDER_COLORS[p];
                  return (
                    <label key={p} style={{ cursor: 'pointer' }}>
                      <input {...register('provider')} type="radio" value={p} style={{ display: 'none' }} />
                      <div style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 8px', borderRadius: 13, textAlign: 'center', border: `2px solid ${active ? pc : 'var(--border)'}`, background: active ? `${pc}14` : 'var(--card-row-bg)', transition: 'all 0.15s', boxShadow: active ? `0 3px 12px ${pc}30` : 'none' }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: active ? pc : 'var(--text-muted)' }}>{p}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Field>

            {/* Model */}
            <Field label="Model" error={errors.model?.message}>
              <div style={{ position: 'relative' }}>
                <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <select {...register('model')} id="apikeys-model" style={{ ...IS, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </Field>

            {/* API Key */}
            <Field label="API Key" error={errors.apiKey?.message}>
              <div style={{ position: 'relative' }}>
                <Key size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...register('apiKey')} type={showKey ? 'text' : 'password'} id="apikeys-key"
                  placeholder="sk-…" style={{ ...IS, paddingLeft: 40, paddingRight: 46, fontFamily: 'monospace, monospace' }}
                />
                <button type="button" onClick={() => setShowKey(v => !v)} id="apikeys-show-toggle" aria-label={showKey ? 'Hide key' : 'Show key'}
                  style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', minWidth: 44, minHeight: 44, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Only the last 4 characters will be visible after saving.</p>
            </Field>

            {/* Max tokens */}
            <Field label="Max Tokens" error={errors.maxTokens?.message}>
              <input {...register('maxTokens')} type="number" id="apikeys-tokens" style={IS} />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4, flexWrap: 'wrap' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={isSaving} id="apikeys-save"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', background: isSaving ? 'rgba(99,102,241,0.35)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: isSaving ? 'none' : '0 4px 18px rgba(79,70,229,0.40)', transition: 'all 0.18s', letterSpacing: '-0.01em' }}
              >
                {isSaving ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</> : <><Save size={14} />Save Configuration</>}
              </motion.button>
              <AnimatePresence>
                {saved && <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#4ade80' }}
                ><CheckCircle2 size={15} />Configuration saved!</motion.span>}
              </AnimatePresence>
            </div>
          </form>
        </Section>

        {/* Security note */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
          style={{ display: 'flex', gap: 12, padding: '16px 18px', borderRadius: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}
        >
          <Shield size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            API keys are stored encrypted at rest. Keys are <strong>never exposed in API responses</strong> — only the last 4 characters are shown after saving. Rotate your keys regularly for security.
          </p>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminApiKeysPage;
