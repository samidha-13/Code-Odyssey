import { useId } from 'react';
import { lerp } from '../cinematic/choreography';

type Props = {
  /** sand left in the top bulb, 1 → 0 */
  remaining: number;
  running: boolean;
  className?: string;
};

// one outline for both bulbs, pinched at the neck (60, 100)
const GLASS = 'M26 24 H94 C94 62 66 84 62.4 100 C66 116 94 138 94 176 H26 C26 138 54 116 57.6 100 C54 84 26 62 26 24 Z';

/**
 * A turned hourglass whose sand mirrors the time left: the top bulb empties
 * and the bottom fills as the deadline nears, with a thin stream falling
 * through the neck while time still runs.
 */
export function Hourglass({ remaining, running, className = '' }: Props) {
  const id = useId().replace(/:/g, '');
  const r = Math.min(1, Math.max(0, remaining));
  const topY = lerp(98, 34, r); // the top bulb's sand surface
  const pileY = lerp(120, 174, r); // the bottom pile's crest
  return (
    <svg className={`hourglass ${className}`} viewBox="0 0 120 200" aria-hidden="true" data-running={running}>
      <defs>
        <clipPath id={`${id}-glass`}>
          <path d={GLASS} />
        </clipPath>
        <linearGradient id={`${id}-sand`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--hg-sand-hi)" />
          <stop offset="1" stopColor="var(--hg-sand)" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* glass body */}
      <path d={GLASS} className="hg-glass" />
      <g clipPath={`url(#${id}-glass)`}>
        {/* top bulb: a sunken surface that drains through the neck */}
        <path d={`M20 ${topY} Q60 ${topY + 7 * r} 100 ${topY} V100 H20 Z`} fill={`url(#${id}-sand)`} />
        {/* bottom bulb: a cone-topped pile that rises */}
        <path d={`M20 176 V${pileY + 16} L60 ${pileY} L100 ${pileY + 16} V176 Z`} fill={`url(#${id}-sand)`} />
        {running && <line className="hg-stream" x1="60" x2="60" y1="98" y2={pileY + 1} />}
        <rect x="20" y="20" width="80" height="160" fill={`url(#${id}-shine)`} />
      </g>
      <path d={GLASS} className="hg-glass-edge" />

      {/* frame: caps and turned posts */}
      <rect className="hg-cap" x="12" y="10" width="96" height="14" rx="3" />
      <rect className="hg-cap" x="12" y="176" width="96" height="14" rx="3" />
      <rect className="hg-post" x="16" y="24" width="5" height="152" rx="2.5" />
      <rect className="hg-post" x="99" y="24" width="5" height="152" rx="2.5" />
    </svg>
  );
}
