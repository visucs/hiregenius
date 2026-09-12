import { motion } from 'framer-motion';
import { Upload, Cpu, BarChart2, CheckCircle } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const STEPS = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload Resume',
    desc: 'Recruiter uploads a PDF or DOCX resume directly into HireGenius AI. Files up to 5 MB are accepted and stored securely.',
  },
  {
    num: '02',
    icon: Cpu,
    title: 'AI Parses & Extracts',
    desc: 'Our Resume Agent (LangChain + Gemini) reads the document and extracts skills, work experience, education, projects, and certifications into structured JSON.',
  },
  {
    num: '03',
    icon: BarChart2,
    title: 'ML Model Scores & Matches',
    desc: 'The ML service computes a weighted resume score (0–100%), calculates skills match % against the job description, and identifies missing required skills.',
  },
  {
    num: '04',
    icon: CheckCircle,
    title: 'Recruiter Reviews Recommendation',
    desc: 'Results appear in under 10 seconds: a score ring, skills breakdown, and a clear verdict — Highly Recommended, Consider, or Not a Fit — for fast, confident decisions.',
  },
];

const RSHowItWorks = () => (
  <section
    id="rs-how-it-works"
    style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)', position: 'relative' }}
  >
    {/* subtle top divider glow */}
    <div style={{
      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: 600, height: 1, background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
    }} />

    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="How It Works"
        title="From upload to verdict in 4 steps"
        gradientWord="4 steps"
        subtitle="HireGenius AI handles the heavy lifting — extraction, scoring, and ranking — so recruiters spend time on people, not paper."
      />

      {/* Steps grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative' }}
        className="steps-grid">

        {/* Connecting line behind cards */}
        <div style={{
          position: 'absolute', top: 44, left: '12.5%', right: '12.5%', height: 2,
          background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
          opacity: 0.25, zIndex: 0,
        }} className="steps-line" />

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              style={{
                position: 'relative', zIndex: 1,
                background: 'var(--card-float-bg)',
                border: '1px solid var(--card-float-border)',
                borderRadius: 20, padding: '28px 24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              {/* Number badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 14,
                  background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} color="#fff" />
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: 'var(--primary)',
                  letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums',
                }}>
                  STEP {step.num}
                </span>
              </div>

              <h3 style={{
                fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                letterSpacing: '-0.02em', margin: 0,
              }}>
                {step.title}
              </h3>

              <p style={{
                fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0,
              }}>
                {step.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>

    <style>{`
      @media (max-width: 900px) {
        .steps-grid { grid-template-columns: 1fr 1fr !important; }
        .steps-line { display: none !important; }
      }
      @media (max-width: 540px) {
        .steps-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
  </section>
);

export default RSHowItWorks;
