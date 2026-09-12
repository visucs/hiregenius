import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const FAQS = [
  {
    q: `What file formats does HireGenius AI accept for resume uploads?`,
    a: `We currently support PDF and DOCX files up to 5 MB in size. PDF is recommended for best parsing accuracy as it preserves formatting. DOC (older Word format) is also supported but may occasionally lose complex formatting during extraction. We plan to support plain-text and HTML resumes in a future release.`,
  },
  {
    q: `How does the AI calculate the resume score?`,
    a: `The score is a weighted composite of five dimensions: Skills Match (40%), Work Experience Relevance (25%), Education (15%), Projects (12%), and Certifications (8%). The weights reflect typical recruiter priorities for technical roles and are calibrated against our training dataset. The ML model computes a final 0–100% score, which maps to three recommendation tiers: Highly Recommended (80–100), Consider (55–79), and Not a Fit (below 55).`,
  },
  {
    q: `How accurate is the AI resume scoring?`,
    a: `In internal benchmarks against recruiter-reviewed datasets, HireGenius AI achieves ~92% agreement with senior recruiter shortlisting decisions. Accuracy varies by role type: it is highest for structured technical roles (software engineering, data science) and slightly lower for creative or senior leadership roles where soft skills dominate. We recommend treating the score as a first-pass filter, with human review always in the loop for final decisions.`,
  },
  {
    q: `Is my candidates' resume data stored securely?`,
    a: `Yes. Resume files are encrypted at rest (AES-256) and in transit (TLS 1.3). Parsed JSON data is stored in a private MongoDB instance with role-based access control — only your organisation's recruiters and admins can view it. We do not share candidate data across organisations, use it for cross-customer model training, or expose it to third parties. Candidates can request data deletion at any time under our data retention policy.`,
  },
  {
    q: `Can I customise the skill weights for my specific job requirements?`,
    a: `Currently the scoring weights are standardised for technical roles. Per-job custom weight configuration — where you specify that a particular skill or certification is a hard requirement — is on our roadmap for Q3. In the meantime, recruiters can use the Missing Skills list to manually apply filters when a specific skill is non-negotiable.`,
  },
  {
    q: `How long does it take to screen a resume?`,
    a: `The end-to-end pipeline — upload, parse, score, store — completes in under 10 seconds for a typical 2-page resume. Parsing time scales slightly with document complexity and length. Batch processing (screening an entire applicant pool for a job) is supported: 100 resumes are typically processed in under 15 minutes running on our standard infrastructure.`,
  },
];

const FAQItem = ({ q, a, isOpen, toggle }) => (
  <div
    style={{
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
    }}
  >
    <button
      onClick={toggle}
      style={{
        width: '100%', textAlign: 'left', padding: '20px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer', gap: 16,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {q}
      </span>
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
          <p style={{
            fontSize: 14.5, lineHeight: 1.75, color: 'var(--text-secondary)',
            paddingBottom: 20, margin: 0,
          }}>
            {a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const RSFAQ = () => {
  const [open, setOpen] = useState(0);

  return (
    <section id="rs-faq" style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <SectionHeading
          eyebrow="FAQ"
          title="Questions about Resume Screening"
          gradientWord="Resume Screening"
          subtitle="Everything you need to know before you start."
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
          }}
        >
          {FAQS.map((item, i) => (
            <FAQItem
              key={i}
              q={item.q}
              a={item.a}
              isOpen={open === i}
              toggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default RSFAQ;
