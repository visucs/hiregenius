import { motion } from 'framer-motion';
import { MessageCircle, Smile, Cpu, Star, ClipboardCheck, Brain } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const EVALUATED = [
  { icon: MessageCircle, label: 'Communication', desc: 'Clarity, structure, and coherence of answers across all questions.' },
  { icon: Smile,         label: 'Confidence',    desc: 'Tone, assertiveness, and strength of conviction in responses.' },
  { icon: Cpu,           label: 'Technical Performance', desc: 'Accuracy, depth, and practical relevance of technical answers.' },
  { icon: Star,          label: 'Final Recommendation',  desc: 'Composite score mapped to: Highly Recommended, Consider, or Not a Fit.' },
  { icon: ClipboardCheck,label: 'Per-Question Notes',    desc: 'AI-generated commentary on each answer, not just a top-level score.' },
  { icon: Brain,         label: 'Question Tailoring',    desc: 'Questions auto-calibrated to role, seniority, and the candidate\'s own resume.' },
];

const AIEvaluated = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="What Gets Evaluated"
        title="Multi-dimensional scoring, not a single number"
        gradientWord="Multi-dimensional"
        subtitle="Every interview is assessed across six dimensions so you get a complete picture — not a black-box score."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="ai-eval-grid">
        {EVALUATED.map(({ icon: Icon, label, desc }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, scale: 1.02 }}
            style={{
              background: 'var(--card-float-bg)',
              border: '1px solid var(--card-float-border)',
              borderRadius: 20, padding: '26px 24px',
              boxShadow: 'var(--card-float-shadow)',
              display: 'flex', flexDirection: 'column', gap: 14,
              transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: 'var(--icon-circle-bg)',
              border: '1px solid var(--step-active-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={22} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    <style>{`
      @media(max-width:900px){.ai-eval-grid{grid-template-columns:1fr 1fr!important;}}
      @media(max-width:560px){.ai-eval-grid{grid-template-columns:1fr!important;}}
    `}</style>
  </section>
);

export default AIEvaluated;
