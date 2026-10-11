/**
 * Scroll choreography for the pinned cinematic, expressed as progress
 * intervals (0 → 1 across the whole pinned scroll). Tune timing here.
 */
export const CHOREO = {
  /** pinned scroll length in viewport heights */
  lengthVh: { desktop: 13, mobile: 11 },

  hold: 0.035, // opening frame breathing room
  zoomEnd: 0.3, // wide → approach → close-up complete
  portalEnd: 0.395, // camera has passed through the helmet
  darkEnd: 0.52, // dark-ocean breathing room
  riseEnd: 0.735, // camera reaches the underside of the surface
  breachStart: 0.735,
  breachEnd: 0.795, // waterline has swept past the lens
  tiltStart: 0.83,
  tiltEnd: 0.875,
  shipIn: [0.845, 0.9] as const,

  text: {
    presents: [0.0, 0.0, 0.022, 0.04] as const,
    hint: [0.0, 0.0, 0.012, 0.03] as const,
    line1: [0.402, 0.445, 0.492, 0.515] as const,
    line2: [0.572, 0.612, 0.655, 0.69] as const,
    code: [0.865, 0.888] as const,
    odyssey: [0.886, 0.912] as const,
    edition: [0.908, 0.928] as const,
    dates: [0.926, 0.942] as const,
    duration: [0.938, 0.954] as const,
    powered: [0.952, 0.968] as const,
    cta: [0.966, 0.982] as const,
    cue: [0.984, 0.996] as const,
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
