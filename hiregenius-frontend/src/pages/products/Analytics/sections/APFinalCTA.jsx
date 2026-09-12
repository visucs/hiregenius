import { motion } from 'framer-motion';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import GradientButton from '../../../../components/GradientButton/GradientButton';

const APFinalCTA = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.12) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
    <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.4 }}
        style={{ width: 68, height: 68, borderRadius: 22, margin: '0 auto 24px', background: 'linear-gradient(135deg,#6366F1,#22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(99,102,241,0.35)' }}
      >
        <BarChart3 size={32} color="#fff" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.08 }}
        style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 16 }}
      >
        Stop guessing.{' '}
        <span style={{ background: 'linear-gradient(135deg,#6366F1,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Start knowing.
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.14 }}
        style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 36px' }}
      >
        Your Analytics dashboard is waiting. Sign up free — every HireGenius AI plan includes
        full analytics access with unlimited date-range history.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
        style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <GradientButton to="/register" size="lg" id="ap-cta-register">
          Get started free <ArrowRight size={16} />
        </GradientButton>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer' }}
          >
            Back to home
          </motion.button>
        </Link>
      </motion.div>
    </div>
  </section>
);

export default APFinalCTA;
