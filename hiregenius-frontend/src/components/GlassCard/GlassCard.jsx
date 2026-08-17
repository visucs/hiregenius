import { motion } from 'framer-motion';

/**
 * GlassCard — glassmorphism card with hover lift + border glow.
 * Design.md §6 & §8.
 *
 * @param {ReactNode}  children
 * @param {string}     className    - Extra Tailwind / CSS classes
 * @param {object}     style        - Inline style overrides
 * @param {boolean}    hoverable    - Enable lift animation (default true)
 * @param {number}     delay        - Framer Motion scroll reveal delay (stagger)
 * @param {boolean}    scrollReveal - Wire up whileInView (default true)
 * @param {object}     rest         - Any extra props forwarded to motion.div
 */
const GlassCard = ({
  children,
  className = '',
  style = {},
  hoverable = true,
  delay = 0,
  scrollReveal = true,
  ...rest
}) => {
  const baseStyle = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-card)',
    padding: '32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    ...style,
  };

  const viewportProps = scrollReveal
    ? {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
      }
    : {};

  const hoverProps = hoverable
    ? {
        whileHover: {
          y: -6,
          boxShadow: '0 16px 48px rgba(99,102,241,0.18)',
          borderColor: 'rgba(255,255,255,0.15)',
        },
        transition: { duration: 0.2, ease: 'easeOut' },
      }
    : {};

  return (
    <motion.div
      className={className}
      style={baseStyle}
      {...viewportProps}
      {...hoverProps}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
