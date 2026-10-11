import { asset } from '../data/asset';
import { EVENT } from '../data/event';

/**
 * Motion-free opening, used when the visitor prefers reduced motion or WebGL
 * is unavailable; the About, Timeline, Sponsors and Register sections follow
 * it as ordinary page sections.
 */
export function StaticVoyage() {
  return (
    <section id="home" aria-label="Code Odyssey 5.0 — the voyage" className="relative">
      <h1 className="sr-only">
        {EVENT.name} — {EVENT.format}, {EVENT.dates.display}. Powered by TATA STRIVE.
      </h1>

      <figure className="relative h-[100svh] min-h-[34rem] overflow-hidden">
        <img
          src={asset('assets/sand/sand-helmet-01-wide.webp')}
          alt="An ancient Greek helmet half-buried in desert sand at sunset, a citadel and the Trojan horse beyond."
          className="absolute inset-0 h-full w-full object-cover object-[48%_60%]"
          fetchPriority="high"
        />
        <div className="intro-scrim" aria-hidden="true" />
        <div className="intro" aria-hidden="true">
          <p className="intro-eyebrow">
            <span>Computer Society of India</span>
            <i />
            <span>KJSIT presents</span>
          </p>
          <div className="intro-mark">
            <span className="i-code">CODE</span>
            <span className="i-odyssey">
              ODYSSEY<span className="i-edition">{EVENT.edition}</span>
            </span>
          </div>
          <p className="intro-meta">
            <span>{EVENT.dates.display}</span>
            <i />
            <span>{EVENT.format}</span>
          </p>
        </div>
      </figure>

    </section>
  );
}
