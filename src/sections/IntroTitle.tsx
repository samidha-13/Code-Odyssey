import type { TextRefs } from '../cinematic/director';
import { EVENT } from '../data/event';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/** one span per letter; `depth` > 1 sits nearer the camera and leaves sooner */
function Fly({ text, depth = 1 }: { text: string; depth?: number }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} data-fly={depth} className="fly">
          {ch}
        </span>
      ))}
    </>
  );
}

/**
 * The opening frame: CODE ODYSSEY 5.0 hangs in the warm air between the
 * camera and the buried helmet. When the camera starts to move, the letters
 * swell and stream past the lens — the title is part of the scene, so it
 * leaves the way anything near the camera would.
 */
export function IntroTitle({ refFn }: Props) {
  return (
    <>
      <div ref={refFn('introScrim')} className="intro-scrim" aria-hidden="true" />
      <h1 className="sr-only">
        {EVENT.name} — {EVENT.format} by {EVENT.organizer.shortName}, {EVENT.dates.display}. Powered by TATA STRIVE.
      </h1>
      <div ref={refFn('intro')} className="intro" aria-hidden="true">
        <p className="intro-eyebrow" data-fly="1.35">
          Computer Society of India · KJSIT presents
        </p>
        <div className="intro-mark">
          <span className="i-code">
            <Fly text="CODE" depth={1.1} />
          </span>
          <span className="i-odyssey">
            <Fly text="ODYSSEY" />
            <span className="i-edition" data-fly="1.2">
              {EVENT.edition}
            </span>
          </span>
        </div>
        <p className="intro-meta" data-fly="1.3">
          {EVENT.dates.display} · {EVENT.format}
        </p>
      </div>
    </>
  );
}
