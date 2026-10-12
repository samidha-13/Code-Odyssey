import { asset } from '../data/asset';
import { EVENT } from '../data/event';
import { ProblemStatementsButton } from './ProblemStatementsButton';
import { SubmissionCountdown } from './SubmissionCountdown';

/**
 * Motion-free opening, used when the visitor prefers reduced motion or WebGL
 * is unavailable; the About, Timeline, Sponsors and Register sections follow
 * it as ordinary page sections.
 */
export function StaticVoyage() {
  return (
    <section id="home" aria-label="Code Odyssey 5.0" className="relative">
      <h1 className="sr-only">
        {EVENT.name} — {EVENT.format}, {EVENT.dates.display}. Powered by TATA STRIVE.
      </h1>
      <figure className="relative grid h-[100svh] min-h-[34rem] place-items-center overflow-hidden">
        <img
          src={asset('assets/frames/hero/d/0001.webp')}
          alt="An ancient Greek helmet half-buried in desert sand at sunset, a citadel and the Trojan horse beyond."
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="intro-scrim" aria-hidden="true" />
        <div className="relative -mt-[18vh] flex w-[min(92vw,80rem)] flex-col items-center gap-5 text-center" aria-hidden="true">
          <p className="intro-line !static !translate-none">Computer Society of India · KJSIT presents</p>
          <img src={asset('assets/title/code-odyssey-title.webp')} alt="" className="w-full drop-shadow-[0_10px_30px_rgb(40_15_0/0.6)]" />
          <p className="intro-line intro-meta !static !translate-none">
            {EVENT.dates.display} · {EVENT.format}
          </p>
        </div>
        <div className="ps-cta intro-cta">
          <SubmissionCountdown variant="compact" />
          <ProblemStatementsButton />
        </div>
      </figure>
    </section>
  );
}
