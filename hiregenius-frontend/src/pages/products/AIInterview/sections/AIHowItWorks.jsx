import { motion } from 'framer-motion';
import { UserCheck, BrainCircuit, FileText, BarChart2 } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const STEPS = [
  {
    icon: UserCheck, num: '01', title: 'Recruiter Selects Candidate',
    desc: `Open any candidate profile and click "Generate Interview". The AI instantly reads their resume and the active job description to tailor every question to that exact person and role.`,
  },
  {
    icon: BrainCircuit, num: '02', title: 'AI Generates Role-Specific Questions',
    desc: `Our multi-agent system generates a set of questions calibrated to the role level — covering technical depth, situational problem-solving, and communication style. No templates. No repetition.`,
  },
  {
    icon: FileText, num: '03', title: 'Candidate Answers (Text)',
    desc: `The candidate receives a secure interview link and answers each question in their own time using our in-platform text editor. Answers are saved progressively — no time pressure, no technical drop-outs.`,
  },
  {
    icon: BarChart2, num: '04', title: 'AI Evaluates & Scores',
    desc: `Once submitted, the AI evaluation agent scores each response across Communication, Confidence, and Technical Performance — and returns a final recommendation (Highly Recommended / Consider / Not a Fit) in under 30 seconds.`,
  },
];

const AIHowItWorks = () => (
  <section
    id="ai-how-it-works"
    style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)' }}
  >
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="How It Works"
        title="From selection to scored result in 4 steps"
        gradientWord="4 steps"
        subtitle="The entire first-round interview cycle, fully automated — recruiter in control at every stage."
      />

      {/* Steps */}
      <div style={{ position: 'relative' }}>
        {/* Connecting line (desktop) */}
        <div style={{
          position: 'absolute', top: 36, left: 'calc(12.5% - 1px)',
          width: '75%', height: 2,
          background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
          opacity: 0.25, zIndex: 0,
        }} className="ai-steps-line" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative', zIndex: 1 }}
          className="ai-steps-grid"
        >
          {STEPS.map(({ icon: Icon, num, title, desc }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5 }}
              style={{
                background: 'var(--card-float-bg)',
                border: '1px solid var(--card-float-border)',
                borderRadius: 20, padding: '28px 24px',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              {/* Step number + icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={22} color="#fff" />
                </div>
                <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--border)', letterSpacing: '-0.04em' }}>
                  {num}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, margin: 0 }}>
                {title}
              </h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    <style>{`
      @media(max-width:900px){
        .ai-steps-grid{grid-template-columns:1fr 1fr!important;}
        .ai-steps-line{display:none!important;}
      }
      @media(max-width:560px){
        .ai-steps-grid{grid-template-columns:1fr!important;}
      }
    `}</style>
  </section>
);

export default AIHowItWorks;
