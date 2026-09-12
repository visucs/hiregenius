import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const FAQS = [
  { q: 'Is the Analytics dashboard available in real-time?', a: 'Yes. Every resume screening and AI interview result is captured automatically as it happens. The dashboard reflects your live pipeline — no batch jobs or nightly syncs required.' },
  { q: 'Do I need to set up any integrations or webhooks?', a: 'No. HireGenius Analytics is built directly into the platform. As long as you use Resume Screening or AI Interview features, your analytics populate automatically. Zero configuration required.' },
  { q: 'Can Admin users see data from all recruiters?', a: 'Yes. Admin accounts see platform-wide aggregates across all recruiters in your organisation. Recruiter accounts see only their own data. Scoping is enforced server-side via your JWT — no client-side workaround possible.' },
  { q: 'Can I export my analytics data?', a: 'Yes. The Export Report button downloads your full analytics report (summary cards, chart data, and the activity table) for the selected date range as CSV or PDF — depending on your plan.' },
  { q: 'What date ranges are available?', a: 'The dashboard offers Last 7 days, Last 30 days, and Last 90 days out of the box. Switching between them re-fetches all charts and stat cards instantly. Custom date ranges are planned for a future release.' },
  { q: 'What happens when my backend isn\'t ready yet?', a: 'During development, the Analytics page uses a realistic mock data hook that returns data in the exact same shape as the real API. When the Spring Boot backend ships, swapping to real data is a 1-line change per hook call.' },
];

const Item = ({ q, a, open, onToggle }) => (
  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
    <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: open ? 'var(--primary)' : 'var(--text-primary)', transition: 'color 0.2s' }}>{q}</span>
      <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
        <ChevronDown size={18} color={open ? 'var(--primary)' : 'var(--text-muted)'} />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: 14, lineHeight: 1.72, color: 'var(--text-secondary)', paddingBottom: 20, margin: 0 }}>{a}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const APFAQ = () => {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <SectionHeading eyebrow="FAQ" title="Questions about Analytics" gradientWord="Analytics" subtitle="Everything you need to know before you go live." />
        <div>
          {FAQS.map((f, i) => (
            <Item key={i} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default APFAQ;
