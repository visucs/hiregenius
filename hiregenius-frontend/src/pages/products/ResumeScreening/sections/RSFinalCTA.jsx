import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import GradientButton from '../../../../components/GradientButton/GradientButton';

const RSFinalCTA = () => (
  <section style={{ padding: '96px 24px 120px', backgroundColor: 'var(--bg-base)' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', borderRadius: 28, overflow: 'hidden' }}
      >
        {/* Gradient border glow */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 28,
          padding: 2,
          background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          zIndex: 2,
        }} />
        {/* Background fill */}
        <div style={{
          background: 'var(--card-float-bg)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: 'var(--card-float-shadow)',
          borderRadius: 28,
          padding: '64px 48px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Inner glow blob */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 500, height: 200,
            background: 'radial-gradient(ellipse, var(--glow-radial) 0%, transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 20,
              padding: '5px 16px', borderRadius: 999,
              background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)',
              fontSize: 12, fontWeight: 700, color: 'var(--primary)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <Sparkles size={12} /> Free to try · No credit card
            </div>

            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.03em',
              lineHeight: 1.15, marginBottom: 16,
            }}>
              Ready to screen your{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>first resume?</span>
            </h2>

            <p style={{
              fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)',
              maxWidth: 520, margin: '0 auto 36px',
            }}>
              Join 5,000+ hiring teams using HireGenius AI to cut screening time by 80% and make faster, fairer shortlisting decisions.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <GradientButton to="/register" size="lg" id="rs-final-cta">
                Start Screening Free <ArrowRight size={16} />
              </GradientButton>
              <GradientButton to="/login" size="lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                I already have an account
              </GradientButton>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default RSFinalCTA;
