import type { TextRefs } from '../cinematic/director';
import { Letters } from '../components/Letters';
import { EVENT } from '../data/event';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * The opening frame: the event's name set into the sunset sky above the
 * buried helmet. It dissolves the moment the visitor starts to scroll.
 */
export function IntroTitle({ refFn }: Props) {
  return (
    <>
      <div ref={refFn('introScrim')} className="intro-scrim" aria-hidden="true" />
      <h1 className="sr-only">
        {EVENT.name} — {EVENT.format} by {EVENT.organizer.shortName}, {EVENT.dates.display}. Powered by TATA STRIVE.
      </h1>
      <div ref={refFn('intro')} className="intro" aria-hidden="true">
        <p className="intro-eyebrow">
          <span>Computer Society of India</span>
          <i />
          <span>KJSIT presents</span>
        </p>
        <div className="intro-mark">
          <span ref={refFn('introCode')} className="i-code">
            <Letters text="CODE" />
          </span>
          <span ref={refFn('introOdyssey')} className="i-odyssey">
            ODYSSEY
            <span ref={refFn('introEdition')} className="i-edition">
              {EVENT.edition}
            </span>
          </span>
        </div>
        <p ref={refFn('introMeta')} className="intro-meta">
          <span>{EVENT.dates.display}</span>
          <i />
          <span>{EVENT.format}</span>
        </p>
      </div>
    </>
  );
}
