import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Briefcase, CheckCircle2, Clock } from 'lucide-react';

/**
 * ModulePendingState — Consistent placeholder for features whose backend
 * service is not yet connected (Phase 3+).
 *
 * Honest, clear empty-state styled to match Design.md without fake data.
 */
const ModulePendingState = ({
  icon: Icon = Sparkles,
  moduleName = 'Feature',
  title = 'Module Coming Soon',
  description = 'This feature will be available once the backend microservices are connected.',
  plannedFeatures = [],
  phase = 'Phase 3',
  gotoLink = '/recruiter/jobs',
  gotoText = 'Go to My Jobs (Active)',
}) => {
  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 36px) 60px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: 720,
          margin: '0 auto',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Top Accent Stripe */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #3D5016, #6B8A3A, #a3e635, #6B8A3A)' }} />

        <div style={{ padding: 'clamp(28px, 5vw, 44px) clamp(20px, 4vw, 36px)', textAlign: 'center' }}>
          {/* Icon Badge */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'rgba(107,138,58,0.12)',
              border: '1px solid rgba(107,138,58,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--primary)',
            }}
          >
            <Icon size={30} strokeWidth={2} />
          </div>

          {/* Status Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.28)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            <Clock size={12} />
            <span>Backend Pending • {phase}</span>
          </div>

          {/* Heading & Description */}
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 10 }}>
            {title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.6 }}>
            {description}
          </p>

          {/* Planned Features List */}
          {plannedFeatures.length > 0 && (
            <div
              style={{
                textAlign: 'left',
                background: 'var(--card-row-bg)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '18px 22px',
                marginBottom: 32,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Planned Capabilities in {moduleName}:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 10 }}>
                {plannedFeatures.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    <CheckCircle2 size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to={gotoLink}
              id="pending-state-goto-action"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                minHeight: 44,
                borderRadius: 13,
                background: 'linear-gradient(135deg, #3D5016, #6B8A3A)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(61,80,22,0.35)',
              }}
            >
              <Briefcase size={15} />
              <span>{gotoText}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModulePendingState;
