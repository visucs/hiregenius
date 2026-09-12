/**
 * AnalyticsCharts.jsx — 6-chart grid using Recharts.
 * Rules.md approved library. All chart colors use Design.md primary/secondary tokens.
 * Each chart: GlassCard wrapper, loading skeleton, empty state.
 */

import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';
import { BarChart2, AlertCircle } from 'lucide-react';

/* Design.md color tokens as JS constants for Recharts */
const PRIMARY        = '#6366F1';
const SECONDARY      = '#22D3EE';
const SUCCESS        = '#22C55E';
const WARNING        = '#F59E0B';
const DANGER         = '#EF4444';
const BORDER         = 'rgba(255,255,255,0.08)';
const TEXT_SECONDARY = '#94A3B8';
const TEXT_MUTED     = '#64748B';
const BG_ELEVATED    = '#151B2C';

const tooltipStyle = {
  background: '#0F1420',
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  fontSize: 12,
  color: '#F8FAFC',
};

const axisStyle = { fontSize: 11, fill: TEXT_MUTED };

/* ── Shared wrappers ── */
const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const ChartCard = ({ title, subtitle, children, id }) => (
  <motion.div
    id={id}
    variants={cardVariants}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-80px' }}
    style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 20, padding: '24px',
    }}
  >
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);

const ChartSkeleton = () => (
  <div style={{ height: 220, borderRadius: 12, background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
    <div className="analytics-shimmer" />
  </div>
);

const EmptyChart = () => (
  <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <BarChart2 size={32} color={TEXT_MUTED} />
    <p style={{ fontSize: 13, color: TEXT_MUTED, margin: 0 }}>No data for this period yet.</p>
  </div>
);

const ErrorChart = ({ onRetry }) => (
  <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
    <AlertCircle size={28} color={DANGER} />
    <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: 0 }}>Failed to load chart data.</p>
    <button onClick={onRetry} style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
      Retry
    </button>
  </div>
);

/* ─── 1. Hiring Trend (Area chart) ─────────────────────── */
export const HiringTrendChart = ({ data, loading, error, onRetry }) => (
  <ChartCard id="chart-hiring-trend" title="Hiring Trend" subtitle="Applications and hires over the selected period">
    {loading ? <ChartSkeleton /> : error ? <ErrorChart onRetry={onRetry} /> : !data?.length ? <EmptyChart /> : (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY}   stopOpacity={0.25} />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradHires" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SECONDARY}   stopOpacity={0.20} />
              <stop offset="100%" stopColor={SECONDARY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: TEXT_SECONDARY }} />
          <Area type="monotone" dataKey="applications" stroke={PRIMARY}    fill="url(#gradApps)"  strokeWidth={2} name="Applications" dot={false} />
          <Area type="monotone" dataKey="hires"        stroke={SECONDARY}  fill="url(#gradHires)" strokeWidth={2} name="Hires"        dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

/* ─── 2. Resume Score Distribution (Bar chart) ──────────── */
export const ScoreDistributionChart = ({ data, loading, error, onRetry }) => (
  <ChartCard id="chart-score-dist" title="Resume Score Distribution" subtitle="Number of resumes in each score band">
    {loading ? <ChartSkeleton /> : error ? <ErrorChart onRetry={onRetry} /> : !data?.length ? <EmptyChart /> : (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={PRIMARY} />
              <stop offset="100%" stopColor={SECONDARY} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
          <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="url(#gradBar)" radius={[6, 6, 0, 0]} name="Resumes" />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

/* ─── 3. Interview Outcomes (Donut) ─────────────────────── */
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const InterviewOutcomesChart = ({ data, loading, error, onRetry }) => (
  <ChartCard id="chart-interview-outcomes" title="Interview Outcomes" subtitle="Recommended / Consider / Not a Fit breakdown">
    {loading ? <ChartSkeleton /> : error ? <ErrorChart onRetry={onRetry} /> : !data?.length ? <EmptyChart /> : (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
            dataKey="value" labelLine={false} label={renderCustomLabel}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: TEXT_SECONDARY }} />
        </PieChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

/* ─── 4. Skill Distribution (Horizontal Bar) ─────────────── */
export const SkillDistributionChart = ({ data, loading, error, onRetry }) => (
  <ChartCard id="chart-skills" title="Top Candidate Skills" subtitle="Most common skills matched across screened resumes">
    {loading ? <ChartSkeleton /> : error ? <ErrorChart onRetry={onRetry} /> : !data?.length ? <EmptyChart /> : (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, left: 50, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSkill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={PRIMARY} />
              <stop offset="100%" stopColor={SECONDARY} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
          <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="skill" tick={axisStyle} axisLine={false} tickLine={false} width={60} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="url(#gradSkill)" radius={[0, 6, 6, 0]} name="Candidates" />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

/* ─── 5. Candidates per Job (Bar) ───────────────────────── */
export const CandidatesPerJobChart = ({ data, loading, error, onRetry }) => (
  <ChartCard id="chart-candidates-per-job" title="Candidates per Job Posting" subtitle="Applicant volume across active positions">
    {loading ? <ChartSkeleton /> : error ? <ErrorChart onRetry={onRetry} /> : !data?.length ? <EmptyChart /> : (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="gradJob" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={SECONDARY} />
              <stop offset="100%" stopColor={PRIMARY} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
          <XAxis dataKey="job" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="url(#gradJob)" radius={[6, 6, 0, 0]} name="Candidates" />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);

/* ─── 6. Monthly Hire Rate (Line) ───────────────────────── */
export const MonthlyHiresChart = ({ data, loading, error, onRetry }) => (
  <ChartCard id="chart-monthly-hires" title="Monthly Hire Rate" subtitle="Hires completed per reporting period">
    {loading ? <ChartSkeleton /> : error ? <ErrorChart onRetry={onRetry} /> : !data?.length ? <EmptyChart /> : (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="hires" stroke={SUCCESS} strokeWidth={2.5} dot={{ r: 4, fill: SUCCESS, strokeWidth: 0 }} name="Hires" />
        </LineChart>
      </ResponsiveContainer>
    )}
  </ChartCard>
);
