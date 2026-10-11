import type { TextRefs } from '../cinematic/director';
import { EVENT } from '../data/event';
import { TIMELINE } from '../data/timeline';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * The voyage log, read underwater: milestones rise beside the floating
 * barrel as the camera ascends, each coming into focus at the barrel's depth.
 */
export function VoyageLog({ refFn }: Props) {
  return (
    <>
      <div ref={refFn('logHeader')} className="log-header" style={{ visibility: 'hidden' }}>
        <p className="log-eyebrow">The Voyage Log</p>
        <p className="log-date">{EVENT.dates.display}</p>
      </div>
      <ol ref={refFn('logTrack')} className="log-track" style={{ visibility: 'hidden' }} aria-label="Hackathon timeline">
        {TIMELINE.map((m, i) => (
          <li key={m.id} data-item="" data-chapter={i === 0 ? "timeline" : undefined} data-side={i % 2 === 0 ? "l" : "r"} className="log-item">
            <span className="log-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="log-when">{m.when}</span>
            <h3 className="log-title">{m.title}</h3>
            <p className="log-detail">{m.detail}</p>
            <span className="log-tags">
              {m.confirmed && <span className="log-tag log-tag--on">Confirmed date</span>}
              {m.note && <span className="log-tag">{m.note}</span>}
            </span>
            <i className="log-tether" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </>
  );
}
