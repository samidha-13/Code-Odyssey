import { RegisterButton } from './RegisterButton';
import { asset } from '../data/asset';
import { EVENT } from '../data/event';
import { POWERED_BY } from '../data/sponsors';

/**
 * Motion-free telling of the same story, used when the visitor prefers
 * reduced motion or WebGL is unavailable. Same plates, same order, no pinning.
 */
export function StaticVoyage() {
  return (
    <section id="home" aria-label="Code Odyssey 5.0 — the voyage" className="relative">
      <h1 className="sr-only">
        {EVENT.name} — {EVENT.format}, {EVENT.dates.display}. Powered by TATA STRIVE.
      </h1>

      <figure className="relative h-[100svh] min-h-[32rem] overflow-hidden">
        <img
          src={asset('assets/sand/sand-helmet-01-wide.webp')}
          alt="An ancient Greek helmet half-buried in desert sand at sunset, a citadel and the Trojan horse beyond."
          className="absolute inset-0 h-full w-full object-cover object-[48%_60%]"
          fetchPriority="high"
        />
        <figcaption className="absolute inset-x-0 bottom-[14vh] text-center font-serif text-lg italic text-ivory/90">
          The Computer Society of India · KJSIT Student Chapter
          <span className="mt-1 block not-italic font-sans text-[0.62rem] font-semibold uppercase tracking-[0.5em] text-bronze-light">
            presents
          </span>
        </figcaption>
      </figure>

      <figure className="relative grid h-[80svh] min-h-[28rem] place-items-center overflow-hidden bg-abyss">
        <img src={asset('assets/ocean/ocean-depths.webp')} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <p className="story-line line1 !static !translate-none px-6">Every great journey begins in the unknown.</p>
      </figure>

      <figure className="relative grid h-[90svh] min-h-[28rem] place-items-center overflow-hidden">
        <img src={asset('assets/ocean/ocean-light-rays.webp')} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
        <p className="story-line line2 !static !translate-none px-6">Rise above the unknown.</p>
      </figure>

      <div className="relative min-h-[100svh] overflow-hidden">
        <img src={asset('assets/ship/csi-sea-plate.webp')} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={asset('assets/ship/csi-ship.webp')}
          alt="An ancient ship under sail carrying the Computer Society of India CSI-KJSIT emblem."
          loading="lazy"
          className="absolute bottom-0 right-1/2 h-[70%] w-auto translate-x-1/2 md:right-[22%] md:top-[4%] md:h-[96%] md:translate-x-1/2"
        />
        <div className="hero-scrim" aria-hidden="true" />
        <div className="relative z-10 px-5 pb-[45vh] pt-28 md:max-w-[52vw] md:px-[6vw] md:pb-24 md:pt-[22vh]">
          <span className="t-code">CODE</span>
          <span className="t-odyssey" style={{ ['--sheen' as string]: 1 }}>
            ODYSSEY
          </span>
          <span className="t-edition">
            <span>{EVENT.edition}</span>
          </span>
          <p className="t-meta t-dates" style={{ ['--rule' as string]: 1 }}>
            <span className="rule" />
            {EVENT.dates.display}
          </p>
          <p className="t-meta t-duration">{EVENT.format}</p>
          {POWERED_BY && (
            <div className="mt-8 flex items-center gap-4">
              <img src={POWERED_BY.logo} width={POWERED_BY.width} height={POWERED_BY.height} alt={POWERED_BY.name} className="h-16 w-auto rounded-[3px] ring-1 ring-ivory/25" />
              <span className="flex flex-col gap-1">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.42em] text-bronze-light">Powered by</span>
                <span className="font-display tracking-[0.16em]">{POWERED_BY.name}</span>
              </span>
            </div>
          )}
          <div className="mt-9">
            <RegisterButton />
          </div>
        </div>
      </div>
    </section>
  );
}
