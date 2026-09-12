import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Plus, Search, Calendar, Building2, ChevronRight,
  X, Target, Sparkles, CheckCircle2, XCircle, Star,
  Award, Lightbulb, FileText, TrendingUp, Zap, RotateCcw,
} from 'lucide-react';
import { MOCK_SCAN_HISTORY } from '../../mock/candidate/candidateMock';

/* ─── Score color ─────────────────────────────────────────── */
const scoreColor = s => s >= 85 ? '#34d399' : s >= 70 ? '#6B8A3A' : s >= 50 ? '#f59e0b' : '#f87171';
const scoreGrad  = s => s >= 70 ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : s >= 50 ? 'linear-gradient(135deg, #78350f, #f59e0b)' : 'linear-gradient(135deg, #7f1d1d, #f87171)';

/* ─── Recommendation badge ────────────────────────────────── */
const RecBadge = ({ rec }) => {
  const up = (rec ?? '').toUpperCase();
  const cfg = up.includes('RECOMMEND')
    ? { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.28)',  label: `✓ ${rec}` }
    : up.includes('CONSIDER')
    ? { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.28)',  label: `≈ ${rec}` }
    : { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.28)', label: `✕ ${rec}` };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
      {cfg.label}
    </span>
  );
};

/* ─── Input style ─────────────────────────────────────────── */
const IS = { width: '100%', padding: '11px 14px', borderRadius: 13, fontSize: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

/* ─── Label ───────────────────────────────────────────────── */
const Label = ({ children, required }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 7 }}>
    {children}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
  </label>
);

