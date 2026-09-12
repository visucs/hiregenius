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

/**
 * /products/ai-interview — public marketing page for the AI Interview module.
 * Accessible logged-in or logged-out. The real authenticated tool lives at
 * /recruiter/ai-interview (built in Phase 3).
 */
const AIInterviewPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingNavbar />
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
  );
};

export default AIInterviewPage;
