import { motion } from 'framer-motion';

/**
 * Loader — spinner for short async operations.
 * Design.md §5: use skeleton for lists, spinner for short async actions.
 *
 * @param {{ size?: number, label?: string }} props
 */
const Loader = ({ size = 24, label = 'Loading...' }) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-label={label}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `3px solid var(--border)`,
          borderTopColor: 'var(--primary)',
        }}
      />
      {label && (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </div>
  );
};

export default Loader;
