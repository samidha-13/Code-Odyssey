/**
 * One continuous scroll timeline (0 → 1 across the pinned scroll).
 *
 *   desert + title → (hero film) zoom into the helmet and down into the deep
 *   → (bottle film) a message in a bottle rises beside the voyage log, breaks
 *   the surface, the cork pops and the paper unrolls → the paper lifts away
 *   onto the open sea → the CSI ship sails in with about, sponsors, register
 */
/*
 * The timings below are written on the original 26-viewport timeline. Between
 * the end of the voyage log and the ink on the paper there is no text to read,
 * so that stretch (the bottle surfacing, the cork, the paper unrolling) keeps
 * only part of its scroll: every frame still plays, just over less scrolling.
 * `at` maps an original position onto the shortened timeline.
 */
const GAP = [0.44, 0.638] as const; // log gone → ink about to appear
const KEEP = 0.4; // share of that stretch's scroll that remains
const SHRINK = 1 - (GAP[1] - GAP[0]) * (1 - KEEP); // the whole timeline's new length

export const at = (p: number) =>
  (p <= GAP[0] ? p : p < GAP[1] ? GAP[0] + (p - GAP[0]) * KEEP : p - (GAP[1] - GAP[0]) * (1 - KEEP)) / SHRINK;
/** the inverse of `at`: a position on the shortened timeline back on the original */
const original = (p: number) => {
  const q = p * SHRINK;
  const g = GAP[0] + (GAP[1] - GAP[0]) * KEEP;
  return q <= GAP[0] ? q : q < g ? GAP[0] + (q - GAP[0]) / KEEP : q + (GAP[1] - GAP[0]) * (1 - KEEP);
};
const span = (a: number, b: number) => [at(a), at(b)] as const;

const BOTTLE = [0.33, 0.68] as const;

export const CHOREO = {
  /** pinned scroll length in viewport heights */
  // (longer than the films need, so every block of text stays on screen long enough to read)
  lengthVh: { desktop: 26 * SHRINK, mobile: 23 * SHRINK },

  title: span(0.006, 0.075), // the title blows away as sand
  hero: span(0.0, 0.33), // hero film frames 0 → last
  dust: span(0.16, 0.205), // desert dust fades as the camera enters the helmet
  join: span(0.322, 0.345), // hero film's deep water → bottle film's deep water
  bottle: span(...BOTTLE), // bottle film frames 0 → last (see bottleFilm)
  // the inked paper holds on the film's last frame (0.68 → 0.715) before it blows away as dust
  paperOff: span(0.715, 0.775),
  lift: span(0.72, 0.785), // the open sea settles below the camera
  shipIn: span(0.75, 0.81),

  // about pops out line by line once the camera is inside the helmet (film frame 86+), holds
  // through the deep, then drifts on before the bottle appears
  about: { in: span(0.193, 0.238), out: span(0.308, 0.33) },
  // ink appears on the fully unrolled paper (bottle film frames ~132-147)
  ink: span(0.642, 0.676),
  // the log is read while the water is still dark: the bottle film brightens from frame ~33
  // and is daylight by frame ~60, so the text has left before it
  log: {
    header: [at(0.338), at(0.352), at(0.418), at(0.436)] as const,
    track: span(0.344, 0.418),
  },
  deck: { track: span(0.8, 0.97) },
} as const;

/** bottle film position 0..1: quicker through the shortened stretch, frame for frame */
export const bottleFilm = (p: number) => seg(original(p), ...BOTTLE);

export type Chapter = 'home' | 'timeline' | 'about' | 'sponsors' | 'register';

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut3 = (t: number) => 1 - (1 - t) ** 3;
export const easeIn2 = (t: number) => t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const sstep = (a: number, b: number, x: number) => smooth(clamp01((x - a) / (b - a)));
export const bell = (p: number, c: number, w: number) => Math.exp(-(((p - c) / w) ** 2));
