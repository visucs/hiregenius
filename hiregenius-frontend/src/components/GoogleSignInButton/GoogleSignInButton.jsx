import { motion } from 'framer-motion';

/**
 * Google multi-color SVG icon per official brand guidelines.
 * Colors are kept as-is per Design.md (§2 & task specs).
 */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

/**
 * GoogleSignInButton — Secondary button for Google Auth.
 * Follows Design.md specifications: radius 12px, 44px min-height,
 * secondary glass/border styling, hover transitions, and spinner loading state.
 *
 * @param {Object} props
 * @param {Function} props.onClick - Click handler
 * @param {boolean} [props.isLoading=false] - Loading spinner state
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.label='Continue with Google'] - Button label text
 * @param {string} [props.id='google-signin-btn'] - Button element id
 * @param {Object} [props.style={}] - Additional inline styles
 */
const GoogleSignInButton = ({
  onClick,
  isLoading = false,
  disabled = false,
  label = 'Continue with Google',
  id = 'google-signin-btn',
  style = {},
}) => {
  const isInteractive = !disabled && !isLoading;

  return (
    <motion.button
      type="button"
      id={id}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={isInteractive ? { scale: 1.01 } : {}}
      whileTap={isInteractive ? { scale: 0.98 } : {}}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        width: '100%',
        minHeight: 44,
        padding: '12px 16px',
        borderRadius: 'var(--radius-btn)',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1.5px solid var(--border)',
        color: 'var(--text-primary)',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: isInteractive ? 'pointer' : 'not-allowed',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        outline: 'none',
        transition: 'background 0.2s, border-color 0.2s, opacity 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (isInteractive) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'var(--border-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (isInteractive) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }
      }}
    >
      {isLoading ? (
        <svg
          className="animate-spin"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : (
        <GoogleIcon />
      )}
      <span>{isLoading ? 'Connecting to Google…' : label}</span>
    </motion.button>
  );
};

export default GoogleSignInButton;
