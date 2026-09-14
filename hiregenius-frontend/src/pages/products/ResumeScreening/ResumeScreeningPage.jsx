import { useEffect } from 'react';
import LandingNavbar from '../../../components/Navbar/LandingNavbar';
import RSHero        from './sections/RSHero';
import RSDemo        from './sections/RSDemo';
import RSHowItWorks  from './sections/RSHowItWorks';
import RSAnalyzed    from './sections/RSAnalyzed';
import RSBenefits    from './sections/RSBenefits';
import RSShowcase    from './sections/RSShowcase';
import RSFAQ         from './sections/RSFAQ';
import RSCrossLinks  from './sections/RSCrossLinks';
import RSFinalCTA    from './sections/RSFinalCTA';

import useTheme from '../../../hooks/useTheme';

/**
 * /products/resume-screening — public marketing page for the AI Resume
 * Screening module. Accessible logged-in or logged-out. This is NOT the
 * authenticated tool at /recruiter/resume-screening.
 */
const ResumeScreeningPage = () => {
  // Reset scroll on mount
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

      {/* Sections — each handles its own padding/max-width */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <RSHero />
        <RSDemo />
        <RSHowItWorks />
        <RSAnalyzed />
        <RSBenefits />
        <RSShowcase />
        <RSFAQ />
        <RSCrossLinks />
        <RSFinalCTA />
      </div>
    </div>
  );
};

export default ResumeScreeningPage;
