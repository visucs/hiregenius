import { motion } from 'framer-motion';
import { Zap, Scale, BarChart } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const BENEFITS = [
  {
    icon: Zap,
    title: 'Screen Hundreds in Minutes',
    body: 'Manual resume review takes 6–8 minutes per resume. HireGenius AI screens the same resume in under 10 seconds — meaning you process a hundred applications in the time it used to take for ten. Spend your time interviewing people, not reading PDFs.',
  },
  {
    icon: Scale,
    title: 'Reduce Manual Bias',
    body: 'Unconscious bias creeps in whenever humans evaluate resumes — name, university, formatting style. Our model scores on objective criteria: skill match, experience relevance, and certifications. Every candidate gets the same consistent, evidence-based evaluation.',
  },
  {
    icon: BarChart,
    title: 'Consistent, Explainable Scoring',
    body: 'Every score comes with a full breakdown — which skills matched, what was missing, how experience was weighted. There are no black-box verdicts. Recruiters can audit any decision, share results with hiring managers, and defend shortlists with confidence.',
  },
];

const RSBenefits = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)', position: 'relative' }}>
    <div style={{
      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: 600, height: 1,
      background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
    }} />

    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="Why It Matters"
        title="Built for speed, fairness, and clarity"
        gradientWord="fairness"
        subtitle="Three principles that underpin every AI screening decision we make."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }} className="benefits-grid">
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              style={{
                background: 'var(--card-float-bg)',
                border: '1px solid var(--card-float-border)',
                borderRadius: 24, padding: '36px 32px',
                display: 'flex', flexDirection: 'column', gap: 20,
              }}
            >
              {/* Icon circle with gradient background */}
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={24} color="#fff" />
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {b.title}
              </h3>

              <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0 }}>
                {b.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>

    <style>{`
      @media (max-width: 900px) { .benefits-grid { grid-template-columns: 1fr !important; } }
    `}</style>
  </section>
);

export default RSBenefits;
