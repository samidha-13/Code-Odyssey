/**
 * One continuous scroll timeline (0 → 1 across the pinned scroll).
 *
 *   desert + title → (hero film) zoom into the helmet and down into the deep
 *   → (bottle film) a message in a bottle rises beside the voyage log, breaks
 *   the surface, the cork pops and the paper unrolls → the paper lifts away
 *   onto the open sea → the CSI ship sails in with about, sponsors, register
 */
export const CHOREO = {
  /** pinned scroll length in viewport heights */
  // (longer than the films need, so every block of text stays on screen long enough to read)
  lengthVh: { desktop: 26, mobile: 23 },

  title: [0.006, 0.075] as const, // the title blows away as sand
  hero: [0.0, 0.33] as const, // hero film frames 0 → last
  dust: [0.16, 0.205] as const, // desert dust fades as the camera enters the helmet
  join: [0.322, 0.345] as const, // hero film's deep water → bottle film's deep water
  bottle: [0.33, 0.68] as const, // bottle film frames 0 → last
  // the inked paper holds on the film's last frame (0.68 → 0.715) before it blows away as dust
  paperOff: [0.715, 0.775] as const,
  lift: [0.72, 0.785] as const, // the open sea settles below the camera
  shipIn: [0.75, 0.81] as const,

  // about pops out line by line once the camera is inside the helmet (film frame 86+), holds
  // through the deep, then drifts on before the bottle appears
  about: { in: [0.193, 0.238] as const, out: [0.308, 0.33] as const },
  // ink appears on the fully unrolled paper (bottle film frames ~132-147)
  ink: [0.642, 0.676] as const,
  log: { header: [0.342, 0.36, 0.5, 0.52] as const, track: [0.346, 0.49] as const },
  deck: { track: [0.8, 0.97] as const },
} as const;

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
