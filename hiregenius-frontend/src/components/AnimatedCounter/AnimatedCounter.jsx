import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';

/**
 * AnimatedCounter — counts up from 0 to `value` when scrolled into view.
 * Design.md §8 — used in the Stats/Social Proof section.
 *
 * @param {number}  value     - Target number to count to
 * @param {string}  suffix    - Text appended after number (e.g., "x", "%", "+")
 * @param {string}  prefix    - Text prepended before number
 * @param {number}  duration  - Animation duration in seconds (default 2)
 * @param {string}  label     - Descriptive label below the number
 */
const AnimatedCounter = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2,
  label,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ textAlign: 'center' }}
    >
      <div
        style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #F0EDE4 0%, rgba(163,197,90,0.90) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
          animation: 'shimmer 3s linear infinite',
          backgroundSize: '200% auto',
        }}
      >
        {prefix}{display}{suffix}
      </div>
      {label && (
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(240,237,228,0.50)',
            fontWeight: 500,
          }}
        >
          {label}
        </p>
      )}
    </motion.div>
  );
};

export default AnimatedCounter;
