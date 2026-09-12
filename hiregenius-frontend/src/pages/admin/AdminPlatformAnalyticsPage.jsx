import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Briefcase, Star, ArrowUpRight } from 'lucide-react';
import { MOCK_PLATFORM_ANALYTICS } from '../../mock/admin/adminMock';

const RANGES = [
  { label: 'Last 7 days',  value: '7d'  },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

/* ─── Recharts tooltip ────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

/* ─── Chart section card ──────────────────────────────────── */
const ChartCard = ({ title, subtitle, stripe, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-30px' }}
    transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
  >
    {stripe && <div style={{ height: 3, background: stripe, borderRadius: '20px 20px 0 0' }} />}
    <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>}
    </div>
    <div style={{ padding: '16px 20px 20px' }}>{children}</div>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════
   ADMIN PLATFORM ANALYTICS PAGE
════════════════════════════════════════════════════════════ */
const AdminPlatformAnalyticsPage = () => {
  const [range, setRange] = useState('30d');
  const data = MOCK_PLATFORM_ANALYTICS;

  const totalApps  = data.hiringTrend.reduce((a, b) => a + b.applications, 0);
  const totalHires = data.hiringTrend.reduce((a, b) => a + b.hires, 0);
  const hireRate   = totalApps > 0 ? ((totalHires / totalApps) * 100).toFixed(1) : '0.0';
  const topSkill   = data.topSkillsDemand[0]?.skill ?? '—';

  const SNAPSHOT = [
    { label: 'Total Applications', value: totalApps,           color: '#818cf8', icon: Users    },
    { label: 'Total Hires',        value: totalHires,          color: '#4ade80', icon: TrendingUp},
    { label: 'Hire Rate',          value: `${hireRate}%`,      color: '#f59e0b', icon: Star      },
    { label: 'Top Skill',          value: topSkill,            color: '#22d3ee', icon: Briefcase },
  ];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* ── Dark Indigo Hero ───────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #1e1b4b 0%, #0f0d2e 55%, #13103a 100%)', padding: '32px 36px 0' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.10) 1.5px, transparent 1.5px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(129,140,248,0.95)', background: 'rgba(99,102,241,0.18)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.30)' }}>
                    <BarChart3 size={11} /> Platform Analytics
                  </span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Platform Analytics</h1>
                <p style={{ fontSize: 13, color: 'rgba(196,200,255,0.60)' }}>Aggregated hiring intelligence across all recruiters</p>
              </div>

              {/* Range tabs */}
              <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(99,102,241,0.25)', alignSelf: 'flex-start', marginTop: 4 }}>
                {RANGES.map(r => (
                  <button key={r.value} id={`admin-analytics-range-${r.value}`} onClick={() => setRange(r.value)}
                    style={{ padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: range === r.value ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                      color: range === r.value ? '#fff' : 'rgba(255,255,255,0.50)',
                      boxShadow: range === r.value ? '0 3px 12px rgba(79,70,229,0.45)' : 'none',
                    }}
                  >{r.label}</button>
                ))}
              </div>
            </div>

            {/* Snapshot stat chips — on hero boundary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {SNAPSHOT.map(({ label, value, color, icon: Icon }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: 'rgba(255,255,255,0.065)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px 16px 0 0', padding: '18px 20px 22px', position: 'relative', overflow: 'hidden', transition: 'background 0.18s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.065)'}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}00, ${color}99, ${color}00)` }} />
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 5 }}>{value}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(196,200,255,0.55)' }}>{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Charts grid ───────────────────────────────────── */}
      <div style={{ padding: '24px 36px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Hiring Trend */}
        <ChartCard
          title="Hiring Trend — Applications vs Hires"
          subtitle="Monthly pipeline volume across the platform"
          stripe="linear-gradient(90deg, #4f46e5, #818cf8)"
          delay={0.04}
        >
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data.hiringTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="hireGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="applications" name="Applications" stroke="#818cf8" strokeWidth={2.5} fill="url(#appGrad)" />
              <Area type="monotone" dataKey="hires"        name="Hires"        stroke="#4ade80" strokeWidth={2.5} fill="url(#hireGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Score Distribution */}
        <ChartCard
          title="Resume Score Distribution"
          subtitle="Candidate score bands platform-wide"
          stripe="linear-gradient(90deg, #06b6d4, #22d3ee)"
          delay={0.08}
        >
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data.scoreDistribution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Candidates" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Skills */}
        <ChartCard
          title="Top Skills in Demand — Platform-wide"
          subtitle="Most requested skills across all active job postings"
          stripe="linear-gradient(90deg, #d97706, #f59e0b)"
          delay={0.12}
        >
          <ResponsiveContainer width="100%" height={210}>
            <BarChart layout="vertical" data={data.topSkillsDemand} margin={{ top: 4, right: 12, bottom: 0, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Job Posts" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Snapshot detail card */}
        <ChartCard
          title={`Platform Snapshot (${range})`}
          subtitle="Key performance indicators for selected period"
          stripe="linear-gradient(90deg, #16a34a, #4ade80)"
          delay={0.16}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SNAPSHOT.map(({ label, value, color, icon: Icon }) => (
              <div key={label}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: 'var(--card-row-bg)', border: '1px solid var(--card-row-border)', transition: 'all 0.15s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.background = `${color}07`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-row-border)'; e.currentTarget.style.background = 'var(--card-row-bg)'; }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: '-0.03em' }}>{value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default AdminPlatformAnalyticsPage;
