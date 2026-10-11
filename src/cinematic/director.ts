import { asset } from '../data/asset';
import {
  CHOREO as K,
  bell,
  clamp01,
  easeIn2,
  easeInOut,
  easeOut3,
  lerp,
  seg,
  smooth,
  sstep,
  win,
} from './choreography';
import { Particles } from './particles';
import { Renderer, type Tex } from './renderer';

/** Scene plates, in the order they are needed. */
export const SCENE_ASSETS = {
  wide: 'assets/sand/sand-helmet-01-wide.webp',
  approach: 'assets/sand/sand-helmet-02-approach.webp',
  closeup: 'assets/sand/sand-helmet-03-closeup.webp',
  portal: 'assets/helmet/helmet-portal.webp',
  depths: 'assets/ocean/ocean-depths.webp',
  rays: 'assets/ocean/ocean-light-rays.webp',
  under: 'assets/ocean/ocean-surface-from-below.webp',
  surface: 'assets/ocean/ocean-surface.webp',
  plate: 'assets/ship/csi-sea-plate.webp',
  ship: 'assets/ship/csi-ship.webp',
} as const;
type SceneKey = keyof typeof SCENE_ASSETS;
const CRITICAL: SceneKey[] = ['wide', 'approach', 'closeup', 'portal'];

/*
 * Helmet alignment, measured on the source plates (see ASSETS.md).
 * The helmet nose-guard tip is the shared anchor; r = plate pixels per
 * wide-shot pixel at that anchor.
 */
const WIDE = { w: 1307, h: 750, nx: 630, ny: 543 };
const APPROACH = { nx: 637, ny: 585, r: 3.38 };
const CLOSE = { nx: 664, ny: 545, r: 3.38 * 2.55, targetX: 661, targetY: 600, gapW: 150, gapH: 150 };
const PORTAL_TARGET = {
  x: WIDE.nx + (CLOSE.targetX - CLOSE.nx) / CLOSE.r,
  y: WIDE.ny + (CLOSE.targetY - CLOSE.ny) / CLOSE.r,
};
const UNDER_WATERLINE = 0.15; // fraction of ocean-surface-from-below height
const SURFACE_HORIZON = 0.317; // fraction of ocean-surface height
const Z_CLOSE = 9.4;

export type TextKey =
  | 'presents'
  | 'hint'
  | 'line1'
  | 'line2'
  | 'title'
  | 'code'
  | 'odyssey'
  | 'edition'
  | 'dates'
  | 'duration'
  | 'powered'
  | 'cta'
  | 'cue'
  | 'scrim';

export type TextRefs = Partial<Record<TextKey, HTMLElement | null>>;

const styleCache = new WeakMap<HTMLElement, Record<string, string>>();
function css(el: HTMLElement | null | undefined, prop: string, val: string) {
  if (!el) return;
  let c = styleCache.get(el);
  if (!c) styleCache.set(el, (c = {}));
  if (c[prop] !== val) {
    c[prop] = val;
    el.style.setProperty(prop, val);
  }
}
const f3 = (v: number) => (Math.abs(v) < 1e-4 ? '0' : v.toFixed(3));

export class Director {
  private r: Renderer;
  private particles: Particles;
  private tex: Partial<Record<SceneKey, Tex>> = {};
  private W = 1;
  private H = 1;
  private letters = new Map<HTMLElement, HTMLElement[]>();
  portrait = false;
  /** bottom edge of the title block (px), so the ship never sits under it on phones */
  private titleBottom = 0;

  constructor(
    renderer: Renderer,
    particleCanvas: HTMLCanvasElement,
    private texts: TextRefs,
    mobile: boolean,
  ) {
    this.r = renderer;
    this.particles = new Particles(particleCanvas, mobile ? 46 : 84);
  }

