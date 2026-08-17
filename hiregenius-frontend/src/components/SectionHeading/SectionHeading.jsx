import { motion } from 'framer-motion';

/**
 * SectionHeading — centered section title + subtext pair.
 * Design.md §8 — always appears before content grids with 64px bottom margin.
 *
 * @param {string}    eyebrow      - Small label above the heading (optional)
 * @param {string}    title        - Main section heading (required)
 * @param {string}    gradientWord - Word/phrase to apply gradient text on (optional)
 * @param {string}    subtitle     - Subtext paragraph below heading (optional)
 * @param {boolean}   centered     - Center-align (default true)
 */
const SectionHeading = ({
  eyebrow,
  title,
  gradientWord,
  subtitle,
  centered = true,
}) => {
  // Render title with optional gradient word highlighted
  const renderTitle = () => {
    if (!gradientWord) return title;
    const parts = title.split(gradientWord);
    if (parts.length < 2) return title;
    return (
      <>
        {parts[0]}
        <span className="gradient-text">{gradientWord}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        textAlign: centered ? 'center' : 'left',
        marginBottom: '64px',
      }}
    >
      {eyebrow && (
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            marginBottom: '12px',
          }}
        >
          {eyebrow}
        </p>
      )}

      <h2
        className="section-heading"
        style={{
          color: 'var(--text-primary)',
          maxWidth: centered ? '720px' : 'none',
          margin: centered ? `0 auto ${subtitle ? '16px' : '0'}` : `0 0 ${subtitle ? '16px' : '0'}`,
        }}
      >
        {renderTitle()}
      </h2>

      {subtitle && (
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: centered ? '16px auto 0' : '16px 0 0',
          }}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default SectionHeading;
