import { useCallback, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CinematicExperience } from './components/CinematicExperience';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { StaticVoyage } from './components/StaticVoyage';
import { useReducedMotion } from './hooks/useReducedMotion';
import { navigateTo } from './hooks/navigate';
import { AboutSection } from './sections/AboutSection';
import { RegisterSection } from './sections/RegisterSection';
import { SponsorsSection } from './sections/SponsorsSection';
import { TimelineSection } from './sections/TimelineSection';

export default function App() {
  const reduced = useReducedMotion();
  const [unsupported, setUnsupported] = useState(false);
  const onUnsupported = useCallback(() => setUnsupported(true), []);
  const cinematic = !reduced && !unsupported;

  // late layout shifts (webfonts, images) → recompute every trigger
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    // honour a deep link such as /#timeline once the pin spacer exists
    const id = location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id) && navigateTo(id));
    return () => window.removeEventListener('load', refresh);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar key={cinematic ? 'journey' : 'sections'} />
      <main id="main">
        {cinematic ? (
          // one continuous journey: desert → deep → barrel log → the ship's log
          <CinematicExperience onUnsupported={onUnsupported} />
        ) : (
          <>
            <StaticVoyage />
            <AboutSection />
            <TimelineSection />
            <SponsorsSection />
            <RegisterSection />
          </>
        )}
        {/* Selected-team boarding tickets will mount here in a later stage. */}
      </main>
      <Footer />
      <div
        id="curtain"
        data-on="false"
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 bg-abyss opacity-0 transition-opacity duration-[380ms] data-[on=true]:opacity-100"
      />
    </>
  );
}
