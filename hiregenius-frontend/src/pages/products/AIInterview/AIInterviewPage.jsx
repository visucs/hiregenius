import { useEffect } from 'react';
import LandingNavbar  from '../../../components/Navbar/LandingNavbar';
import AIHero         from './sections/AIHero';
import AIDemo         from './sections/AIDemo';
import AIHowItWorks   from './sections/AIHowItWorks';
import AIEvaluated    from './sections/AIEvaluated';
import AIBenefits     from './sections/AIBenefits';
import AIShowcase     from './sections/AIShowcase';
import AIFAQ          from './sections/AIFAQ';
import AICrossLinks   from './sections/AICrossLinks';
import AIFinalCTA     from './sections/AIFinalCTA';

import useTheme from '../../../hooks/useTheme';

/**
 * /products/ai-interview — public marketing page for the AI Interview module.
 * Accessible logged-in or logged-out. The real authenticated tool lives at
 * /recruiter/ai-interview (built in Phase 3).
 */
const AIInterviewPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      backgroundColor: 'var(--bg-base)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', system-ui, sans-serif",
      transition: 'background-color 0.25s ease, color 0.25s ease',
    }}>
      {/* ── Fixed Ambient Olive Glow Mesh (Z-Index 0, non-interactive, zero overflow) ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }} aria-hidden>
        {/* Blob 1: Hero Ambient Glow */}
        <div style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: 'clamp(500px, 60vw, 850px)', height: 'clamp(350px, 45vw, 550px)',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(107,138,58,0.22) 0%, rgba(61,80,22,0.12) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(107,138,58,0.06) 0%, rgba(163,197,90,0.03) 50%, transparent 70%)',
          filter: 'blur(140px)',
        }} />
        {/* Blob 2: Mid-page Glow */}
        <div style={{
          position: 'absolute', top: '38%', right: '-8%',
          width: 'clamp(400px, 45vw, 650px)', height: 'clamp(400px, 45vw, 650px)',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(163,197,90,0.18) 0%, rgba(107,138,58,0.08) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(163,197,90,0.05) 0%, rgba(107,138,58,0.02) 50%, transparent 70%)',
          filter: 'blur(130px)',
        }} />
        {/* Blob 3: Bottom Glow */}
        <div style={{
          position: 'absolute', bottom: '5%', left: '-8%',
          width: 'clamp(450px, 50vw, 700px)', height: 'clamp(350px, 40vw, 500px)',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(61,80,22,0.24) 0%, rgba(107,138,58,0.10) 60%, transparent 75%)'
            : 'radial-gradient(circle, rgba(61,80,22,0.05) 0%, rgba(107,138,58,0.02) 60%, transparent 75%)',
          filter: 'blur(140px)',
        }} />
      </div>

      <LandingNavbar />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AIHero />
        <AIDemo />
        <AIHowItWorks />
        <AIEvaluated />
        <AIBenefits />
        <AIShowcase />
        <AIFAQ />
        <AICrossLinks />
        <AIFinalCTA />
      </div>
    </div>
  );
};

export default AIInterviewPage;
