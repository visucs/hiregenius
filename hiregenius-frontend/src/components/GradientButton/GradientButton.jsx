import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * GradientButton — primary CTA button with indigo→cyan gradient.
 * Design.md §8 — used ONLY on key CTAs, never as decoration.
 *
 * @param {string}   href       - If provided, renders as a Link (internal)
 * @param {string}   to         - Alias for href (react-router)
 * @param {string}   type       - HTML button type (default "button")
 * @param {boolean}  disabled   - Disabled state
 * @param {boolean}  isLoading  - Shows spinner, disables interaction
 * @param {string}   size       - "sm" | "md" | "lg" (default "md")
 * @param {string}   className  - Extra classes
 * @param {Function} onClick
 * @param {ReactNode} children
 */
const sizeMap = {
  sm: { padding: '8px 18px', fontSize: '13px', gap: '6px' },
  md: { padding: '12px 28px', fontSize: '15px', gap: '8px' },
  lg: { padding: '15px 36px', fontSize: '16px', gap: '10px' },
};

const GradientButton = ({
  href,
  to,
  type = 'button',
  disabled = false,
  isLoading = false,
  size = 'md',
  className = '',
  onClick,
  children,
  id,
}) => {
  const dest = href ?? to;
  const sz = sizeMap[size] ?? sizeMap.md;

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sz.gap,
    padding: sz.padding,
    fontSize: sz.fontSize,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
    border: 'none',
    borderRadius: 'var(--radius-btn)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    textDecoration: 'none',
    letterSpacing: '-0.01em',
    boxShadow: '0 4px 20px rgba(61,80,22,0.20)',
    whiteSpace: 'nowrap',
  };

  const motionProps = {
    whileHover: disabled || isLoading ? {} : { scale: 1.02, boxShadow: '0 6px 28px rgba(61,80,22,0.30)' },
    whileTap: disabled || isLoading ? {} : { scale: 0.98 },
    transition: { duration: 0.15, ease: 'easeOut' },
  };

  const inner = isLoading ? (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ) : (
    children
  );

  if (dest) {
    return (
      <motion.div {...motionProps} style={{ display: 'inline-flex' }}>
        <Link to={dest} style={style} className={className} id={id}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      style={style}
      className={className}
      id={id}
      {...motionProps}
    >
      {inner}
    </motion.button>
  );
};

export default GradientButton;
