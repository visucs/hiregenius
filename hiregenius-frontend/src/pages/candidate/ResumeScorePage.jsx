import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Sparkles, CheckCircle2, XCircle, RotateCcw,
  ArrowRight, Award, BookOpen, Briefcase, Lightbulb,
  TrendingUp, Star, Zap, FileText, ChevronRight,
} from 'lucide-react';
import { MOCK_LATEST_RESUME_SCORE } from '../../mock/candidate/candidateMock';
import { Link } from 'react-router-dom';

/* ─── Score ring ──────────────────────────────────────────── */
const ScoreRing = ({ score }) => {
  const R = 52, C = 2 * Math.PI * R;
  const sc = score >= 85 ? '#34d399' : score >= 70 ? '#6B8A3A' : score >= 50 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#3D5016" />
            <stop offset="100%" stopColor={sc}      />
          </linearGradient>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="65" cy="65" r={R} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
        {/* Fill */}
        <motion.circle cx="65" cy="65" r={R} fill="transparent"
          stroke="url(#ring-grad)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (score / 100) * C }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          filter="url(#ring-glow)"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.4 }}
          style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1 }}
        >{score}%</motion.span>
        <span style={{ fontSize: 9, color: 'rgba(190,220,140,0.60)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', marginTop: 3 }}>Score</span>
      </div>
    </div>
  );
};

/* ─── Recommendation config ───────────────────────────────── */
const recStyle = rec => {
  if (rec?.toLowerCase().includes('highly') || rec?.toLowerCase().includes('recommend'))
    return { bg: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', shadow: '0 4px 18px rgba(61,80,22,0.50)' };
  if (rec?.toLowerCase().includes('consider'))
    return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.30)' };
  return { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.28)' };
};