/* ════════════════════════════════════════════════════════════
   SCAN HISTORY PAGE
════════════════════════════════════════════════════════════ */
const ScanHistoryPage = () => {
  const [loading, setLoading]               = useState(true);
  const [scans, setScans]                   = useState([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedScan, setSelectedScan]     = useState(null);
  const [newScanOpen, setNewScanOpen]       = useState(false);
  const [newScanTitle, setNewScanTitle]     = useState('');
  const [newScanCompany, setNewScanCompany] = useState('');
  const [newScanJd, setNewScanJd]           = useState('');
  const [isScanning, setIsScanning]         = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setScans(MOCK_SCAN_HISTORY); setLoading(false); }, 300);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() =>
    scans.filter(s =>
      s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.company.toLowerCase().includes(searchQuery.toLowerCase())
    ), [scans, searchQuery]);

  const handleRunNewScan = e => {
    e.preventDefault();
    if (!newScanTitle) return;
    setIsScanning(true);
    setTimeout(() => {
      const generated = {
        id: `scan-${Date.now()}`,
        scanDate: 'Just Now',
        jobTitle: newScanTitle,
        company: newScanCompany || 'Target Company',
        score: Math.floor(Math.random() * 20) + 80,
        skillsMatch: Math.floor(Math.random() * 18) + 82,
        recommendation: 'RECOMMENDED',
        matchedSkills: ['React', 'TypeScript', 'Node.js', 'System Architecture'],
        missingSkills: ['Kubernetes', 'GraphQL'],
        extractedSummary: {
          experience: '5+ years relevant tech stack experience.',
          education: 'B.S. Computer Science',
          projects: 'Production web software applications',
          certifications: 'Cloud Professional',
        },
        suggestions: [{ id: '1', category: 'Keywords', text: 'Quantify metrics in your latest project role.', impact: 'High' }],
      };
      setScans(prev => [generated, ...prev]);
      setIsScanning(false);
      setNewScanOpen(false);
      setNewScanTitle(''); setNewScanCompany(''); setNewScanJd('');
      setSelectedScan(generated);
    }, 1200);
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Olive/Forest Hero ─────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)', padding: '32px 36px 36px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <History size={11} /> My Career
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Scan History</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>Every resume check you've run and historical scorecards.</p>
              </div>

              {/* Quick stat chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start', paddingTop: 4 }}>
                {[
                  { label: 'Total Scans', value: scans.length, color: '#fff' },
                  { label: 'Avg Score',   value: scans.length ? `${Math.round(scans.reduce((a,b) => a + b.score, 0) / scans.length)}%` : '—', color: '#a3e635' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', gap: 7, alignItems: 'center' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color }}>{value}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>{label}</span>
                  </div>
                ))}

                {/* New Scan CTA */}
                <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setNewScanOpen(true)}
                  id="scan-history-new-scan-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 13, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: '0 4px 18px rgba(61,80,22,0.55)', letterSpacing: '-0.01em' }}
                >
                  <Plus size={16} strokeWidth={2.5} /> New Scan
                </motion.button>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', marginTop: 22, maxWidth: 360 }}>
              <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.40)', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search scans by job or company…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(107,138,58,0.30)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Loading skeleton */}
        {loading && [1,2,3].map(i => (
          <div key={i} style={{ height: 82, borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)', animation: 'shimmer 1.4s infinite' }} />
          </div>
        ))}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '60px 32px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20 }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(107,138,58,0.12)', border: '1px solid rgba(107,138,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <History size={26} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              {searchQuery ? 'No scans match your query' : "You haven't run any scans yet"}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.65 }}>
              {searchQuery ? 'Try a different job title or company name.' : 'Paste a target job description and run your first instant AI resume analysis.'}
            </p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setNewScanOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 13, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(61,80,22,0.45)' }}
            ><Plus size={16} /> Run New Scan</motion.button>
          </motion.div>
        )}

        {/* Scan rows */}
        {!loading && filtered.length > 0 && filtered.map((scan, i) => {
          const sc = scoreColor(scan.score);
          const sg = scoreGrad(scan.score);
          return (
            <motion.div key={scan.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setSelectedScan(scan)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '18px 22px', borderRadius: 18, background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', overflow: 'hidden', position: 'relative', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.18s ease', flexWrap: 'wrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
            >
              {/* Score tile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 220 }}>
                <div style={{ width: 52, height: 52, borderRadius: 15, background: sg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${sc}35` }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{scan.score}%</span>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 4 }}>{scan.jobTitle}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                    <Building2 size={11} />{scan.company}
                    <span style={{ opacity: 0.5 }}>·</span>
                    <Calendar size={11} />Scanned on {scan.scanDate}
                  </p>
                </div>
              </div>

              {/* Right: skills match + recommendation + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Skills Match: <strong style={{ color: scoreColor(scan.skillsMatch), fontWeight: 800 }}>{scan.skillsMatch}%</strong>
                </span>
                <RecBadge rec={scan.recommendation} />
                <ChevronRight size={17} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Detail Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedScan && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
              onClick={() => setSelectedScan(null)}
            />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24, boxShadow: '0 32px 96px rgba(0,0,0,0.40)', pointerEvents: 'auto' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '24px 24px 0 0' }} />

                {/* Sticky header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, padding: '20px 24px 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: scoreGrad(selectedScan.score), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${scoreColor(selectedScan.score)}40` }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{selectedScan.score}%</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 3 }}>Historical Scan · {selectedScan.scanDate}</p>
                      <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>{selectedScan.jobTitle}</h2>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target: {selectedScan.company}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedScan(null)}
                    style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}
                  ><X size={16} /></button>
                </div>

                <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Overall Score',  value: `${selectedScan.score}%`,        color: scoreColor(selectedScan.score) },
                      { label: 'Skills Match',   value: `${selectedScan.skillsMatch}%`,  color: scoreColor(selectedScan.skillsMatch) },
                      { label: 'Recommendation', value: selectedScan.recommendation,     color: '#34d399' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', textAlign: 'center' }}>
                        <p style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{value}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Matched Skills */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 10 }}>Matched Skills</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {selectedScan.matchedSkills.map(s => (
                        <span key={s} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.24)', color: '#34d399', fontWeight: 700 }}>✓ {s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 10 }}>Missing Skills</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {selectedScan.missingSkills.map(s => (
                        <span key={s} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.24)', color: '#f87171', fontWeight: 700 }}>✕ {s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions (if present) */}
                  {selectedScan.suggestions?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Lightbulb size={12} style={{ color: '#fbbf24' }} /> AI Suggestions
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedScan.suggestions.map(s => (
                          <div key={s.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', alignItems: 'flex-start' }}>
                            <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: s.impact === 'High' ? 'rgba(248,113,113,0.12)' : 'rgba(245,158,11,0.12)', color: s.impact === 'High' ? '#f87171' : '#f59e0b', border: `1px solid ${s.impact === 'High' ? 'rgba(248,113,113,0.28)' : 'rgba(245,158,11,0.28)'}`, whiteSpace: 'nowrap', flexShrink: 0 }}>{s.impact} Impact</span>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{s.category}</p>
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{s.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── New Scan Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {newScanOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
              onClick={() => setNewScanOpen(false)}
            />
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none' }}
            >
              <div style={{ width: '100%', maxWidth: 500, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24, boxShadow: '0 32px 96px rgba(0,0,0,0.40)', pointerEvents: 'auto', overflow: 'hidden' }}>
                <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635)', borderRadius: '24px 24px 0 0' }} />

                {/* Modal header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(61,80,22,0.40)' }}>
                      <Zap size={18} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Run New Resume Check</h3>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Instant AI scoring against any JD</p>
                    </div>
                  </div>
                  <button onClick={() => setNewScanOpen(false)}
                    style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--card-row-bg)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                  ><X size={15} /></button>
                </div>

                <form onSubmit={handleRunNewScan} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 24px 22px' }}>
                  <div>
                    <Label required>Target Job Title</Label>
                    <input type="text" required placeholder="e.g. Senior Frontend Engineer" value={newScanTitle}
                      onChange={e => setNewScanTitle(e.target.value)} id="new-scan-title" style={IS} />
                  </div>
                  <div>
                    <Label>Company Name</Label>
                    <input type="text" placeholder="e.g. Stripe, Vercel" value={newScanCompany}
                      onChange={e => setNewScanCompany(e.target.value)} id="new-scan-company" style={IS} />
                  </div>
                  <div>
                    <Label>Job Description / Requirements</Label>
                    <textarea rows={4} placeholder="Paste job description keywords here…" value={newScanJd}
                      onChange={e => setNewScanJd(e.target.value)} id="new-scan-jd"
                      style={{ ...IS, resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button type="button" onClick={() => setNewScanOpen(false)}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 13, background: 'var(--card-row-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      type="submit" disabled={isScanning} id="new-scan-submit"
                      style={{ flex: 1, padding: '11px 0', borderRadius: 13, border: 'none', cursor: isScanning ? 'wait' : 'pointer', background: isScanning ? 'rgba(61,80,22,0.45)' : 'linear-gradient(135deg, #3D5016, #6B8A3A)', color: '#fff', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: isScanning ? 'none' : '0 4px 18px rgba(61,80,22,0.45)', transition: 'all 0.18s' }}
                    >
                      {isScanning
                        ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Analyzing…</>
                        : <><Sparkles size={14} />Analyze Resume</>
                      }
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ScanHistoryPage;
