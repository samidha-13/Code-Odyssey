import type { TextRefs } from '../cinematic/director';
import { EVENT } from '../data/event';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * Written in ink on the paper that comes out of the bottle. The director
 * pins it to the unrolled paper and lets it go with the paper.
 */
export function PaperNote({ refFn }: Props) {
  return (
    <div ref={refFn('paperNote')} className="paper-note" style={{ visibility: 'hidden' }}>
      <div className="paper-note-inner">
        <p data-ink="" className="paper-eyebrow">
          {EVENT.shortlist.title}
        </p>
        <p data-ink="" className="paper-line">
          Onboarding teams
        </p>
        <p data-ink="" className="paper-rule" aria-hidden="true">
          ✦
        </p>
        <p data-ink="" className="paper-line paper-line--soft">
          To be announced soon
        </p>
        <p data-ink="" className="paper-sign">
          Watch {EVENT.social.instagram.handle} · CSI KJSIT
        </p>
      </div>
    </div>
  );
}
