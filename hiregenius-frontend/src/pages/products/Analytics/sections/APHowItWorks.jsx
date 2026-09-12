import { motion } from 'framer-motion';
import { Upload, RefreshCw, BarChart2, Download } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const STEPS = [
  { icon: Upload,    num: '01', title: 'Screen Candidates', desc: 'Run Resume Screening and AI Interviews through HireGenius AI. Every result — score, recommendation, skills matched — is automatically captured.' },
  { icon: RefreshCw, num: '02', title: 'Data Aggregates in Real-Time', desc: 'The Analytics engine aggregates all screening and interview events as they happen. No manual uploads, no scheduled syncs — the dashboard updates live.' },
  { icon: BarChart2, num: '03', title: 'Explore Your Dashboard', desc: 'Switch between date ranges (7d / 30d / 90d), drill into individual charts, search the activity table, and compare metrics across job postings.' },
  { icon: Download,  num: '04', title: 'Export and Share', desc: 'Download your full analytics report as CSV or PDF with one click. Share hiring performance with your leadership team without leaving the platform.' },
];

const APHowItWorks = () => (
  <section id="ap-how-it-works" style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)' }}>
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="How It Works"
        title="From hiring activity to insight in real time"
        gradientWord="real time"
        subtitle="Analytics is fully automatic — the more you use HireGenius AI, the richer your dashboard becomes."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, position: 'relative' }} className="ap-steps-grid">
        <div style={{ position: 'absolute', top: 34, left: 'calc(12.5% - 1px)', width: '75%', height: 2, background: 'linear-gradient(90deg,#6366F1,#22D3EE)', opacity: 0.2, zIndex: 0 }} className="ap-steps-line" />
        {STEPS.map(({ icon: Icon, num, title, desc }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: i * 0.1, ease: [0.22,1,0.36,1] }}
            whileHover={{ y: -5 }}
            style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '26px 22px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366F1,#22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color="#fff" />
              </div>
              <span style={{ fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.08)', letterSpacing: '-0.04em' }}>{num}</span>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
    <style>{`@media(max-width:900px){.ap-steps-grid{grid-template-columns:1fr 1fr!important;}.ap-steps-line{display:none!important;}}@media(max-width:560px){.ap-steps-grid{grid-template-columns:1fr!important;}}`}</style>
  </section>
);

export default APHowItWorks;
