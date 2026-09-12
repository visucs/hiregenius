import { motion } from 'framer-motion';
import { ListChecks, Scale, Zap } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const BENEFITS = [
  {
    icon: ListChecks,
    title: 'Structured First Rounds',
    desc: `Every candidate faces the same quality of interview — tailored to their resume, yes, but scored on the same criteria. No more "this interviewer asks easier questions" inconsistency. Your process becomes a benchmark, not a lottery.`,
  },
  {
    icon: Scale,
    title: 'Consistent Evaluation Criteria',
    desc: `Human interviewers are unconsciously influenced by likability, accent, and availability bias. Our AI evaluates only what was written — communication clarity, technical accuracy, and confidence indicators — applied uniformly across every submission.`,
  },
  {
    icon: Zap,
    title: 'Faster Time-to-Shortlist',
    desc: `A traditional first-round call takes 30–45 minutes per candidate. With AI Interview, 50 candidates can be evaluated overnight. Your team arrives Monday with a ranked, scored shortlist — ready to schedule final rounds.`,
  },
];

const AIBenefits = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="Why AI Interview"
        title="Stop scheduling calls. Start seeing results."
        gradientWord="results"
        subtitle="AI Interview fixes the three biggest problems with traditional first rounds — inconsistency, bias, and wasted time."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }} className="ai-benefits-grid">
        {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6 }}
            style={{
              background: 'var(--card-float-bg)',
              border: '1px solid var(--card-float-border)',
              borderRadius: 22, padding: '32px 28px',
              display: 'flex', flexDirection: 'column', gap: 18,
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(61,80,22,0.15), rgba(107,138,58,0.10))',
              border: '1px solid var(--step-active-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={26} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    <style>{`@media(max-width:900px){.ai-benefits-grid{grid-template-columns:1fr!important;}}`}</style>
  </section>
);

export default AIBenefits;
