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

  return (
    <div ref={refFn('paperNote')} className="paper-note" style={{ visibility: 'hidden' }}>
      <div className="paper-note-inner">
        <p data-ink="" className="paper-eyebrow">
          {EVENT.shortlist.title}
        </p>
        <p data-ink="" className="paper-rule" aria-hidden="true">
          ✦
        </p>
        {/* two columns on a wide paper (1… down the left, then the right), one on a phone */}
        <ol className="paper-teams" style={{ ['--rows' as string]: half }}>
          {teams.map((team, i) => (
            <li key={team} data-ink="" className="paper-team">
              <span className="paper-team-num">{String(i + 1).padStart(2, '0')}.</span>
              <span className="paper-team-name">{team}</span>
            </li>
          ))}
        </ol>
        <p data-ink="" className="paper-sign">
          Welcome to the Voyage · CSI KJSIT
        </p>
      </div>
    </div>
  );
}
