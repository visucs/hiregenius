import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server } from 'lucide-react';

/**
 * ServerWakeupNotice
 *
 * Appears when an authentication or API request takes longer than `delay` ms (default 2500ms).
 * Informs the user that Render free tier cold-start is spinning up the backend container,
 * preventing them from assuming the application has frozen or encountered a bug.
 *
 * @param {Object} props
 * @param {boolean} props.isLoading - Current request loading state
 * @param {number} [props.delay=2500] - Delay in ms before notice is surfaced
 * @param {string} [props.message='Waking up the server, this may take up to 30 seconds on first use...']
 */
const ServerWakeupNotice = ({
  isLoading = false,
  delay = 2500,
  message = 'Waking up the server, this may take up to 30 seconds on first use...',
}) => {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowNotice(true);
      }, delay);
    } else {
      setShowNotice(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, delay]);

  return (
    <AnimatePresence>
      {showNotice && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 'var(--radius-btn, 12px)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'var(--text-secondary, #94A3B8)',
              lineHeight: 1.4,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
            >
              <Server size={16} style={{ color: 'var(--primary, #6366F1)' }} />
            </motion.div>
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServerWakeupNotice;
