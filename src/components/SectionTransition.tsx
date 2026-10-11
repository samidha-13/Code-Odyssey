type Variant = 'sea-to-chart' | 'chart-to-deck' | 'deck-to-shore';

const COLORS: Record<Variant, { fill: string; shallow: string; at: 'top' | 'bottom' }> = {
  // deep water laps over the top edge of the chart
  'sea-to-chart': { fill: '#081a2c', shallow: '#2f6a8c', at: 'top' },
  // the chart's lower edge gives way to the night deck
  'chart-to-deck': { fill: '#070f1a', shallow: '#3c5468', at: 'bottom' },
  'deck-to-shore': { fill: '#070f1a', shallow: '#070f1a', at: 'top' },
};

/**
 * A shoreline between chapters: a layered wave edge in the colour of the
 * neighbouring world, so sections meet like water meets land rather than as
 * hard rectangles.
 */
export function SectionTransition({ variant }: { variant: Variant }) {
  const { fill, shallow, at } = COLORS[variant];
  const flip = at === 'bottom';
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-[1] h-[clamp(3rem,7vw,6.5rem)] ${flip ? 'bottom-0' : 'top-0'}`}
      aria-hidden="true"
      style={{ transform: flip ? 'scaleY(-1)' : undefined }}
    >
      <svg className="h-full w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path
          d="M0 0H1440V38C1320 62 1200 70 1080 58C960 46 880 22 760 26C640 30 560 70 420 72C280 74 160 44 0 52Z"
          fill={shallow}
          opacity="0.5"
        />
        <path
          d="M0 0H1440V22C1340 40 1240 52 1120 44C1000 36 900 12 780 14C660 16 560 50 420 52C280 54 150 30 0 34Z"
          fill={fill}
        />
        <path
          d="M0 34C150 30 280 54 420 52C560 50 660 16 780 14C900 12 1000 36 1120 44C1240 52 1340 40 1440 22"
          fill="none"
          stroke="#b98a4e"
          strokeOpacity="0.35"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
