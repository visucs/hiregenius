import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import useMockAnalytics from '../../hooks/useMockAnalytics';
import AnalyticsStatCards    from './AnalyticsStatCards';
import AnalyticsInsights     from './AnalyticsInsights';
import AnalyticsActivityTable from './AnalyticsActivityTable';
import {
  HiringTrendChart, ScoreDistributionChart, InterviewOutcomesChart,
  SkillDistributionChart, CandidatesPerJobChart, MonthlyHiresChart,
} from './AnalyticsCharts';

const RANGES = [
  { label: 'Last 7 days',  value: '7d'  },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

/* ─── Chart section card ──────────────────────────────────── */
const ChartCard = ({ title, subtitle, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
    }}
  >
    {title && (
      <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>}
      </div>
    )}
    <div style={{ padding: '16px 22px 20px' }}>{children}</div>
  </motion.div>
);

const AnalyticsPage = () => {
  const [range, setRange] = useState('30d');

  const {
    summary, hiringTrend, scoreDistribution, interviewOutcomes,
    skillDistribution, candidatesPerJob, recentActivity,
    loading, error, refetch,
  } = useMockAnalytics(range);

  const handleExport = useCallback(() => {
    alert('Export: GET /api/analytics/export?range=' + range);
  }, [range]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Hero band ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(150deg, #18280a 0%, #0c1505 55%, #0f1e06 100%)',
        padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 36px) 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(107,138,58,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,138,58,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            {/* Top row: title + controls */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(107,138,58,0.95)', background: 'rgba(107,138,58,0.14)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(107,138,58,0.28)' }}>
                    <BarChart3 size={11} /> Hiring Intelligence
                  </span>
                </div>
                <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Analytics</h1>
                <p style={{ fontSize: 13, color: 'rgba(190,220,140,0.60)' }}>Track resume screening, interview performance, and hiring pipeline metrics</p>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                {/* Range tabs */}
                <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(107,138,58,0.25)', flexWrap: 'wrap' }}>
                  {RANGES.map(r => (
                    <button key={r.value} id={`range-${r.value}`} onClick={() => setRange(r.value)}
                      style={{
                        padding: '8px 16px', minHeight: 40, borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        background: range === r.value ? 'linear-gradient(135deg, #3D5016, #6B8A3A)' : 'transparent',
                        color: range === r.value ? '#fff' : 'rgba(255,255,255,0.50)',
                        boxShadow: range === r.value ? '0 3px 12px rgba(61,80,22,0.45)' : 'none',
                      }}
                    >{r.label}</button>
                  ))}
                </div>

                {/* Refresh */}
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={refetch} id="analytics-refresh"
                  style={{ minHeight: 44, padding: '0 16px', borderRadius: 11, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(107,138,58,0.25)', color: 'rgba(255,255,255,0.70)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </motion.button>

                {/* Export */}
                <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }} onClick={handleExport} id="analytics-export"
                  style={{ minHeight: 44, padding: '0 18px', borderRadius: 11, background: 'linear-gradient(135deg, #3D5016, #6B8A3A)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 18px rgba(61,80,22,0.50)', letterSpacing: '-0.01em' }}
                >
                  <Download size={13} /> Export Report
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Stat cards — on hero boundary */}
          <AnalyticsStatCards summary={summary} loading={loading} />
        </div>
      </div>

      {/* ── Content below hero ────────────────────────────────── */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 36px) 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Error banner */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <AlertCircle size={16} color="#ef4444" />
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0, fontWeight: 600 }}>{error}</p>
            <button onClick={refetch} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
          </motion.div>
        )}

        {/* AI Insights */}
        <AnalyticsInsights summary={summary} skillDistribution={skillDistribution} interviewOutcomes={interviewOutcomes} hiringTrend={hiringTrend} loading={loading} />

        {/* 6-chart grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="charts-grid">
          <HiringTrendChart       data={hiringTrend}       loading={loading} error={error} onRetry={refetch} />
          <ScoreDistributionChart data={scoreDistribution}  loading={loading} error={error} onRetry={refetch} />
          <InterviewOutcomesChart data={interviewOutcomes}  loading={loading} error={error} onRetry={refetch} />
          <SkillDistributionChart data={skillDistribution}  loading={loading} error={error} onRetry={refetch} />
          <CandidatesPerJobChart  data={candidatesPerJob}   loading={loading} error={error} onRetry={refetch} />
          <MonthlyHiresChart      data={hiringTrend}        loading={loading} error={error} onRetry={refetch} />
        </div>

        {/* Activity table */}
        <AnalyticsActivityTable data={recentActivity} loading={loading} error={error} onRetry={refetch} />
      </div>

      <style>{`
        @keyframes analytics-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .analytics-shimmer { position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent);animation:analytics-shimmer 1.4s infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media(max-width:1200px){ .stat-cards-grid{grid-template-columns:repeat(3,1fr)!important} }
        @media(max-width:768px){ .stat-cards-grid{grid-template-columns:repeat(2,1fr)!important} .charts-grid{grid-template-columns:1fr!important} }
        @media(max-width:480px){ .stat-cards-grid{grid-template-columns:1fr!important} }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;
