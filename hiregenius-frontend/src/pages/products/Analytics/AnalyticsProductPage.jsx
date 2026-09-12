import { useEffect } from 'react';
import LandingNavbar from '../../../components/Navbar/LandingNavbar';
import APHero        from './sections/APHero';
import APLiveDemo    from './sections/APLiveDemo';
import APHowItWorks  from './sections/APHowItWorks';
import APFeatures    from './sections/APFeatures';
import APShowcase    from './sections/APShowcase';
import APFAQ         from './sections/APFAQ';
import APCrossLinks  from './sections/APCrossLinks';
import APFinalCTA    from './sections/APFinalCTA';

/**
 * /products/analytics — public marketing page for the Analytics module.
 * Accessible whether logged in or not.
 * The authenticated dashboard lives at /recruiter/analytics.
 */
const AnalyticsProductPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingNavbar />
      <APHero />
      <APLiveDemo />
      <APHowItWorks />
      <APFeatures />
      <APShowcase />
      <APFAQ />
      <APCrossLinks />
      <APFinalCTA />
    </div>
  );
};

export default AnalyticsProductPage;
