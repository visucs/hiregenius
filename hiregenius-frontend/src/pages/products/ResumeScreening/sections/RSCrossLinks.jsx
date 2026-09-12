import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BrainCircuit, Users, BarChart3, ArrowRight } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const OTHER_PRODUCTS = [
  {
    icon: BrainCircuit, label: 'AI Interview',
    desc: 'Auto-generate role-specific questions, evaluate candidate answers, and score communication & technical depth via AI agents.',
    href: '/products/ai-interview', badge: 'Available now',
  },
  {
    icon: Users, label: 'Candidate Ranking',
    desc: 'RAG-powered ranking across your entire applicant pool. Get a ranked shortlist with per-candidate reasoning in seconds.',
    href: '/products/candidate-ranking', badge: 'Coming soon',
  },
  {
    icon: BarChart3, label: 'Analytics',
    desc: 'Real-time hiring dashboards: score distributions, skills gap heatmaps, time-to-hire trends, and interview success rates.',
    href: '/products/analytics', badge: 'Coming soon',
  },
];

const RSCrossLinks = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="Explore More"
        title="The full HireGenius AI suite"
        gradientWord="HireGenius AI suite"
        subtitle="Resume Screening is just the beginning. See what else the platform can do."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="cross-grid">
        {OTHER_PRODUCTS.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              style={{
                background: 'var(--card-float-bg)', border: '1px solid var(--card-float-border)',
                borderRadius: 22, padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--icon-circle-bg)', border: '1px solid var(--step-active-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color="var(--primary)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{p.label}</h3>
                <span style={{ fontSize: 10, fontWeight: 700, color: p.badge === 'Available now' ? 'var(--success)' : 'var(--text-muted)', background: p.badge === 'Available now' ? 'rgba(74,124,63,0.12)' : 'var(--card-row-bg)', border: `1px solid ${p.badge === 'Available now' ? 'rgba(74,124,63,0.25)' : 'var(--card-row-border)'}`, padding: '2px 8px', borderRadius: 999 }}>{p.badge}</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0, flex: 1 }}>{p.desc}</p>
              <Link to={p.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                Learn more <ArrowRight size={13} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
    <style>{`@media(max-width:900px){.cross-grid{grid-template-columns:1fr!important;}}`}</style>
  </section>
);

export default RSCrossLinks;
