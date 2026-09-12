import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import GradientButton from '../../../../components/GradientButton/GradientButton';

const AIFinalCTA = () => (
  <section style={{ padding: '96px 24px', backgroundColor: 'var(--bg-base)' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: 28, padding: 3,
          background: 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 50%, rgba(61,80,22,0.35) 100%)',
          boxShadow: '0 0 60px rgba(61,80,22,0.18)',
        }}
      >
        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 26, padding: '56px 48px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 16px', borderRadius: 999, marginBottom: 24,
            background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)',
            fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <Sparkles size={12} />
            Get started in minutes
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800,
            color: 'var(--text-primary)', lineHeight: 1.2,
            marginBottom: 18, letterSpacing: '-0.02em',
          }}>
            Ready to run your{' '}
            <span className="gradient-text">first AI interview?</span>
          </h2>

          <p style={{
            fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)',
            maxWidth: 560, margin: '0 auto 36px',
          }}>
            Create a free account, post a job, select a candidate, and let HireGenius AI
            generate and evaluate the entire first round — no scheduling, no bias, no bottleneck.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <GradientButton to="/register" size="lg" id="ai-final-cta-register">
              Start for free <ArrowRight size={16} />
            </GradientButton>
            <GradientButton to="/login" size="lg" variant="ghost" id="ai-final-cta-login">
              Sign in to your account
            </GradientButton>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 20 }}>
            Free tier includes 3 AI interview evaluations per month · No credit card required
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);

export default AIFinalCTA;
