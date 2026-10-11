import type { TextRefs } from '../cinematic/director';
import { Letters } from '../components/Letters';
import { RegisterButton } from '../components/RegisterButton';
import { EVENT } from '../data/event';
import { POWERED_BY } from '../data/sponsors';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * The event identity revealed over the CSI ship. Every element is registered
 * with the director, which gives each its own scroll interval:
 * CODE → ODYSSEY → 5.0 → dates → format → TATA STRIVE → call to action.
 */
export function HeroSection({ refFn }: Props) {
  return (
    <>
      <div ref={refFn('scrim')} className="hero-scrim" style={{ opacity: 0 }} aria-hidden="true" />

      <h1 className="sr-only">
        {EVENT.name} — {EVENT.format}, {EVENT.dates.display}. Powered by TATA STRIVE.
      </h1>

      <div ref={refFn('title')} className="hero-title" style={{ visibility: 'hidden' }}>
        <div aria-hidden="true">
          <span ref={refFn('code')} className="t-code">
            <Letters text="CODE" />
          </span>
          <span ref={refFn('odyssey')} className="t-odyssey">
            ODYSSEY
          </span>
          <span ref={refFn('edition')} className="t-edition">
            <span>{EVENT.edition}</span>
          </span>
        </div>

        <p ref={refFn('dates')} className="t-meta t-dates">
          <span className="rule" aria-hidden="true" />
          <time dateTime={EVENT.dates.startISO}>{EVENT.dates.display}</time>
        </p>
        <p ref={refFn('duration')} className="t-meta t-duration">
          {EVENT.format}
        </p>

        {POWERED_BY && (
          <div ref={refFn('powered')} className="mt-[clamp(1.2rem,3.5vh,2.4rem)] flex items-center gap-4">
            <img
              src={POWERED_BY.logo}
              width={POWERED_BY.width}
              height={POWERED_BY.height}
              alt={POWERED_BY.name}
              className="h-[clamp(3.6rem,9vh,5.6rem)] w-auto rounded-[3px] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)] ring-1 ring-ivory/25"
            />
            <span className="flex flex-col gap-1">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.42em] text-bronze-light">
                Powered by
              </span>
              <span className="font-display text-[clamp(0.95rem,1.4vw,1.25rem)] tracking-[0.16em] text-ivory">
                {POWERED_BY.name}
              </span>
            </span>
          </div>
        )}

        <div ref={refFn('cta')} className="mt-[clamp(1.2rem,4vh,2.6rem)]" style={{ visibility: 'hidden' }}>
          <RegisterButton />
        </div>
      </div>

      <div ref={refFn('cue')} className="scroll-cue" style={{ opacity: 0 }} aria-hidden="true">
        Continue the voyage
        <i />
      </div>
    </>
  );
}
