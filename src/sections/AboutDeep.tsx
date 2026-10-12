import type { TextRefs } from '../cinematic/director';
import { RegisterButton } from '../components/RegisterButton';
import { EVENT } from '../data/event';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * About Code Odyssey, revealed as the camera passes into the helmet: each
 * line pops out of the darkness in turn (driven by scroll), holds while the
 * camera travels through the deep, then drifts on.
 */
export function AboutDeep({ refFn }: Props) {
  return (
    <>
      <div ref={refFn('aboutScrim')} className="deep-scrim" style={{ opacity: 0 }} aria-hidden="true" />
      <div ref={refFn('aboutTrack')} className="deep-block" style={{ visibility: 'hidden' }} aria-label="About Code Odyssey 5.0">
        <div className="deep-item">
          <p data-line="" className="deck-eyebrow">About the voyage</p>
          <h2 data-line="" className="deep-title">
            Welcome to Code Odyssey <em>{EVENT.edition}</em>
          </h2>
          <p data-line="" className="deep-body">
            Code Odyssey 5 (CO5) is organized by the {EVENT.organizer.name} student chapter of {EVENT.organizer.institute}.
          </p>
          <p data-line="" className="deep-body deep-body--dim">
            It is a {EVENT.format} taking place on {EVENT.dates.display}.
          </p>
          <div data-line="" className="deep-cta">
            <RegisterButton />
          </div>
        </div>
      </div>
    </>
  );
}
