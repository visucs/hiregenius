import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const FAQS = [
  {
    q: `How are interview questions generated?`,
    a: `HireGenius AI uses a multi-agent system that reads both the active job description and the specific candidate's resume before generating questions. This means questions are role-calibrated (seniority level, required skills, domain) AND candidate-aware — a senior engineer with a systems background will get different questions than a junior applying for the same role. No generic question banks. No repetition across candidates.`,
  },
  {
    q: `Is audio or video interview evaluation supported?`,
    a: `Not in the current release. HireGenius AI v1 evaluates text-based responses only, which removes technical barriers for candidates (no microphone or camera required) and keeps evaluation latency under 30 seconds. Audio and video sentiment analysis — including tone, pacing, and non-verbal confidence signals — is planned for a future release and is explicitly listed as out-of-scope for the MVP.`,
  },
  {
    q: `How does the AI score communication, confidence, and technical performance?`,
    a: `Each dimension is evaluated by a dedicated AI agent. Communication is scored on clarity, structure, use of examples, and absence of ambiguity. Confidence is inferred from assertiveness of phrasing, directness, and avoidance of excessive hedging. Technical performance is assessed by comparing the response content against a ground-truth knowledge graph for the domain — factual accuracy, depth of reasoning, and practical applicability all count. Each agent returns a 0–100 score, and these are composited into the final recommendation tier.`,
  },
  {
    q: `Can I customise the number or type of questions?`,
    a: `Yes. Before triggering an AI interview for a candidate, you can configure the question count (default: 5), toggle between Technical Only, Behavioural Only, or Mixed question sets, and add mandatory questions that the AI must include regardless of the candidate's profile. Difficulty calibration (Junior / Mid / Senior) is also adjustable per interview session.`,
  },
  {
    q: `Is candidate response data stored securely?`,
    a: `All candidate responses are encrypted at rest using AES-256 and transmitted over TLS 1.3. Data is scoped strictly per organisation — no cross-tenant data access is possible. Candidates are shown a clear disclosure before they begin and can request their data be deleted at any time. We do not use candidate responses to train shared AI models without explicit opt-in.`,
  },
  {
    q: `How long does it take for results to come back after a candidate submits?`,
    a: `Evaluation is fully asynchronous. Once a candidate submits their final answer, the AI evaluation pipeline processes all responses and returns scored results within 30 seconds under normal load. Recruiters receive an in-app notification and an email summary as soon as results are ready — there's no manual refresh needed.`,
  },
];

const FAQItem = ({ q, a, isOpen, toggle }) => (
  <div style={{ borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
    <button
      onClick={toggle}
      style={{ width: '100%', textAlign: 'left', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', gap: 16 }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>{q}</span>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ flexShrink: 0 }}>
        <ChevronDown size={18} color="var(--primary)" />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="answer"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--text-secondary)', paddingBottom: 20, margin: 0 }}>{a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const AIFAQ = () => {
  const [open, setOpen] = useState(0);
  return (
    <section id="ai-faq" style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <SectionHeading
          eyebrow="FAQ"
          title="Questions about AI Interview"
          gradientWord="AI Interview"
          subtitle="Everything you need to know before you launch your first automated interview."
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'var(--card-float-bg)',
            border: '1px solid var(--card-float-border)',
            borderRadius: 24, padding: '8px 32px 8px',
            boxShadow: 'var(--card-float-shadow)',
          }}
        >
          {FAQS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} isOpen={open === i} toggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AIFAQ;
