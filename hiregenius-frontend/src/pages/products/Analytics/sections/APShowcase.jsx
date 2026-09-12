import { motion } from 'framer-motion';
import { TrendingUp, RefreshCw, Download, Search } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const trendData = [
  { name: 'Jan', hires: 4 },  { name: 'Feb', hires: 7 },
  { name: 'Mar', hires: 5 },  { name: 'Apr', hires: 9 },
  { name: 'May', hires: 8 },  { name: 'Jun', hires: 12 },
  { name: 'Jul', hires: 10 }, { name: 'Aug', hires: 15 },
];

const ttStyle = { background: '#0F1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11, color: '#F8FAFC' };

const APShowcase = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="Dashboard Preview"
        title="The full analytics dashboard, at a glance"
        gradientWord="full analytics dashboard"
        subtitle="This is what your recruiter dashboard looks like with HireGenius Analytics active."
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
        style={{ borderRadius: 28, padding: 3, background: 'linear-gradient(135deg,#6366F1 0%,#22D3EE 50%,rgba(99,102,241,0.3) 100%)', boxShadow: '0 0 80px rgba(99,102,241,0.18)' }}
      >
        {/* Browser chrome */}
        <div style={{ background: 'var(--bg-elevated)', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#fb7185','#fbbf24','#22C55E'].map((c,i) => <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ flex: 1, height: 24, borderRadius: 6, background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto' }}>
            app.hiregenius.ai/recruiter/analytics
          </div>
        </div>

        {/* Dashboard body */}
        <div style={{ background: 'var(--bg-base)', borderBottomLeftRadius: 26, borderBottomRightRadius: 26, padding: '24px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Analytics</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Track your resume screening and AI interview performance</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Last 7 days','Last 30 days','Last 90 days'].map((l,i) => (
                <div key={i} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: i===1?'var(--primary)':'var(--bg-elevated)', color: i===1?'#fff':'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}>{l}</div>
              ))}
              <div style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg,#6366F1,#22D3EE)', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={11} /> Export
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }} className="ap-showcase-stats">
            {[
              { label: 'Resumes Screened',  value: '248' },
              { label: 'Avg Resume Score',  value: '76%' },
              { label: 'Interviews Done',   value: '91'  },
              { label: 'Success Rate',      value: '63%' },
              { label: 'Active Jobs',       value: '7'   },
            ].map((s,i) => (
              <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 14px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#22C55E', marginTop: 5, fontWeight: 700 }}>↑ +8.2%</div>
              </div>
            ))}
          </div>

          {/* AI insights callout */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#6366F1,#22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={12} color="#fff" />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              <strong style={{ color: 'var(--primary)' }}>AI Insight:</strong> Your average resume score improved by 3.1% this period — candidates are better matched to your job descriptions.
            </p>
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Hiring Trend — Last 30 days</div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={trendData} margin={{ top: 0, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="showGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ttStyle} />
                <Area type="monotone" dataKey="hires" stroke="#6366F1" fill="url(#showGrad)" strokeWidth={2} dot={false} name="Hires" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Activity table preview */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)' }}>
                <Search size={10} /> Search candidate…
              </div>
            </div>
            {[
              { c: 'Priya Sharma',   j: 'Frontend Dev',   t: 'Resume',    s: 88, r: 'Recommended' },
              { c: 'Ravi Kumar',     j: 'Backend Eng.',   t: 'Interview', s: 87, r: 'Recommended' },
              { c: 'Aisha Patel',    j: 'Data Engineer',  t: 'Resume',    s: 72, r: 'Consider'    },
            ].map((row,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', borderTop: i>0?'1px solid rgba(255,255,255,0.04)':'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, flex: 2, whiteSpace: 'nowrap' }}>{row.c}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 2, whiteSpace: 'nowrap' }}>{row.j}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: row.t==='Resume'?'var(--secondary)':'var(--primary)', flex: 1 }}>{row.t}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{row.s}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: row.r==='Recommended'?'#22C55E':row.r==='Consider'?'#F59E0B':'#EF4444', flex: 2 }}>{row.r}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
    <style>{`@media(max-width:900px){.ap-showcase-stats{grid-template-columns:repeat(2,1fr)!important;}}`}</style>
  </section>
);

export default APShowcase;
