import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSearch, MessageSquare, ArrowRight } from 'lucide-react';
import SectionHeading from '../../../../components/SectionHeading/SectionHeading';

const LINKS = [
  { icon: FileSearch,    label: 'AI Resume Screening', desc: 'Score every CV in under 10 seconds', to: '/products/resume-screening', badge: 'Available', badgeColor: '#22C55E' },
  { icon: MessageSquare, label: 'AI Interview',         desc: 'Auto-generate and evaluate Q&A',    to: '/products/ai-interview',      badge: 'Available', badgeColor: '#22C55E' },
];

const APCrossLinks = () => (
  <section style={{ padding: '80px 24px', backgroundColor: 'var(--bg-base)' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <SectionHeading eyebrow="Explore HireGenius AI" title="More AI-powered hiring tools" gradientWord="AI-powered" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="ap-cross-grid">
        {LINKS.map(({ icon: Icon, label, desc, to, badge, badgeColor }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Link to={to} style={{ textDecoration: 'none', display: 'block', background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '22px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="var(--primary)" />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: `${badgeColor}1A`, padding: '2px 8px', borderRadius: 999, border: `1px solid ${badgeColor}40` }}>{badge}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {desc} <ArrowRight size={11} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
    <style>{`@media(max-width:600px){.ap-cross-grid{grid-template-columns:1fr!important;}}`}</style>
  </section>
);

export default APCrossLinks;