  /** Loads the opening plates first, then the rest in the background. */
  async load(onCritical: () => void, onProgress: (f: number) => void) {
    const total = Object.keys(SCENE_ASSETS).length;
    let done = 0;
    const get = (k: SceneKey) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          try {
            this.tex[k] = this.r.upload(img);
          } catch {
            /* a missing plate just isn't drawn */
          }
          onProgress(++done / total);
          resolve();
        };
        img.onerror = () => {
          console.warn(`[cinematic] failed to load ${SCENE_ASSETS[k]}`);
          onProgress(++done / total);
          resolve();
        };
        img.src = asset(SCENE_ASSETS[k]);
      });
    await get('wide');
    onCritical();
    await Promise.all(CRITICAL.slice(1).map(get));
    const rest = (Object.keys(SCENE_ASSETS) as SceneKey[]).filter((k) => !CRITICAL.includes(k));
    await Promise.all(rest.map(get));
  }

  resize(w: number, h: number, dpr: number) {
    this.W = w;
    this.H = h;
    this.portrait = w / h < 0.95;
    const tb = this.texts.title;
    this.titleBottom = tb ? tb.offsetTop + tb.offsetHeight : h * 0.48;
    this.r.resize(w, h, dpr);
    this.particles.resize(w, h, Math.min(dpr, 1.5));
  }

  private lettersOf(el: HTMLElement | null | undefined) {
    if (!el) return [];
    let l = this.letters.get(el);
    if (!l) {
      l = Array.from(el.querySelectorAll<HTMLElement>('[data-l]'));
      this.letters.set(el, l);
    }
    return l;
  }

  /** Render one frame at scroll progress p (0..1) and wall time t (s). */
  frame(p: number, t: number) {
    const { W, H, r, tex } = this;
    r.time = t;
    r.begin(0.01, 0.025, 0.05);

    // ------------------------------------------------------------ camera
    const s0 = Math.max(W / WIDE.w, H / WIDE.h);
    const zoomT = smooth(seg(p, K.hold, K.zoomEnd));
    const drift = 1 + 0.012 * seg(p, 0, K.hold); // tiny push while "holding"
    let z = Math.exp(lerp(0, Math.log(Z_CLOSE), zoomT)) * drift;
    const zP = Math.max((1.25 * W * CLOSE.r) / (CLOSE.gapW * s0), (1.25 * H * CLOSE.r) / (CLOSE.gapH * s0));
    const pe = seg(p, K.zoomEnd, K.portalEnd); // portal progress
    if (pe > 0) z = Math.exp(lerp(Math.log(Z_CLOSE * drift), Math.log(zP), Math.pow(pe, 1.65)));
    const s = s0 * z;

    const sx0 = W / 2 + (WIDE.nx - WIDE.w / 2) * s0;
    const sy0 = H / 2 + (WIDE.ny - WIDE.h / 2) * s0;
    const k = smooth(seg(p, K.zoomEnd, K.zoomEnd + 0.07));
    const Sx = lerp(lerp(sx0, W / 2, sstep(1, 4, z)), W / 2, k);
    const Sy = lerp(sy0, H / 2, k);
    const Tx = lerp(WIDE.nx, PORTAL_TARGET.x, k);
    const Ty = lerp(WIDE.ny, PORTAL_TARGET.y, k);
    const hx = Sx + (WIDE.nx - Tx) * s; // helmet anchor on screen
    let hy = Sy + (WIDE.ny - Ty) * s;
    // the close-up plate ends just below the helmet: never let its lower edge
    // rise into frame (matters on tall portrait screens mid-dive)
    if (tex.closeup && z > 6) {
      const bottom = hy + ((tex.closeup.h - CLOSE.ny) * s) / CLOSE.r;
      if (bottom < H + 2) hy += H + 2 - bottom;
    }
    const place = (t: Tex, nx: number, ny: number, ratio: number, scale: number): [number, number, number, number] => [
      hx - (nx * scale) / ratio,
      hy - (ny * scale) / ratio,
      (t.w * scale) / ratio,
      (t.h * scale) / ratio,
    ];

    // ---------------------------------------------- scene 01: the desert
    const inDesert = p < K.portalEnd + 0.01;
    if (inDesert && tex.wide && z < 10.6) {
      const A = tex.wide;
      const aOp = 1 - sstep(9, 10.6, z);
      const warm = 1 + 0.04 * sstep(1, 3, z);
      // far plane: mountains, citadel, sky — expands slower than the ground
      r.draw(A, { rect: place(A, WIDE.nx, WIDE.ny, 1, s0 * Math.pow(z, 0.86)), opacity: aOp, blur: 2.2 * sstep(1.4, 5, z), brightness: warm });
      // ground plane: sand around the helmet (the helmet stays locked here)
      r.draw(A, {
        rect: place(A, WIDE.nx, WIDE.ny, 1, s),
        opacity: aOp,
        band: [0.585, 0.665],
        focus: [WIDE.nx / WIDE.w, 520 / WIDE.h, 0.075, 1.8 * sstep(2, 5, z)],
        brightness: warm,
      });
      // near plane: foreground scrub rushes past
      r.draw(A, {
        rect: place(A, WIDE.nx, WIDE.ny, 1, s0 * Math.pow(z, 1.16)),
        opacity: aOp,
        band: [0.79, 0.93],
        blur: 1.4 * sstep(1.3, 3.5, z),
        brightness: warm,
      });
    }

    const B = tex.approach;
    if (inDesert && B && z > 2 && z < 12.5) {
      const vf = 0.4 * (1 - sstep(4.3, 6.2, z));
      r.draw(B, {
        rect: place(B, APPROACH.nx, APPROACH.ny, APPROACH.r, s),
        opacity: sstep(2.2, 3.9, z) * (1 - sstep(10.5, 12.5, z)),
        vignette: vf > 0.01 ? [0.5, 0.5, vf] : null,
        focus: [0.49, 0.66, 0.3, 1.5 * sstep(3.5, 8.5, z)],
      });
    }

    // ------------------------------------- scene 02: through the helmet
    const C = tex.closeup;
    const CP = tex.portal;
    const holeOpen = sstep(K.zoomEnd, K.zoomEnd + 0.035, p);
    const D = tex.depths;
    const coverD = D ? Math.max(W / D.w, H / D.h) : 1;

    if (D && pe > 0 && p < K.riseEnd) {
      // the deep ocean, seen first *through* the helmet's openings
      const rise = easeInOut(seg(p, K.darkEnd, K.riseEnd));
      const fwd = lerp(1.06, 1.18, pe) * lerp(1, 1.14, seg(p, K.portalEnd, K.darkEnd + 0.04));
      const sc = coverD * fwd * (1 + 0.05 * Math.sin(t * 0.05));
      const dw = D.w * sc;
      const dh = D.h * sc;
      r.draw(D, {
        rect: [(W - dw) / 2 + Math.sin(t * 0.07) * W * 0.004, (H - dh) / 2 + rise * H * 0.9, dw, dh],
        opacity: 1 - sstep(0.555, 0.64, p),
        brightness: lerp(0.3, 1, sstep(K.zoomEnd + 0.02, K.portalEnd, p)) * lerp(1, 1.25, seg(p, K.portalEnd, K.darkEnd)),
        band: rise > 0.002 ? [0, 0.38] : null,
      });
    }

    if (C && z > 5 && p < K.portalEnd + 0.01) {
      const cOp = sstep(6, 8.7, z) * (1 - sstep(0.9, 1, pe));
      const vf = 0.32 * (1 - sstep(8.7, 10, z));
      const grade = {
        brightness: lerp(1, 0.28, Math.pow(pe, 0.8)),
        saturation: lerp(1, 0.5, pe),
        tint: [0.02, 0.06, 0.12] as [number, number, number],
        tintAmount: 0.4 * pe,
        blur: 1.6 * sstep(0.35, 1, pe),
        vignette: vf > 0.01 ? ([0.5, 0.5, vf] as [number, number, number]) : null,
        focus: [0.5, 0.5, 0.4, 1.5 * sstep(8, 10, z)] as [number, number, number, number],
      };
      const rect = place(C, CLOSE.nx, CLOSE.ny, CLOSE.r, s);
      if (CP && holeOpen > 0) r.draw(CP, { rect, opacity: cOp, ...grade });
      r.draw(C, { rect, opacity: cOp * (1 - (CP ? holeOpen : 0)), ...grade });
    }

    // darkness gathering at the edges as the camera enters
    if (pe > 0) {
      r.fill([0, 0.01, 0.03, 1], [0, 0.01, 0.03, 1], {
        vignette: [0.62, 0.62, 0.75],
        opacity: 0.7 * sstep(0.05, 0.7, pe) * (1 - seg(p, K.portalEnd, K.darkEnd) * 0.35),
      });
    }

    // ---------------------------------- scene 03-04: dark ocean → ascent
    const R = tex.rays;
    if (R && p > 0.5 && p < K.breachEnd + 0.01) {
      const rs = Math.max(W / R.w, (1.9 * H) / R.h) * 1.02;
      const rw = R.w * rs;
      const rh = R.h * rs;
      const climb = easeInOut(seg(p, K.darkEnd, K.riseEnd + 0.01));
      r.draw(R, {
        rect: [(W - rw) / 2, lerp(H - rh, -0.02 * rh, climb), rw, rh],
        opacity: sstep(0.5, 0.56, p),
        brightness: lerp(0.3, 1.06, sstep(0.55, 0.73, p)),
        ripple: [0.0012 * sstep(0.62, 0.72, p), 22, -1],
      });
    }
    // god rays from the surface far above
    const rayI = 0.05 * sstep(0.4, 0.45, p) + 0.42 * sstep(0.56, 0.7, p);
    r.rays(rayI * (1 - sstep(0.76, 0.795, p)), 0.5 + Math.sin(t * 0.05) * 0.03, -0.1, 1);

    // --------------------------------------- scene 05: breaking surface
    const breach = easeInOut(seg(p, K.breachStart, K.breachEnd));
    const lineY = lerp(-0.1 * H, 1.2 * H, breach);
    const U = tex.under;
    if (U && p > 0.69 && p < K.breachEnd + 0.012) {
      const us = Math.max(W / U.w, H / U.h) * 1.15;
      const uw = U.w * us;
      const uh = U.h * us;
      r.draw(U, {
        rect: [(W - uw) / 2, lineY - UNDER_WATERLINE * uh, uw, uh],
        opacity: sstep(0.7, 0.735, p) * (1 - sstep(K.breachEnd - 0.004, K.breachEnd + 0.01, p)),
        blur: 0.6,
        ripple: [0.0035, 16, -1],
        water: p > K.breachStart ? [lineY, 12, 7, 1] : null,
      });
    }

    const S = tex.surface;
    const tilt = easeInOut(seg(p, K.tiltStart, K.tiltEnd));
    if (S && p > K.breachStart && p < K.tiltEnd + 0.01) {
      const ss = Math.max(W / S.w, H / S.h) * 1.1;
      const sw = S.w * ss;
      const sh = S.h * ss;
      const bob = Math.sin(t * 0.8) * H * 0.005 + Math.sin(t * 0.37 + 1) * H * 0.003;
      const horizon = 0.42 * H + bob - tilt * 1.32 * H;
      r.draw(S, {
        rect: [(W - sw) / 2, horizon - SURFACE_HORIZON * sh, sw, sh],
        opacity: sstep(K.breachStart, K.breachStart + 0.012, p) * (1 - sstep(0.852, 0.878, p)),
        ripple: [0.0011 + 0.0065 * (1 - sstep(0.79, 0.84, p)), 14, SURFACE_HORIZON + 0.01],
        water: p < K.breachEnd + 0.004 ? [lineY, 12, 7, -1] : null,
      });
    }
    // a brief wash of sunlight as the lens clears
    r.fill([1, 0.96, 0.88, 0.26], [1, 0.97, 0.92, 0.08], { opacity: bell(p, 0.768, 0.014) });

    // ------------------------------------------ scene 06: the CSI ship
    const P = tex.plate;
    const SH = tex.ship;
    const shipH = this.portrait ? 0.8 * H : 1.02 * H;
    const shipScale = SH ? shipH / SH.h : 1;
    const shipCx = this.portrait ? W / 2 : W * (W / H > 1.5 ? 0.71 : 0.69);
    if (P && p > K.tiltStart) {
      // drawn at the ship's own scale so the waves match the ship's water
      const ps = Math.max(shipScale, (W * 1.05) / P.w, (H * 1.3) / P.h);
      const pw = P.w * ps;
      const ph = P.h * ps;
      const px = Math.min(0, Math.max(W - pw, shipCx - pw / 2));
      r.draw(P, {
        rect: [px, (H - ph) / 2 + (1 - tilt) * 0.6 * H + (0.12 - seg(p, 0.84, 1) * 0.24) * (ph - H) * 0.5, pw, ph],
        opacity: sstep(0.832, 0.856, p),
        ripple: [0.0005, 30, -1],
      });
    }
    // sea haze hides the change of viewpoint during the tilt
    r.fill([0.78, 0.88, 0.96, 0.4], [0.55, 0.72, 0.86, 0.12], { opacity: bell(p, 0.85, 0.012) });

    if (SH && p > 0.84) {
      const shipIn = easeOut3(seg(p, K.shipIn[0], K.shipIn[1]));
      const sh = shipH;
      const cx = shipCx;
      const top = this.portrait ? Math.min(0.62 * H, Math.max(0.42 * H, this.titleBottom + 0.01 * H)) : 0.045 * H;
      const sail = seg(p, K.shipIn[1], 1);
      const sc = lerp(1.05, 1, shipIn) * (1 + Math.sin(t * 0.6) * 0.002);
      const h2 = sh * sc;
      const w2 = (SH.w / SH.h) * h2;
      const y = top + (1 - shipIn) * 0.9 * H + sail * 0.014 * H + Math.sin(t * 0.9) * 0.003 * H;
      r.draw(SH, { rect: [cx - w2 / 2, y, w2, h2], opacity: sstep(0.852, 0.872, p), band: [0, 0.012] });
    }

    // lens vignette — always on, subtle
    r.fill([0, 0, 0, 1], [0, 0, 0, 1], { vignette: [0.8, 0.8, 0.6], opacity: 0.32 });

    // -------------------------------------------------------- particles
    const climb = easeInOut(seg(p, K.darkEnd, K.riseEnd));
    this.particles.render({
      time: t,
      fwd: Math.log(z) * 0.42 + seg(p, K.portalEnd, K.darkEnd) * 0.5 + climb * 0.25,
      rise: climb * 2.4,
      dust: 0.9 * (1 - sstep(0.24, 0.33, p)),
      motes: sstep(0.37, 0.42, p) * (1 - sstep(0.7, 0.75, p)),
      bubbles: sstep(0.45, 0.55, p) * (1 - sstep(0.74, 0.775, p)),
      spray: seg(p, 0.765, 0.83),
      sprayAlpha: sstep(0.765, 0.775, p) * (1 - sstep(0.812, 0.83, p)),
    });

    // ------------------------------------------------- navbar contrast
    let glass: number;
    if (p < K.zoomEnd) glass = 0.34;
    else if (p < K.darkEnd) glass = lerp(0.34, 0.14, pe);
    else if (p < 0.86) glass = lerp(0.14, 0.5, sstep(0.58, 0.74, p));
    else glass = lerp(0.5, 0.36, sstep(0.86, 0.89, p));
    document.documentElement.style.setProperty('--nav-glass', glass.toFixed(3));

    this.text(p);
  }

  // ------------------------------------------------------------- text
  private text(p: number) {
    const T = this.texts;
    const X = K.text;

    // opening credit + scroll hint
    const pres = win(p, ...X.presents);
    css(T.presents, 'opacity', f3(pres));
    css(T.presents, 'transform', `translate3d(0, ${f3((1 - pres) * -8)}px, 0)`);
    css(T.hint, 'opacity', f3(win(p, ...X.hint)));

    // line 1 — letters condense out of the dark
    {
      const el = T.line1;
      const L = this.lettersOf(el);
      const [a, b, c, d] = X.line1;
      const vis = p > a && p < d;
      css(el, 'visibility', vis ? 'visible' : 'hidden');
      if (vis) {
        const n = L.length;
        const span = b - a;
        L.forEach((s, i) => {
          const st = a + (i / n) * span * 0.62;
          const tt = smooth(seg(p, st, st + span * 0.38));
          css(s, 'opacity', f3(tt));
          css(s, 'filter', tt > 0.99 ? 'none' : `blur(${f3((1 - tt) * 9)}px)`);
          css(s, 'transform', `translate3d(0, ${f3((1 - tt) * 0.35)}em, 0)`);
        });
        const out = smooth(seg(p, c, d));
        css(el, 'opacity', f3(1 - out));
        css(el, 'transform', `translate3d(0, ${f3(-out * 26)}px, 0) scale(${f3(1 + out * 0.03)})`);
        css(el, 'filter', out > 0.01 ? `blur(${f3(out * 6)}px)` : 'none');
      }
    }

    // line 2 — words rise from below as the light grows, then fall away
    {
      const el = T.line2;
      const L = this.lettersOf(el);
      const [a, b, c, d] = X.line2;
      const vis = p > a && p < d;
      css(el, 'visibility', vis ? 'visible' : 'hidden');
      if (vis) {
        const n = L.length;
        L.forEach((s, i) => {
          const st = a + (i / n) * (b - a) * 0.55;
          const tt = easeOut3(seg(p, st, st + (b - a) * 0.45));
          css(s, 'transform', `translate3d(0, ${f3((1 - tt) * 105)}%, 0)`);
          css(s, 'opacity', f3(Math.min(1, tt * 1.4)));
        });
        const out = easeIn2(seg(p, c, d));
        css(el, 'opacity', f3(1 - out));
        css(el, 'transform', `translate3d(0, ${f3(out * 70)}px, 0)`);
        css(el, '--cool', f3(sstep(0.6, 0.68, p)));
      }
    }

    // ---- the event identity
    const titleOn = p > X.code[0] - 0.005;
    css(T.title, 'visibility', titleOn ? 'visible' : 'hidden');
    css(T.scrim, 'opacity', f3(sstep(0.855, 0.89, p)));
    if (!titleOn) return;

    {
      const L = this.lettersOf(T.code);
      const [a, b] = X.code;
      const n = L.length;
      L.forEach((s, i) => {
        const fromCenter = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2 || 1);
        const st = a + fromCenter * (b - a) * 0.35;
        const tt = smooth(seg(p, st, st + (b - a) * 0.65));
        css(s, 'opacity', f3(tt));
        css(s, 'filter', tt > 0.99 ? 'none' : `blur(${f3((1 - tt) * 12)}px)`);
        css(s, 'transform', `translate3d(${f3((1 - tt) * (i - (n - 1) / 2) * 0.45)}em, 0, 0)`);
      });
    }
    {
      const [a, b] = X.odyssey;
      const tt = seg(p, a, b);
      const e = easeInOut(tt);
      css(T.odyssey, 'clip-path', `inset(-10% ${f3((1 - e) * 100)}% -10% 0)`);
      css(T.odyssey, 'opacity', f3(Math.min(1, tt * 3)));
      css(T.odyssey, '--sheen', f3(lerp(-0.3, 1.3, tt)));
      css(T.odyssey, 'transform', `translate3d(0, ${f3((1 - easeOut3(tt)) * 0.06)}em, 0)`);
    }
    {
      const [a, b] = X.edition;
      const tt = easeOut3(seg(p, a, b));
      const inner = T.edition?.firstElementChild as HTMLElement | null;
      css(inner, 'transform', `translate3d(0, ${f3((1 - tt) * 102)}%, 0)`);
      css(T.edition, 'opacity', f3(Math.min(1, tt * 2)));
    }
    {
      const [a, b] = X.dates;
      const tt = easeOut3(seg(p, a, b));
      css(T.dates, 'opacity', f3(tt));
      css(T.dates, '--rule', f3(tt));
      css(T.dates, 'transform', `translate3d(${f3((1 - tt) * -18)}px, 0, 0)`);
    }
    {
      const [a, b] = X.duration;
      const tt = easeOut3(seg(p, a, b));
      css(T.duration, 'opacity', f3(tt));
      css(T.duration, 'clip-path', `inset(0 ${f3((1 - tt) * 100)}% 0 0)`);
    }
    {
      const [a, b] = X.powered;
      const tt = easeOut3(seg(p, a, b));
      css(T.powered, 'opacity', f3(tt));
      css(T.powered, 'transform', `translate3d(0, ${f3((1 - tt) * 14)}px, 0) scale(${f3(lerp(0.96, 1, tt))})`);
    }
    {
      const [a, b] = X.cta;
      const tt = easeOut3(seg(p, a, b));
      css(T.cta, 'opacity', f3(tt));
      css(T.cta, 'transform', `translate3d(0, ${f3((1 - tt) * 12)}px, 0)`);
      css(T.cta, 'visibility', tt > 0.02 ? 'visible' : 'hidden');
    }
    css(T.cue, 'opacity', f3(clamp01(seg(p, ...X.cue))));
  }
}
