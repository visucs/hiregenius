import { motion } from 'framer-motion';
import {
  Target, AlertOctagon, Briefcase, GraduationCap,
  Code2, Award, Star, TrendingUp,
} from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const ITEMS = [
  { icon: Target,        label: 'Skills Match %',          desc: 'Weighted comparison of candidate skills vs. required job skills — reported as a percentage.' },
  { icon: AlertOctagon,  label: 'Missing Skills',           desc: 'Explicit list of required skills absent from the resume, letting recruiters quickly identify gaps.' },
  { icon: Briefcase,     label: 'Work Experience',          desc: 'Number of years and relevance of prior roles, extracted and parsed from each experience block.' },
  { icon: GraduationCap, label: 'Education',                desc: 'Degree level, field of study, institution, and graduation year — normalized for fair comparison.' },
  { icon: Code2,         label: 'Projects & Portfolio',     desc: 'Side projects, open-source contributions, and portfolio links extracted and catalogued.' },
  { icon: Award,         label: 'Certifications',           desc: 'Professional certifications and licences (e.g., AWS, PMP, CFA) detected and dated.' },
  { icon: Star,          label: 'Overall Score (0–100)',    desc: 'A single weighted composite score that combines all dimensions into one comparable number.' },
  { icon: TrendingUp,    label: 'Final Recommendation',     desc: 'One of three verdicts — Highly Recommended, Consider, or Not a Fit — with a brief AI rationale.' },
];

const RSAnalyzed = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="What Gets Analyzed"
        title="Every signal that matters — extracted automatically"
        gradientWord="every signal"
        subtitle="Our AI + ML pipeline evaluates 8 dimensions per resume so nothing slips through the cracks."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="analyzed-grid">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.02 }}
              style={{
                background: 'var(--card-float-bg)',
                border: '1px solid var(--card-float-border)',
                borderRadius: 20, padding: '24px 22px',
                boxShadow: 'var(--card-float-shadow)',
                display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                cursor: 'default',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'var(--icon-circle-bg)',
                border: '1px solid var(--step-active-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {item.label}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                {item.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>

    <style>{`
      @media (max-width: 1100px) { .analyzed-grid { grid-template-columns: repeat(3, 1fr) !important; } }
      @media (max-width: 768px)  { .analyzed-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      @media (max-width: 480px)  { .analyzed-grid { grid-template-columns: 1fr !important; } }
    `}</style>
  </section>
);

export default RSAnalyzed;
