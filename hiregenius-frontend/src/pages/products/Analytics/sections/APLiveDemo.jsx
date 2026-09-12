import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const ttStyle = { background: '#0F1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11, color: '#F8FAFC' };
const ax = { fontSize: 11, fill: '#64748B' };

const hiringData = [
  { name: 'Jan', applications: 24, hires: 4 },
  { name: 'Feb', applications: 38, hires: 7 },
  { name: 'Mar', applications: 31, hires: 5 },
  { name: 'Apr', applications: 52, hires: 9 },
  { name: 'May', applications: 45, hires: 8 },
  { name: 'Jun', applications: 67, hires: 12 },
];

const scoreData = [
  { range: '0–20',  count: 4  },
  { range: '21–40', count: 12 },
  { range: '41–60', count: 28 },
  { range: '61–75', count: 45 },
  { range: '76–90', count: 61 },
  { range: '91–100',count: 18 },
];

const outcomeData = [
  { name: 'Recommended', value: 38, color: '#22C55E' },
  { name: 'Consider',    value: 29, color: '#F59E0B' },
  { name: 'Not a Fit',   value: 33, color: '#EF4444' },
];

const skillData = [
  { skill: 'React',   count: 82 },
  { skill: 'Node.js', count: 74 },
  { skill: 'Python',  count: 67 },
  { skill: 'Java',    count: 58 },
  { skill: 'AWS',     count: 43 },
];

const ChartCard = ({ title, subtitle, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '22px 20px' }}
  >
    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{title}</p>
    {subtitle && <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 14px' }}>{subtitle}</p>}
    {children}
  </motion.div>
);

const APLiveDemo = () => {
  const ref = useRef(null);
  return (
    <section id="ap-live-demo" ref={ref} style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeading
          eyebrow="Live Chart Preview"
          title="Every chart you need, out of the box"
          gradientWord="Every chart"
          subtitle="Interactive hiring analytics built on Recharts — real data, not screenshots. Resize, hover, and explore."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="ap-charts-grid">
          {/* Hiring Trend */}
          <ChartCard title="Hiring Trend" subtitle="Applications vs hires over time">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hiringData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gHires" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={ax} axisLine={false} tickLine={false} />
                <YAxis tick={ax} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                <Area type="monotone" dataKey="applications" stroke="#6366F1" fill="url(#gApps)" strokeWidth={2} name="Applications" dot={false} />
                <Area type="monotone" dataKey="hires"        stroke="#22D3EE" fill="url(#gHires)" strokeWidth={2} name="Hires"        dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Score Distribution */}
          <ChartCard title="Resume Score Distribution" subtitle="Resumes per score band">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="range" tick={{ ...ax, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={ax} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="count" fill="url(#gScore)" radius={[6,6,0,0]} name="Resumes" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Interview Outcomes */}
          <ChartCard title="Interview Outcomes" subtitle="Recommended vs Consider vs Not a Fit">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {outcomeData.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top Skills */}
          <ChartCard title="Top Candidate Skills" subtitle="Most matched skills across screened resumes">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={skillData} layout="vertical" margin={{ top: 0, right: 16, left: 40, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSkill" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={ax} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="skill" tick={ax} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="count" fill="url(#gSkill)" radius={[0,6,6,0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
      <style>{`@media(max-width:900px){.ap-charts-grid{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
};

export default APLiveDemo;
