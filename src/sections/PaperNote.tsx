import type { TextRefs } from '../cinematic/director';
import { EVENT } from '../data/event';

type Props = { refFn: (k: keyof TextRefs) => (node: HTMLElement | null) => void };

/**
 * Written in ink on the paper that comes out of the bottle. The director
 * pins it to the unrolled paper and lets it go with the paper.
 */
export function PaperNote({ refFn }: Props) {
  const teams = EVENT.shortlist.teams;
  const half = Math.ceil(teams.length / 2);
  const leftCol = teams.slice(0, half);
  const rightCol = teams.slice(half);

  return (
    <div ref={refFn('paperNote')} className="paper-note" style={{ visibility: 'hidden' }}>
      <div className="paper-note-inner">
        <p data-ink="" className="paper-eyebrow">
          {EVENT.shortlist.title}
        </p>
        <p data-ink="" className="paper-rule" aria-hidden="true">
          ✦
        </p>
        <div className="paper-teams">
          {leftCol.map((leftTeam, i) => {
            const rightTeam = rightCol[i];
            const leftIdx = i + 1;
            const rightIdx = half + i + 1;
            return (
              <div key={leftTeam} data-ink="" className="paper-row">
                <div className="paper-team">
                  <span className="paper-team-num">{String(leftIdx).padStart(2, '0')}.</span>
                  <span className="paper-team-name">{leftTeam}</span>
                </div>
                {rightTeam && (
                  <div className="paper-team">
                    <span className="paper-team-num">{String(rightIdx).padStart(2, '0')}.</span>
                    <span className="paper-team-name">{rightTeam}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p data-ink="" className="paper-sign">
          Welcome to the Voyage · CSI KJSIT
        </p>
      </div>
    </div>
  );
}