/* ─── Summary row ─────────────────────────────────────────── */
const SummaryRow = ({ icon: Icon, iconColor, label, value }) => (
  <div style={{ display: 'flex', gap: 13, padding: '13px 0', borderBottom: '1px solid var(--card-row-border)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={14} style={{ color: iconColor }} />
    </div>
    <div>
      <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: iconColor, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{value}</p>
    </div>
  </div>
);

/* ─── Impact badge ────────────────────────────────────────── */
const ImpactBadge = ({ impact }) => {
  const cfg = impact === 'High'
    ? { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.28)' }
    : impact === 'Medium'
    ? { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.28)' }
    : { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', border: 'rgba(74,222,128,0.28)' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
      {impact} Impact
    </span>
  );
};

/* ─── Card wrapper ────────────────────────────────────────── */
const Card = ({ stripe, children, delay = 0, style = {} }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', ...style }}
  >
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    {children}
  </motion.div>
);

/* ════════════════════════════════════════════════════════════
   RESUME SCORE PAGE
════════════════════════════════════════════════════════════ */
const ResumeScorePage = () => {
  const [loading, setLoading]     = useState(true);
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setResumeData(MOCK_LATEST_RESUME_SCORE); setLoading(false); }, 300);
    return () => clearTimeout(t);
  }, []);

  const rc = resumeData ? recStyle(resumeData.recommendation) : null;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Olive/Forest Hero ─────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: '32px 36px 36px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <Target size={11} /> My Career
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Resume Score</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>Your latest AI analysis and improvement suggestions.</p>
              </div>

              {/* Re-scan CTA */}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                <Link to="/candidate/scan-history"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 13, background: 'rgba(107,138,58,0.22)', border: '1px solid rgba(107,138,58,0.40)', color: '#c6e085', fontSize: 13, fontWeight: 800, textDecoration: 'none', backdropFilter: 'blur(10px)', letterSpacing: '-0.01em', transition: 'all 0.15s' }}
                >
                  <RotateCcw size={14} /> Re-scan with a new job description
                </Link>
              </motion.div>
            </div>

            {/* Hero score band (inside hero) */}
            {!loading && resumeData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '24px 28px', borderRadius: 22, background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 32px rgba(0,0,0,0.20)', flexWrap: 'wrap' }}>
                <ScoreRing score={resumeData.score} />

                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(190,220,140,0.60)', marginBottom: 8 }}>
                    Latest Analysis · {resumeData.scanDate}
                  </p>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>{resumeData.jobTitle}</h2>
                  <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.55)', marginBottom: 16 }}>Target: {resumeData.targetCompany}</p>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Recommendation */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 12, background: rc?.bg, color: rc?.color, fontSize: 13, fontWeight: 800, border: rc?.border ?? 'none', boxShadow: rc?.shadow ?? 'none', letterSpacing: '-0.01em' }}>
                      <Award size={14} /> ✓ {resumeData.recommendation}
                    </span>

                    {/* Skills match */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.80)', fontSize: 13, fontWeight: 700 }}>
                      <Star size={13} style={{ color: '#a3e635' }} /> Skills Match: <strong style={{ color: '#a3e635' }}>{resumeData.skillsMatch}%</strong>
                    </span>
                  </div>
                </div>

                {/* Score breakdown mini stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  {[
                    { label: 'ATS Score',     value: resumeData.score,        color: '#a3e635' },
                    { label: 'Skills Match',  value: resumeData.skillsMatch,  color: '#34d399' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '10px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', minWidth: 90 }}>
                      <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.05em', lineHeight: 1 }}>{value}%</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 5 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state in hero */}
            {loading && (
              <div style={{ height: 130, borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)', animation: 'shimmer 1.4s infinite' }} />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      {!loading && resumeData && (
        <div style={{ padding: '24px 36px 60px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Skills grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>

            {/* Matched Skills */}
            <Card stripe="linear-gradient(90deg, #3D5016, #6B8A3A)" delay={0.06}>
              <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} style={{ color: '#34d399' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Matched Skills</p>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}>{resumeData.matchedSkills.length} matched</span>
              </div>
              <div style={{ padding: '16px 22px 22px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {resumeData.matchedSkills.map((s, i) => (
                  <motion.span key={s} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 + i * 0.04 }}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.24)', color: '#34d399', fontWeight: 700 }}
                  >✓ {s}</motion.span>
                ))}
              </div>
            </Card>

            {/* Missing Skills */}
            <Card stripe="linear-gradient(90deg, #7f1d1d, #ef4444)" delay={0.10}>
              <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={16} style={{ color: '#f87171' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Missing Skills</p>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(248,113,113,0.10)', color: '#f87171', border: '1px solid rgba(248,113,113,0.22)' }}>{resumeData.missingSkills.length} gaps</span>
              </div>
              <div style={{ padding: '16px 22px 22px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {resumeData.missingSkills.map((s, i) => (
                  <motion.span key={s} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.10 + i * 0.04 }}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.24)', color: '#f87171', fontWeight: 700 }}
                  >✕ {s}</motion.span>
                ))}
              </div>
            </Card>
          </div>

          {/* Extracted Summary */}
          <Card stripe="linear-gradient(90deg, #1e3a5f, #3b82f6)" delay={0.14}>
            <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} style={{ color: '#60a5fa' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Extracted Summary</p>
            </div>
            <div style={{ padding: '8px 22px 22px' }}>
              <SummaryRow icon={Briefcase} iconColor="#60a5fa"  label="Experience"    value={resumeData.extractedSummary.experience}    />
              <SummaryRow icon={BookOpen}  iconColor="#a78bfa"  label="Education"     value={resumeData.extractedSummary.education}     />
              <SummaryRow icon={TrendingUp} iconColor="#34d399" label="Projects"      value={resumeData.extractedSummary.projects}      />
              <div style={{ display: 'flex', gap: 13, padding: '13px 0' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award size={14} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f59e0b', marginBottom: 4 }}>Certifications</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{resumeData.extractedSummary.certifications}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Suggestions */}
          <Card stripe="linear-gradient(90deg, #1c1917, #f59e0b)" delay={0.18}>
            <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={16} style={{ color: '#fbbf24' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>AI Concrete Suggestions</p>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(251,191,36,0.10)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.22)' }}>{resumeData.suggestions.length} items</span>
            </div>
            <div style={{ padding: '14px 22px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resumeData.suggestions.map((s, i) => (
                <motion.div key={s.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.20 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', alignItems: 'flex-start', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(107,138,58,0.30)'; e.currentTarget.style.background = 'rgba(107,138,58,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.background = 'var(--card-row-bg)'; }}
                >
                  <ImpactBadge impact={s.impact} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 4 }}>{s.category}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.text}</p>
                  </div>
                  <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Bottom CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 18, background: 'rgba(107,138,58,0.07)', border: '1px solid rgba(107,138,58,0.20)' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(61,80,22,0.40)', flexShrink: 0 }}>
              <Zap size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 3 }}>Ready to improve your score?</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Run a fresh scan against any job description to get an updated AI analysis.</p>
            </div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/candidate/scan-history"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 13, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 18px rgba(61,80,22,0.45)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}
              >Run New Scan <ArrowRight size={14} /></Link>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !resumeData && (
        <div style={{ padding: '60px 36px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(107,138,58,0.12)', border: '1px solid rgba(107,138,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Target size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>No Resume Scanned Yet</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.65 }}>
            Run your first AI resume check against any target job description to get instant scoring.
          </p>
          <Link to="/candidate/scan-history"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 13, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 18px rgba(61,80,22,0.45)' }}
          >Run First Scan <ArrowRight size={15} /></Link>
        </div>
      )}

      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>
    </div>
  );
};

export default ResumeScorePage;
