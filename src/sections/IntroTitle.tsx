import type { TextRefs } from '../cinematic/director';
import { EVENT } from '../data/event';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * Lines that frame the CODE ODYSSEY 5.0 title art. The art itself is drawn in
 * the scene, where it blows away as gold sand when the voyage begins.
 */
export function IntroTitle({ refFn }: Props) {
  return (
    <>
      <h1 className="sr-only">
        {EVENT.name} — {EVENT.format} by {EVENT.organizer.shortName}, {EVENT.dates.display}. Powered by TATA STRIVE.
      </h1>
      <p ref={refFn('introEyebrow')} className="intro-line intro-eyebrow" aria-hidden="true">
        Computer Society of India · KJSIT presents
      </p>
      <p ref={refFn('introMeta')} className="intro-line intro-meta" aria-hidden="true">
        {EVENT.dates.display} · {EVENT.format}
      </p>
    </>
  );
}
