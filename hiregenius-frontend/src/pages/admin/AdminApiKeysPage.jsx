import { motion } from 'framer-motion';
import {
  Key, Cpu, Shield, Clock, Sparkles,
  AlertCircle,
} from 'lucide-react';

const PLANNED_PROVIDERS = [
  {
    name: 'Google Gemini',
    models: 'gemini-2.0-flash, gemini-1.5-pro',
    color: '#60a5fa',
    badge: 'Recommended',
    description: 'Ultra-fast multimodal candidate parsing & question generation.',
  },
  {
    name: 'OpenAI',
    models: 'gpt-4o, gpt-4o-mini',
    color: '#10b981',
    badge: 'Supported',
    description: 'High-precision structured resume evaluation & semantic scoring.',
  },
  {
    name: 'Anthropic Claude',
    models: 'claude-3-5-sonnet, claude-3-haiku',
    color: '#f97316',
    badge: 'Supported',
    description: 'In-depth behavioral analysis & interview transcript reasoning.',
  },
  {
    name: 'Cohere',
    models: 'command-r-plus, embed-english-v3.0',
    color: '#a78bfa',
    badge: 'Supported',
    description: 'Dense vector embeddings & specialized reranking models.',
  },
];

const Section = ({ title, subtitle, icon: Icon, iconColor, stripe, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
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
    <div style={{ padding: '20px 22px 24px' }}>{children}</div>
  </motion.div>
);

const AdminApiKeysPage = () => {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)', padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) clamp(24px, 4vw, 36px)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                <Key size={11} /> AI Provider Settings
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.25)' }}>
                <Clock size={11} /> Phase 6 Pending
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>
              AI Provider Keys
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)', margin: 0 }}>
              Configuration panel for LLM backend providers powering AI resume parsing, candidate scoring, and interview intelligence.
            </p>
          </motion.div>
        </div>
      </div>

      <div style={{ padding: 'clamp(20px, 3vw, 24px) clamp(16px, 4vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

        {/* Phase 6 Status Notice Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '16px 20px',
            borderRadius: 16,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Feature Locked Until Phase 6 (AI & ML Microservice)
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              AI provider credentials and model hyperparameters are managed by the upcoming Python FastAPI AI service. Live key provisioning and validation will be unlocked once Phase 6 is implemented.
            </p>
          </div>
        </motion.div>

        {/* Supported AI Providers Overview */}
        <Section
          title="Planned AI Providers & Models"
          subtitle="Architecture-ready LLM backends supported in Phase 6"
          icon={Cpu}
          iconColor="#818cf8"
          stripe="linear-gradient(90deg, #4f46e5, #818cf8, #22d3ee)"
          delay={0.08}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {PLANNED_PROVIDERS.map((p) => (
              <div
                key={p.name}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'var(--card-row-bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.name}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: `${p.color}18`,
                    color: p.color,
                    border: `1px solid ${p.color}33`,
                  }}>
                    {p.badge}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {p.models}
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Integration Roadmap Details */}
        <Section
          title="Phase 6 Integration Checklist"
          subtitle="What becomes active once the AI service connects"
          icon={Sparkles}
          iconColor="#22d3ee"
          stripe="linear-gradient(90deg, #22d3ee, #4ade80)"
          delay={0.14}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                title: 'Automated Resume Parsing & Skill Extraction',
                desc: 'Structured extraction of candidate experience, education, and tech stack from PDF/DOCX resumes.',
              },
              {
                title: 'Semantic Job-to-Candidate Match Scoring',
                desc: 'Vector embedding similarity scores and AI-generated fit justifications on application cards.',
              },
              {
                title: 'Technical Interview Adaptive Questions',
                desc: 'Real-time generation of role-specific interview challenges and standardized rubric grading.',
              },
              {
                title: 'Encrypted Credential Storage & Key Rotation',
                desc: 'Enterprise key vault encryption for OpenAI, Gemini, and Anthropic organization tokens.',
              },
            ].map((item, idx) => (
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--card-row-bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'rgba(99,102,241,0.15)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {idx + 1}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Security & Isolation Note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.20 }}
          style={{ display: 'flex', gap: 12, padding: '16px 18px', borderRadius: 16, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.22)' }}
        >
          <Shield size={16} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
            Security Notice: Provider keys will be secured in AWS Secrets Manager and never exposed to the client or stored in plain text.
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default AdminApiKeysPage;
