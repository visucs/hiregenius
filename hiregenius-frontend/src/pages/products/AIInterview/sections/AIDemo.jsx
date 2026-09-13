import { useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { MessageSquare, User, AlertCircle } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';
import FeatureGate from '../../../../components/FeatureGate/FeatureGate';

const useCountUp = (target, inView, duration = 1.6) => {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  if (inView && !ran.current) {
    ran.current = true;
    animate(0, target, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: v => setVal(Math.round(v)) });
  }
  return val;
};

const AnimatedBar = ({ label, value, inView }) => {
  const displayed = useCountUp(value, inView);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{displayed}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${value}%` : 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))' }}
        />
      </div>
    </div>
  );
};

const AIDemo = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="ai-demo" ref={ref} style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)', position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading
          eyebrow="Live Preview"
          title="See an interview in action"
          gradientWord="interview"
          subtitle="Watch the AI ask a technical question, evaluate the answer, and return scored results in under 30 seconds."
        />
        <FeatureGate requiredRole="CANDIDATE">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'stretch' }}
          className="ai-demo-grid"
        >
          {/* Chat panel */}
          <div style={{ background: 'var(--card-float-bg)', border: '1px solid var(--card-float-border)', boxShadow: 'var(--card-float-shadow)', borderRadius: 20, padding: '28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interview Session</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>Ravi Kumar — Backend Engineer</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--success)', background: 'rgba(74,124,63,0.12)', padding: '4px 10px', borderRadius: 999 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                In Progress
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question 3 of 5</div>

            {/* AI question bubble */}
            {[
              { role: 'ai', text: `Explain the trade-offs between REST and GraphQL for a data-heavy SaaS dashboard. Which would you choose and why?` },
              { role: 'candidate', text: `REST is simpler, but leads to over-fetching. GraphQL solves this with precise field selection — especially valuable in dashboards. The added backend complexity is worth it for dashboards with many data views.` },
            ].map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.25, duration: 0.4 }}
                style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'candidate' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: msg.role === 'ai' ? 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))' : 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {msg.role === 'ai' ? <MessageSquare size={14} color="#fff" /> : <User size={14} color="var(--text-secondary)" />}
                </div>
                <div style={{ maxWidth: '80%', background: msg.role === 'ai' ? 'var(--step-active-bg)' : 'var(--card-row-bg)', border: `1px solid ${msg.role === 'ai' ? 'var(--step-active-border)' : 'var(--card-row-border)'}`, borderRadius: 14, padding: '11px 14px' }}>
                  <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>{msg.text}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>{msg.role === 'ai' ? 'HireGenius AI' : 'Ravi Kumar'}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Result panel */}
          <div style={{ background: 'var(--card-float-bg)', border: '1px solid var(--card-float-border)', boxShadow: 'var(--card-float-shadow)', borderRadius: 20, padding: '28px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>AI Evaluation</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Response Score Breakdown</p>
            <AnimatedBar label="Communication"   value={84} inView={inView} />
            <AnimatedBar label="Confidence"      value={79} inView={inView} />
            <AnimatedBar label="Technical Depth" value={93} inView={inView} />
            <div style={{ marginTop: 8, padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(61,80,22,0.10), rgba(107,138,58,0.07))', border: '1px solid var(--step-active-border)', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                ✓ Highly Recommended
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                Strong technical depth on REST vs GraphQL. Clear, structured reasoning and confident delivery.
              </p>
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'var(--step-active-bg)', border: '1px solid var(--step-active-border)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                <strong style={{ color: 'var(--primary)' }}>AI Note:</strong> Demonstrates senior-level systems design thinking. Recommend progressing to technical panel.
              </p>
            </div>
          </div>
        </motion.div>
        </FeatureGate>
      </div>
      <style>{`@media(max-width:900px){.ai-demo-grid{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
};

export default AIDemo;
