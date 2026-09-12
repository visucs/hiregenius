import { motion } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const RSShowcase = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="Sample Result"
        title="What a complete screening report looks like"
        gradientWord="complete screening report"
        subtitle="A real recruiter sees this inside HireGenius AI — rich, actionable, and immediately shareable."
      />

      {/* Outer glow frame */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative' }}
      >
        {/* Glow */}
        <div style={{
          position: 'absolute', inset: -2,
          borderRadius: 28,
          background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
          opacity: 0.18, filter: 'blur(16px)', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 26,
          border: '1.5px solid',
          borderImage: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end)) 1',
          opacity: 0.35, zIndex: 0, pointerEvents: 'none',
        }} />

        {/* Card */}
        <div style={{
          position: 'relative', zIndex: 1,
          background: 'var(--card-float-bg)',
          border: '1px solid var(--card-float-border)',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        }}>
          {/* Topbar */}
          <div style={{
            padding: '14px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--bg-elevated)',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#fb7185','#fbbf24','var(--success)'].map((c,i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <div style={{
              flex: 1, height: 28, borderRadius: 8,
              background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
              display: 'flex', alignItems: 'center', paddingLeft: 12,
              fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace',
            }}>
              app.hiregenius.ai/recruiter/resume-screening/result/a7c3f9
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }} className="showcase-content">
            {/* Left: Score panel */}
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 16, padding: 24,
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}>
              {/* Big score ring */}
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="70" cy="70" r="58" fill="transparent" stroke="var(--border)" strokeWidth="10" />
                  <circle cx="70" cy="70" r="58" fill="transparent"
                    stroke="url(#showcase-ring)" strokeWidth="11"
                    strokeDasharray={364} strokeDashoffset={364 - 0.92 * 364}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="showcase-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--gradient-start)" />
                      <stop offset="100%" stopColor="var(--gradient-end)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>92%</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>RESUME SCORE</span>
                </div>
              </div>

              {/* Verdict badge */}
              <div style={{
                width: '100%', textAlign: 'center', padding: '10px 16px', borderRadius: 12,
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.02em',
              }}>
                ✓ Highly Recommended
              </div>

              {/* Mini stats */}
              {[
                { label: 'Skills Match',  value: '88%' },
                { label: 'Experience',    value: '4 yrs' },
                { label: 'Education',     value: "B.Tech CS" },
                { label: 'Certs',         value: 'AWS SAA' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 10,
                  background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
                  fontSize: 12,
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Right: Full breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Candidate header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                  alt="Arjun Mehta"
                  style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Arjun Mehta</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Full Stack Developer · Mumbai, India</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Scored 8.2s ago</div>
              </div>

              {/* Bars */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 14, padding: 20, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score Breakdown</p>
                {[
                  { label: 'Skills Match',    value: 88 },
                  { label: 'Work Experience', value: 95 },
                  { label: 'Education',       value: 80 },
                  { label: 'Projects',        value: 85 },
                  { label: 'Certifications',  value: 70 },
                ].map((bar) => (
                  <div key={bar.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{bar.label}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{bar.value}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'var(--border)' }}>
                      <div style={{
                        height: '100%', width: `${bar.value}%`, borderRadius: 999,
                        background: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Matched / Missing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  {
                    title: 'Matched Skills', color: 'var(--success)',
                    bg: 'rgba(74,124,63,0.10)', border: 'rgba(74,124,63,0.22)',
                    icon: <Check size={10} strokeWidth={3} />,
                    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'REST APIs'],
                  },
                  {
                    title: 'Missing Skills', color: '#EF4444',
                    bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.18)',
                    icon: <X size={10} strokeWidth={3} />,
                    skills: ['GraphQL', 'Kubernetes', 'Redis'],
                  },
                ].map(({ title, color, bg, border, icon, skills }) => (
                  <div key={title} style={{
                    background: 'var(--bg-elevated)', borderRadius: 14, padding: 16,
                    border: '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {skills.map(s => (
                        <span key={s} style={{
                          fontSize: 11, padding: '3px 9px', borderRadius: 999,
                          background: bg, border: `1px solid ${border}`,
                          color, fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          {icon}{s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Rationale */}
              <div style={{
                padding: '14px 18px', borderRadius: 14,
                background: 'var(--step-active-bg)', border: '1px solid var(--step-active-border)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <AlertCircle size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>AI Rationale</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                    Arjun demonstrates strong React and Node.js proficiency backed by 4 years of experience. Education and project portfolio align well with the role. The absence of Kubernetes and Redis is notable but represents a trainable skill gap — overall recommendation is <strong style={{ color: 'var(--text-primary)' }}>Highly Recommended</strong> for a mid-to-senior Full Stack opening.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>

    <style>{`
      @media (max-width: 860px) {
        .showcase-content { grid-template-columns: 1fr !important; }
      }
    `}</style>
  </section>
);

export default RSShowcase;
