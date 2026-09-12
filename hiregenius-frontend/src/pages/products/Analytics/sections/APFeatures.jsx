import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Zap, FileDown, Filter, BrainCircuit } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const FEATURES = [
  { icon: TrendingUp,   title: 'Hiring Trend Analysis',    desc: 'Track applications and hires over time with area charts. Spot peak hiring windows and pipeline dips before they become problems.' },
  { icon: Calendar,     title: 'Date Range Filter',         desc: 'Instantly re-filter every chart and stat card across Last 7 days, 30 days, or 90 days with a single click. No page reload.' },
  { icon: Zap,          title: 'Real-Time KPI Cards',       desc: '5 animated top-line metrics — Total Resumes, Avg Score, Interviews, Success Rate, Active Jobs — with trend vs previous period.' },
  { icon: FileDown,     title: 'CSV / PDF Export',          desc: 'Export your full analytics report on demand. Share with your leadership team, your board, or use it to benchmark against industry averages.' },
  { icon: Filter,       title: 'Searchable Activity Table', desc: 'Recent screenings and interviews in one table. Filter by candidate, job, type, or recommendation. Paginated, mobile-scrollable.' },
  { icon: BrainCircuit, title: 'AI Insights (Built-in)',    desc: 'Auto-generated insight callouts computed from your existing data — skill demand shifts, score improvements, interview rate changes. No extra API call.' },
];

const APFeatures = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="What's Included"
        title="Everything you need to understand your hiring"
        gradientWord="Everything"
        subtitle="Six analytics capabilities built into one dashboard — no integrations, no extra tools."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="ap-features-grid">
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22,1,0.36,1] }}
            whileHover={{ y: -5 }}
            style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 7 }}>{title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    <style>{`@media(max-width:900px){.ap-features-grid{grid-template-columns:1fr 1fr!important;}}@media(max-width:560px){.ap-features-grid{grid-template-columns:1fr!important;}}`}</style>
  </section>
);

export default APFeatures;
