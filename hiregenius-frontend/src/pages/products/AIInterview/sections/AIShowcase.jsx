import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, BarChart2, AlertCircle } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const QUESTIONS = [
  { num: 'Q1', text: 'Describe your experience with distributed systems and consistency models.' },
  { num: 'Q2', text: 'How would you approach debugging a race condition in a concurrent Node.js service?' },
  { num: 'Q3', text: 'Walk me through the trade-offs between REST and GraphQL for a data-heavy SaaS dashboard.' },
  { num: 'Q4', text: 'Explain how you have handled database migrations in a live production environment.' },
  { num: 'Q5', text: 'Describe a time you had to push back on a product requirement. How did you communicate it?' },
];

const SCORES = [
  { label: 'Communication',    value: 84, width: '84%' },
  { label: 'Confidence',       value: 79, width: '79%' },
  { label: 'Technical Depth',  value: 93, width: '93%' },
];

const AIShowcase = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="Sample Result"
        title="The full interview result, at a glance"
        gradientWord="full interview result"
        subtitle="This is what your recruiter dashboard shows after an AI interview completes — question list, per-question notes, final scores, and recommendation."
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: 28,
          padding: 3,
          background: 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 50%, rgba(61,80,22,0.3) 100%)',
          boxShadow: '0 0 80px rgba(61,80,22,0.20)',
        }}
      >
        {/* Browser chrome bar */}
        <div style={{
          background: 'var(--bg-elevated)',
          borderTopLeftRadius: 26, borderTopRightRadius: 26,
          padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#fb7185','#fbbf24','var(--success)'].map((c, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, height: 26, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 11, color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto' }}>
            app.hiregenius.ai/recruiter/interviews/ravi-kumar
          </div>
        </div>

        {/* Dashboard content */}
        <div style={{ background: 'var(--bg-base)', borderBottomLeftRadius: 26, borderBottomRightRadius: 26, padding: '28px 28px' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>AI Interview Result</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Ravi Kumar — Backend Engineer</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>Completed · 5 questions · Evaluated in 24 seconds</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', borderRadius: 12, padding: '8px 20px', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                ✓ Highly Recommended
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall: 87%</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }} className="ai-showcase-grid">
            {/* Question list */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Questions & AI Notes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {QUESTIONS.map((q, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '12px 14px',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--step-active-bg)', border: '1px solid var(--step-active-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--primary)' }}>
                      {q.num}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 5px' }}>{q.text}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--success)' }}>
                        <CheckCircle2 size={10} />
                        Answered · AI scored
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score Breakdown</div>
              {SCORES.map(({ label, value, width }, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{value}%</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: 'var(--border)' }}>
                    <div style={{ width, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))' }} />
                  </div>
                </div>
              ))}

              {/* AI note box */}
              <div style={{ marginTop: 4, padding: '14px', borderRadius: 14, background: 'var(--step-active-bg)', border: '1px solid var(--step-active-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                  <MessageSquare size={11} /> AI Summary
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Ravi demonstrated deep systems knowledge and structured communication. Technical answers were precise and showed practical experience. Communication was clear and professional throughout.
                </p>
              </div>

              {/* Recruiter action buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center', cursor: 'pointer' }}>
                  Schedule Final Round
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertCircle size={12} />
                  Flag for Review
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
    <style>{`@media(max-width:900px){.ai-showcase-grid{grid-template-columns:1fr!important;}}`}</style>
  </section>
);

export default AIShowcase;
