/**
 * Scroll choreography for the pinned cinematic, expressed as progress
 * intervals (0 → 1 across the whole pinned scroll). Tune timing here.
 *
 *   title on the sand → push into the helmet → swallowed by its interior →
 *   deep ocean → barrel + voyage log rise towards the light → surface →
 *   the CSI ship sails in with its allies
 */
export const CHOREO = {
  /** pinned scroll length in viewport heights */
  lengthVh: { desktop: 14, mobile: 12 },

  zoomStart: 0.018,
  zoomEnd: 0.2, // wide → approach → close-up complete
  portalEnd: 0.29, // camera has passed through the helmet
  deepEnd: 0.37, // breathing room in the dark
  riseEnd: 0.735, // camera reaches the underside of the surface
  breachStart: 0.735,
  breachEnd: 0.79, // waterline has swept past the lens
  tiltStart: 0.812,
  tiltEnd: 0.858,
  shipIn: [0.83, 0.905] as const,

  barrel: { enter: [0.372, 0.445] as const, exit: [0.672, 0.73] as const },
  log: { header: [0.39, 0.42, 0.66, 0.69] as const, track: [0.4, 0.69] as const },

  text: {
    intro: [0.004, 0.045] as const, // big title fades as scrolling begins
    hint: [0.0, 0.0, 0.006, 0.02] as const,
    finale: {
      eyebrow: [0.872, 0.892] as const,
      logo: [0.886, 0.91] as const,
      copy: [0.904, 0.926] as const,
      identity: [0.918, 0.94] as const,
      cta: [0.936, 0.958] as const,
      cue: [0.975, 0.995] as const,
    },
  },
} as const;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut3 = (t: number) => 1 - (1 - t) ** 3;
export const easeIn2 = (t: number) => t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const sstep = (a: number, b: number, x: number) => smooth(clamp01((x - a) / (b - a)));
/** fade in over [a,b], out over [c,d] */
export const win = (p: number, a: number, b: number, c: number, d: number) =>
  (b <= a ? (p >= a ? 1 : 0) : seg(p, a, b)) * (1 - (d <= c ? (p >= d ? 1 : 0) : seg(p, c, d)));
export const bell = (p: number, c: number, w: number) => Math.exp(-(((p - c) / w) ** 2));
