import { useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Upload, FileText, Check, X, AlertCircle } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';
import FeatureGate from '../../../../components/FeatureGate/FeatureGate';
import useResumeFileValidation from '../../../../hooks/useResumeFileValidation';

const useCountUp = (target, inView, duration = 1.6) => {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  if (inView && !ran.current) {
    ran.current = true;
    const ctrl = animate(0, target, {
      duration, ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setVal(Math.round(v)),
    });
  }
  return val;
};

const ScoreRing = ({ score, inView }) => {
  const displayed = useCountUp(score, inView);
  const R = 50, C = 2 * Math.PI * R;
  const fraction = inView ? (displayed / 100) : 0;

  return (
    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={R} fill="transparent" stroke="var(--border)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={R} fill="transparent"
          stroke="url(#demo-ring-grad)" strokeWidth="9"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: inView ? C - fraction * C : C }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="demo-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--gradient-start)" />
            <stop offset="100%" stopColor="var(--gradient-end)" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{displayed}%</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Score</span>
      </div>
    </div>
  );
};

const AnimatedBar = ({ label, value, color, inView }) => {
  const displayed = useCountUp(value, inView);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{displayed}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: inView ? `${value}%` : 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', borderRadius: 999, background: color }}
        />
      </div>
    </div>
  );
};

const RSDemo = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Shared validation rules — same hook used by CandidateDashboard upload panel
  const { validateFile, fileError, clearFileError } = useResumeFileValidation();

  const handleFileSelect = (file) => {
    if (!file) return;
    if (validateFile(file)) {
      setUploadedFile(file);
    }
  };

  return (
    <section
      id="rs-demo"
      ref={ref}
      style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)', position: 'relative' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading
          eyebrow="Live Preview"
          title="See your results before you commit"
          gradientWord="results"
          subtitle="Drop any resume and instantly see how our AI scores it. Here's a sample of what you get."
        />

        <FeatureGate requiredRole="CANDIDATE">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'stretch',
          }}
          className="demo-grid"
        >
          {/* Upload zone */}
          <div
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
            onDragOver={e => e.preventDefault()}
            style={{
              border: `2px dashed ${dragging ? 'var(--primary)' : uploadedFile ? 'rgba(34,197,94,0.5)' : 'var(--card-float-border)'}`,
              borderRadius: 20,
              background: dragging ? 'var(--step-active-bg)' : 'var(--card-float-bg)',
              boxShadow: 'var(--card-float-shadow)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.25s', minHeight: 360,
            }}
          >
            <motion.div
              animate={{ scale: dragging ? 1.12 : 1 }}
              transition={{ duration: 0.2 }}
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'var(--step-active-bg)',
                border: '1px solid var(--step-active-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              }}
            >
              <Upload size={28} color="var(--primary)" />
            </motion.div>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {uploadedFile ? uploadedFile.name : 'Drop your resume here'}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              {uploadedFile
                ? `${(uploadedFile.size / 1024).toFixed(0)} KB · Ready to analyze`
                : 'PDF or DOCX, up to 5 MB\nAI parses and scores in under 10 seconds'}
            </p>
            {/* File validation error from shared hook */}
            {fileError && (
              <p style={{
                fontSize: 12, color: 'var(--danger)', marginBottom: 12,
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              }}>
                {fileError}
              </p>
            )}
            <motion.label
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 12,
                background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)',
                fontSize: 14, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer',
              }}
            >
              <FileText size={14} />
              {uploadedFile ? 'Replace File' : 'Browse Files'}
              <input
                type="file" accept=".pdf,.docx,.doc" style={{ display: 'none' }}
                onChange={(e) => { clearFileError(); handleFileSelect(e.target.files?.[0]); e.target.value = ''; }}
              />
            </motion.label>
            {uploadedFile && (
              <button
                onClick={() => { setUploadedFile(null); clearFileError(); }}
                style={{
                  marginTop: 10, fontSize: 12, color: 'var(--text-muted)', background: 'none',
                  border: 'none', cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                Remove
              </button>
            )}

            {/* File type row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
              {['PDF', 'DOCX', 'DOC'].map(fmt => (
                <span key={fmt} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 999,
                  background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)',
                  color: 'var(--text-muted)', fontWeight: 600,
                }}>
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Sample result panel */}
          <div style={{
            background: 'var(--card-float-bg)',
            border: '1px solid var(--card-float-border)',
            boxShadow: 'var(--card-float-shadow)',
            borderRadius: 20, padding: '28px 28px', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample Result</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Frontend Dev · Mid-Level</p>
              </div>
              <div style={{
                padding: '5px 14px', borderRadius: 999,
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                ✓ Highly Recommended
              </div>
            </div>

            {/* Score ring + bars */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
              <div style={{ flexShrink: 0 }}>
                <ScoreRing score={92} inView={inView} />
              </div>
              <div style={{ flex: 1 }}>
                <AnimatedBar label="Skills Match"  value={88} color="linear-gradient(90deg, var(--gradient-start), var(--gradient-end))" inView={inView} />
                <AnimatedBar label="Experience"    value={95} color="linear-gradient(90deg, var(--gradient-start), var(--gradient-end))" inView={inView} />
                <AnimatedBar label="Education"     value={80} color="linear-gradient(90deg, var(--gradient-start), var(--gradient-end))" inView={inView} />
                <AnimatedBar label="Projects"      value={85} color="linear-gradient(90deg, var(--gradient-start), var(--gradient-end))" inView={inView} />
              </div>
            </div>

            {/* Missing & Matched chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Missing Skills
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {['GraphQL', 'Redis', 'K8s'].map(s => (
                    <span key={s} style={{
                      fontSize: 11, padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)',
                      color: '#EF4444', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <X size={8} strokeWidth={3} />{s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Matched Skills
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {['React', 'TS', 'Node', 'Docker', 'Postgres'].map(s => (
                    <span key={s} style={{
                      fontSize: 11, padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(74,124,63,0.12)', border: '1px solid rgba(74,124,63,0.25)',
                      color: 'var(--success)', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <Check size={8} strokeWidth={3} />{s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI note */}
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 12,
              background: 'var(--step-active-bg)', border: '1px solid var(--step-active-border)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <AlertCircle size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--primary)' }}>AI Note:</strong> Strong React & backend fit. Missing cloud-native skills (K8s, Redis) — consider for a mid-level role if a learning curve is acceptable.
              </p>
            </div>
          </div>
        </motion.div>
        </FeatureGate>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .demo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default RSDemo;
