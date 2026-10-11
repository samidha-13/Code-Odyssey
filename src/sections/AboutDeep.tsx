import type { TextRefs } from '../cinematic/director';
import { RegisterButton } from '../components/RegisterButton';
import { EVENT } from '../data/event';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * About Code Odyssey, read in the dark water beyond the helmet: it rises out
 * of the deep as the camera travels on, with the (closed) registration
 * button directly below it.
 */
export function AboutDeep({ refFn }: Props) {
  return (
    <ol ref={refFn('aboutTrack')} className="deep-track" style={{ visibility: 'hidden' }} aria-label="About Code Odyssey 5.0">
      <li data-item="" data-chapter="about" className="deep-item">
        <p className="deck-eyebrow">About the voyage</p>
        <h2 className="deep-title">
          Welcome to Code Odyssey <em>{EVENT.edition}</em>
        </h2>
        <p className="deep-body">
          Code Odyssey 5 (CO5) is organized by the {EVENT.organizer.name} student chapter of {EVENT.organizer.institute}.
        </p>
        <p className="deep-body deep-body--dim">
          It is a {EVENT.format} taking place on {EVENT.dates.display}.
        </p>
        <div className="deep-cta">
          <RegisterButton />
        </div>
      </li>
    </ol>
  );
}
