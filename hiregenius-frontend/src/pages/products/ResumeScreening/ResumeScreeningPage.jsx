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

/**
 * /products/resume-screening — public marketing page for the AI Resume
 * Screening module. Accessible logged-in or logged-out. This is NOT the
 * authenticated tool at /recruiter/resume-screening.
 */
const ResumeScreeningPage = () => {
  // Reset scroll on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingNavbar />

      {/* Sections — each handles its own padding/max-width */}
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
  );
};

export default ResumeScreeningPage;
