/**
 * One continuous scroll timeline (0 → 1 across the pinned scroll).
 *
 *   desert + title → push into the helmet → deep ocean → rise with the
 *   barrel and the voyage log → break the surface into the open sea →
 *   the CSI ship sails in; about, sponsors and registration ride with it
 */
export const CHOREO = {
  /** pinned scroll length in viewport heights */
  lengthVh: { desktop: 19, mobile: 17 },

  title: [0.003, 0.055] as const, // title flies past the camera
  zoomStart: 0.012,
  zoomEnd: 0.16, // wide → approach → close-up
  portalEnd: 0.235, // through the helmet
  deepEnd: 0.29, // deep water, still moving forward
  riseEnd: 0.585, // camera reaches the underside of the surface
  breach: [0.585, 0.628] as const, // waterline sweeps across the lens
  lift: [0.6, 0.66] as const, // camera lifts off the water, settling over the sea
  shipIn: [0.64, 0.71] as const,

  barrel: { enter: [0.29, 0.345] as const, exit: [0.528, 0.58] as const },
  log: { header: [0.3, 0.325, 0.53, 0.56] as const, track: [0.31, 0.548] as const },
  deck: { track: [0.69, 0.965] as const },
  rays: [0.5, 0.545, 0.57, 0.6] as const,
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
/** fade in over [a,b], out over [c,d] */
export const win = (p: number, a: number, b: number, c: number, d: number) =>
  (b <= a ? (p >= a ? 1 : 0) : seg(p, a, b)) * (1 - (d <= c ? (p >= d ? 1 : 0) : seg(p, c, d)));
export const bell = (p: number, c: number, w: number) => Math.exp(-(((p - c) / w) ** 2));
