import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, CheckCircle2, XCircle, AlertCircle, Filter,
  ChevronDown, TrendingUp, ArrowRight, X,
} from 'lucide-react';
import { MOCK_SCREENINGS } from '../../mock/recruiter/screeningMock';
import { MOCK_JOBS } from '../../mock/recruiter/jobsMock';

/* ─── Config ─────────────────────────────────────────────────── */
const REC_CFG = {
  STRONG_YES: { icon: CheckCircle2, color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.30)',  label: 'Strong Yes' },
  YES:        { icon: CheckCircle2, color: '#3D5016',  bg: 'rgba(61,80,22,0.12)',   border: 'rgba(61,80,22,0.30)',   label: 'Yes' },
  MAYBE:      { icon: AlertCircle,  color: '#f59e0b',  bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)', label: 'Maybe' },
  NO:         { icon: XCircle,      color: '#ef4444',  bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)',  label: 'No' },
};

const FILTER_TABS = [
  { key: 'ALL',        label: 'All' },
  { key: 'STRONG_YES', label: 'Strong Yes' },
  { key: 'YES',        label: 'Yes' },
  { key: 'MAYBE',      label: 'Maybe' },
  { key: 'NO',         label: 'No' },
];

const scoreColor  = (v) => v >= 80 ? '#34d399' : v >= 60 ? '#f59e0b' : '#ef4444';
const formatDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const RecBadge = ({ rec }) => {
  const c = REC_CFG[rec] ?? REC_CFG.MAYBE;
  const Icon = c.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}`, flexShrink: 0 }}>
      <Icon size={12} />{c.label}
    </span>
  );
};

/* ════════════════════════════════════════════════════════════════
   RESUME SCREENING PAGE
════════════════════════════════════════════════════════════════ */
const RecruiterResumeScreeningPage = () => {
  const [jobFilter, setJobFilter] = useState('ALL');
  const [recFilter, setRecFilter] = useState('ALL');
  const screenings = MOCK_SCREENINGS;
  const jobs = MOCK_JOBS;

  const filtered = screenings.filter((s) => {
    const mj = jobFilter === 'ALL' || s.jobId === jobFilter;
    const mr = recFilter === 'ALL' || s.recommendation === recFilter;
    return mj && mr;
  });

  const counts = {
    STRONG_YES: screenings.filter(s => s.recommendation === 'STRONG_YES').length,
    YES:        screenings.filter(s => s.recommendation === 'YES').length,
    MAYBE:      screenings.filter(s => s.recommendation === 'MAYBE').length,
    NO:         screenings.filter(s => s.recommendation === 'NO').length,
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: '32px 36px 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <FileSearch size={11} /> AI Resume Screener
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Resume Screening</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>{screenings.length} resumes screened recently</p>
              </div>

              {/* Summary chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'STRONG_YES', label: 'Strong Yes', count: counts.STRONG_YES, color: '#34d399' },
                  { key: 'YES',        label: 'Yes',        count: counts.YES,        color: '#a3e635' },
                  { key: 'MAYBE',      label: 'Maybe',      count: counts.MAYBE,      color: '#f59e0b' },
                  { key: 'NO',         label: 'No',         count: counts.NO,         color: '#ef4444' },
                ].map(({ key, label, count, color }) => (
                  <div key={key} style={{ padding: '8px 14px', borderRadius: 12, background: `${color}14`, border: `1px solid ${color}22`, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color }}>{count}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingBottom: 0, paddingTop: 8 }}>
            {/* Job filter */}
            <div style={{ position: 'relative', display: 'inline-flex', marginRight: 4 }}>
              <Filter size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(163,230,53,0.6)', pointerEvents: 'none' }} />
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(163,230,53,0.6)', pointerEvents: 'none' }} />
              <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} id="screening-job-filter"
                style={{ appearance: 'none', paddingLeft: 32, paddingRight: 32, paddingTop: 9, paddingBottom: 9, borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(107,138,58,0.30)', color: '#fff', outline: 'none' }}
              >
                <option value="ALL" style={{ background: '#18280a' }}>All Jobs</option>
                {jobs.map((j) => <option key={j.id} value={j.id} style={{ background: '#18280a' }}>{j.title}</option>)}
              </select>
            </div>

            {/* Rec filter tabs */}
            <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(107,138,58,0.20)' }}>
              {FILTER_TABS.map(({ key, label }) => {
                const cfg = REC_CFG[key];
                const active = recFilter === key;
                return (
                  <button key={key} onClick={() => setRecFilter(key)} id={`screening-rec-${key.toLowerCase()}`}
                    style={{
                      padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                      background: active ? (cfg?.color ?? '#fff') : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab underline filler */}
          <div style={{ height: 24 }} />
        </div>
      </div>

      {/* ── Cards list ────────────────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <FileSearch size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No results match your filters</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting the job or recommendation filter.</p>
          </div>
        ) : (
          filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] }}
              style={{
                padding: '20px 24px', borderRadius: 20,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'all 0.18s ease', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>

                {/* Avatar */}
                <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800, boxShadow: '0 3px 10px rgba(61,80,22,0.35)', marginTop: 2 }}>
                  {s.candidateName.charAt(0)}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{s.candidateName}</p>
                    <RecBadge rec={s.recommendation} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Applied: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{s.jobTitle}</span></p>

                  {/* Skill tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {s.matchedSkills.map((sk) => (
                      <span key={sk} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.20)' }}>
                        ✓ {sk}
                      </span>
                    ))}
                    {s.missingSkills.map((sk) => (
                      <span key={sk} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)' }}>
                        ✗ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scores */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 30, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.05em', lineHeight: 1 }}>{s.resumeScore}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>Overall</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 30, fontWeight: 900, color: scoreColor(s.skillsMatchPercent), letterSpacing: '-0.05em', lineHeight: 1 }}>{s.skillsMatchPercent}%</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>Skills match</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{formatDate(s.screenedAt)}</p>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecruiterResumeScreeningPage;
