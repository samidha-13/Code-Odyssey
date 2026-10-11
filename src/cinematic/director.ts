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
  barrel: 'assets/props/barrel.webp',
  under: 'assets/ocean/ocean-surface-from-below.webp',
  surface: 'assets/ocean/ocean-surface.webp',
  sea: 'assets/ocean/ocean-open-sea.webp',
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
  | 'intro'
  | 'introScrim'
  | 'introCode'
  | 'introOdyssey'
  | 'introEdition'
  | 'introMeta'
  | 'hint'
  | 'logHeader'
  | 'logTrack'
  | 'finale'
  | 'finaleScrim'
  | 'fEyebrow'
  | 'fLogo'
  | 'fCopy'
  | 'fIdentity'
  | 'fCta'
  | 'cue';

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

type LogItem = { el: HTMLElement; top: number; h: number };

export class Director {
  private r: Renderer;
  private particles: Particles;
  private tex: Partial<Record<SceneKey, Tex>> = {};
  private W = 1;
  private H = 1;
  private letters = new Map<HTMLElement, HTMLElement[]>();
  private log: LogItem[] = [];
  private logH = 0;
  /** last barrel centre (px), shared with the voyage log so they move together */
  private barrelY = 0;
  portrait = false;

  constructor(
    renderer: Renderer,
    particleCanvas: HTMLCanvasElement,
    private texts: TextRefs,
    mobile: boolean,
  ) {
    this.r = renderer;
    this.particles = new Particles(particleCanvas, mobile ? 36 : 60);
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
    this.r.resize(w, h, dpr);
    this.particles.resize(w, h, Math.min(dpr, 1.5));
    // measure the voyage log once per layout, never during scroll
    const track = this.texts.logTrack;
    if (track) {
      this.log = Array.from(track.querySelectorAll<HTMLElement>('[data-log-item]')).map((el) => ({
        el,
        top: el.offsetTop,
        h: el.offsetHeight,
      }));
      this.logH = track.scrollHeight;
    }
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
    r.begin(0.004, 0.016, 0.032);

    // ------------------------------------------------------------ camera
    const s0 = Math.max(W / WIDE.w, H / WIDE.h);
    const zoomT = smooth(seg(p, K.zoomStart, K.zoomEnd));
    const drift = 1 + 0.03 * smooth(seg(p, 0, K.zoomStart + 0.02)); // a gentle push while the title leaves
    let z = Math.exp(lerp(0, Math.log(Z_CLOSE), zoomT)) * drift;
    const zP = Math.max((1.25 * W * CLOSE.r) / (CLOSE.gapW * s0), (1.25 * H * CLOSE.r) / (CLOSE.gapH * s0));
    const pe = seg(p, K.zoomEnd, K.portalEnd); // portal progress
    if (pe > 0) z = Math.exp(lerp(Math.log(Z_CLOSE * drift), Math.log(zP), Math.pow(pe, 1.6)));
    const s = s0 * z;

    const sx0 = W / 2 + (WIDE.nx - WIDE.w / 2) * s0;
    const sy0 = H / 2 + (WIDE.ny - WIDE.h / 2) * s0;
    const k = smooth(seg(p, K.zoomEnd, K.zoomEnd + 0.06));
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
    const holeOpen = sstep(K.zoomEnd, K.zoomEnd + 0.03, p);
    const D = tex.depths;
    const coverD = D ? Math.max(W / D.w, H / D.h) : 1;
    const climb = easeInOut(seg(p, K.deepEnd, K.riseEnd));

    if (D && pe > 0 && p < 0.6) {
      // the deep ocean, glimpsed first *through* the helmet's openings
      const fwd = lerp(1.08, 1.16, pe) * lerp(1, 1.18, seg(p, K.portalEnd, K.deepEnd + 0.06));
      const sc = coverD * fwd * (1 + 0.025 * Math.sin(t * 0.11));
      const dw = D.w * sc;
      const dh = D.h * sc;
      r.draw(D, {
        rect: [(W - dw) / 2 + Math.sin(t * 0.07) * W * 0.006, (H - dh) / 2 + Math.sin(t * 0.13) * H * 0.004 + climb * H * 0.9, dw, dh],
        opacity: 1 - sstep(0.43, 0.52, p),
        brightness: lerp(0.18, 1, sstep(K.zoomEnd + 0.03, K.portalEnd + 0.02, p)) * lerp(1, 1.3, seg(p, K.portalEnd, K.deepEnd)),
        ripple: [0.0016, 13, -1], // water in motion
        band: climb > 0.002 ? [0, 0.4] : null,
      });
    }

    if (C && z > 5 && p < K.portalEnd + 0.01) {
      const cOp = sstep(6, 8.7, z) * (1 - sstep(0.9, 1, pe));
      const vf = 0.32 * (1 - sstep(8.7, 10, z));
      const grade = {
        brightness: lerp(1, 0.22, Math.pow(pe, 0.75)),
        saturation: lerp(1, 0.45, pe),
        tint: [0.02, 0.06, 0.12] as [number, number, number],
        tintAmount: 0.45 * pe,
        blur: 1.6 * sstep(0.35, 1, pe),
        vignette: vf > 0.01 ? ([0.5, 0.5, vf] as [number, number, number]) : null,
        focus: [0.5, 0.5, 0.4, 1.5 * sstep(8, 10, z)] as [number, number, number, number],
      };
      const rect = place(C, CLOSE.nx, CLOSE.ny, CLOSE.r, s);
      if (CP && holeOpen > 0) r.draw(CP, { rect, opacity: cOp, ...grade });
      r.draw(C, { rect, opacity: cOp * (1 - (CP ? holeOpen : 0)), ...grade });
    }

    if (pe > 0) {
      // the helmet's interior swallows the frame from the centre outwards, so
      // the sand never "cuts" to water: bronze → shadow → deep water
      const radius = lerp(0.16, 1.7, easeIn2(seg(pe, 0.3, 1)));
      r.fill([0.004, 0.014, 0.03, 1], [0.004, 0.014, 0.03, 1], {
        vignette: [radius, radius, 0.85],
        invertVignette: true,
        opacity: sstep(0.28, 0.7, pe) * (1 - sstep(K.portalEnd - 0.01, K.portalEnd + 0.045, p)),
      });
      // and the edges darken as the bronze closes around the lens
      r.fill([0, 0.01, 0.03, 1], [0, 0.01, 0.03, 1], {
        vignette: [0.62, 0.62, 0.75],
        opacity: 0.7 * sstep(0.05, 0.7, pe) * (1 - seg(p, K.portalEnd, K.deepEnd) * 0.4),
      });
    }

    // ------------------------- scene 03-04: deep ocean → ascent with barrel
    const R = tex.rays;
    if (R && p > K.deepEnd - 0.01 && p < K.breachEnd + 0.01) {
      const rs = Math.max(W / R.w, (1.9 * H) / R.h) * 1.02;
      const rw = R.w * rs;
      const rh = R.h * rs;
      const c2 = easeInOut(seg(p, K.deepEnd, K.riseEnd + 0.01));
      r.draw(R, {
        rect: [(W - rw) / 2 + Math.sin(t * 0.08) * W * 0.004, lerp(H - rh, -0.02 * rh, c2), rw, rh],
        opacity: sstep(K.deepEnd - 0.01, K.deepEnd + 0.05, p),
        brightness: lerp(0.28, 1.05, sstep(0.48, 0.72, p)),
        ripple: [0.0012 + 0.001 * sstep(0.6, 0.72, p), 18, -1],
      });
    }

    // the barrel: rises from the depths, keeps pace with us, then leads us up
    const BR = tex.barrel;
    {
      const [e0, e1] = K.barrel.enter;
      const [x0, x1] = K.barrel.exit;
      const bh = this.portrait ? 0.24 * H : 0.36 * H;
      const restY = this.portrait ? 0.6 * H : 0.54 * H;
      const inT = easeOut3(seg(p, e0, e1));
      const outT = easeIn2(seg(p, x0, x1));
      const by = lerp(H + bh, restY, inT) - outT * (restY + bh * 1.2) + Math.sin(t * 0.9) * H * 0.008;
      this.barrelY = by;
      if (BR && p > e0 && p < x1 + 0.005) {
        const bw = (BR.w / BR.h) * bh;
        const bx = this.portrait ? W * 0.83 : W / 2;
        const depth = 1 - sstep(0.45, 0.73, p); // 1 = deep, 0 = near the surface
        r.draw(BR, {
          rect: [bx - bw / 2 + Math.sin(t * 0.55) * W * 0.004, by - bh / 2, bw, bh],
          rotation: Math.sin(t * 0.6) * 0.045 + Math.sin(t * 0.23) * 0.03 - 0.05,
          brightness: lerp(1.04, 0.5, depth),
          saturation: lerp(0.95, 0.55, depth),
          tint: [0.06, 0.24, 0.34],
          tintAmount: lerp(0.18, 0.55, depth),
          blur: 0.4 * depth,
          ripple: [0.0025, 9, -1],
        });
      }
    }

    // sunlight shafts: only briefly, as the surface comes near
    const rayI = 0.42 * sstep(0.665, 0.715, p) * (1 - sstep(0.75, 0.785, p));
    r.rays(rayI, 0.5 + Math.sin(t * 0.05) * 0.03, -0.1, 1);

    // open sea (aerial) waits beneath the horizon plate for the tilt
    const tilt = easeInOut(seg(p, K.tiltStart, K.tiltEnd));
    const SEA = tex.sea;
    const SH = tex.ship;
    if (SEA && p > K.tiltStart - 0.006) {
      // open sea in two layers drifting at different rates → living swell
      const base = Math.max(W / SEA.w, H / SEA.h);
      const flow = seg(p, K.tiltStart, 1);
      const enter = (1 - tilt) * 0.55 * H;
      const op = sstep(K.tiltStart - 0.006, K.tiltStart + 0.012, p);
      {
        const sc = base * 1.28;
        const w = SEA.w * sc;
        const h = SEA.h * sc;
        r.draw(SEA, {
          rect: [(W - w) / 2, (H - h) / 2 + enter + lerp(0.45, -0.45, flow) * (h - H) * 0.5, w, h],
          opacity: op,
          ripple: [0.0022, 21, -1],
        });
      }
      {
        const sc = base * 1.75;
        const w = SEA.w * sc;
        const h = SEA.h * sc;
        r.draw(SEA, {
          rect: [(W - w) / 2 + Math.sin(t * 0.05) * W * 0.01, (H - h) / 2 + enter * 1.2 + lerp(0.5, -0.5, flow) * (h - H) * 0.5, w, h],
          opacity: op * 0.28,
          brightness: 1.15,
          ripple: [0.003, 12, -1],
        });
      }
    }
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
    if (S && p > K.breachStart && p < K.tiltEnd + 0.01) {
      const ss = Math.max(W / S.w, H / S.h) * 1.1;
      const sw = S.w * ss;
      const sh = S.h * ss;
      const bob = Math.sin(t * 0.8) * H * 0.005 + Math.sin(t * 0.37 + 1) * H * 0.003;
      const horizon = 0.42 * H + bob - tilt * 1.32 * H;
      r.draw(S, {
        rect: [(W - sw) / 2, horizon - SURFACE_HORIZON * sh, sw, sh],
        opacity: sstep(K.breachStart, K.breachStart + 0.012, p) * (1 - sstep(K.tiltStart + 0.03, K.tiltEnd + 0.012, p)),
        ripple: [0.0011 + 0.0065 * (1 - sstep(0.79, 0.84, p)), 14, SURFACE_HORIZON + 0.01],
        water: p < K.breachEnd + 0.004 ? [lineY, 12, 7, -1] : null,
        // once the camera tilts, feather the plate's edges into the open sea
        vignette: tilt > 0.001 ? [8, 0.5, 0.42 * sstep(0, 0.25, tilt)] : null,
      });
    }
    // a brief wash of sunlight as the lens clears
    r.fill([1, 0.96, 0.88, 0.24], [1, 0.97, 0.92, 0.08], { opacity: bell(p, 0.768, 0.013) });

    // ------------------------------------------ scene 06: the CSI ship
    // sea haze hides the change of viewpoint during the tilt
    r.fill([0.78, 0.88, 0.96, 0.42], [0.55, 0.72, 0.86, 0.14], { opacity: bell(p, K.tiltStart + 0.024, 0.012) });

    if (SH && p > K.shipIn[0]) {
      const shipIn = easeOut3(seg(p, K.shipIn[0], K.shipIn[1]));
      const glide = seg(p, K.shipIn[1], 1);
      const h2 = this.portrait ? Math.min(0.72 * H, (1.12 * W * SH.h) / SH.w) : 1.0 * H;
      const w2 = (SH.w / SH.h) * h2;
      const top = this.portrait ? H - h2 + 0.04 * H : 0.01 * H;
      const y = top - (1 - shipIn) * 1.05 * H + glide * 0.025 * H + Math.sin(t * 0.8) * 0.004 * H;
      r.draw(SH, {
        rect: [W / 2 - w2 / 2, y, w2, h2],
        rotation: Math.sin(t * 0.5) * 0.006,
        opacity: sstep(K.shipIn[0], K.shipIn[0] + 0.02, p),
      });
    }

    // lens vignette — always on, subtle
    r.fill([0, 0, 0, 1], [0, 0, 0, 1], { vignette: [0.8, 0.8, 0.6], opacity: 0.32 });

    // ------------------------------------------------ particles (sparse)
    this.particles.render({
      time: t,
      fwd: seg(p, K.portalEnd, K.deepEnd) * 0.5 + climb * 0.25,
      rise: climb * 2.4,
      dust: 0,
      motes: 0,
      bubbles: 0.7 * sstep(0.27, 0.33, p) * (1 - sstep(0.72, 0.76, p)),
      spray: seg(p, 0.765, 0.83),
      sprayAlpha: 0.7 * sstep(0.765, 0.775, p) * (1 - sstep(0.812, 0.83, p)),
    });

    // ------------------------------------------------- navbar contrast
    let glass: number;
    if (p < K.zoomEnd) glass = 0.3;
    else if (p < K.deepEnd) glass = lerp(0.3, 0.12, pe);
    else if (p < 0.85) glass = lerp(0.12, 0.5, sstep(0.6, 0.74, p));
    else glass = lerp(0.5, 0.34, sstep(0.85, 0.88, p));
    document.documentElement.style.setProperty('--nav-glass', glass.toFixed(3));

    this.text(p);
  }

  // ------------------------------------------------------------- text
  private text(p: number) {
    const T = this.texts;
    const X = K.text;
    const { H } = this;

    // ---- the title over the sand: leaves as soon as the voyage begins
    {
      const [a, b] = X.intro;
      const out = smooth(seg(p, a, b));
      const vis = out < 0.999;
      css(T.intro, 'visibility', vis ? 'visible' : 'hidden');
      css(T.introScrim, 'opacity', f3(1 - out));
      if (vis) {
        css(T.intro, 'opacity', f3(1 - out));
        css(T.intro, 'transform', `translate3d(0, ${f3(-out * H * 0.12)}px, 0) scale(${f3(1 + out * 0.06)})`);
        css(T.intro, 'filter', out > 0.01 ? `blur(${f3(out * 10)}px)` : 'none');
        const L = this.lettersOf(T.introCode);
        const n = L.length;
        L.forEach((s, i) => css(s, 'transform', `translate3d(${f3((i - (n - 1) / 2) * out * 0.5)}em, 0, 0)`));
      }
    }
    css(T.hint, 'opacity', f3(win(p, ...X.hint)));

    // ---- the voyage log rises in step with the barrel
    {
      const [ha, hb, hc, hd] = K.log.header;
      css(T.logHeader, 'opacity', f3(win(p, ha, hb, hc, hd)));
      css(T.logHeader, 'visibility', p > ha && p < hd ? 'visible' : 'hidden');
      const [ta, tb] = K.log.track;
      const on = p > ta - 0.01 && p < tb + 0.02;
      css(T.logTrack, 'visibility', on ? 'visible' : 'hidden');
      if (on && this.log.length) {
        const focusY = this.barrelY;
        // first entry starts below the frame; last one leaves above the barrel
        const start = H * 1.02;
        const end = this.barrelY - this.logH + H * 0.08;
        const y = lerp(start, Math.min(end, start - 1), seg(p, ta, tb));
        css(T.logTrack, 'transform', `translate3d(0, ${f3(y)}px, 0)`);
        css(T.logTrack, 'opacity', f3(sstep(ta - 0.01, ta + 0.02, p) * (1 - sstep(tb - 0.01, tb + 0.02, p))));
        for (const it of this.log) {
          const cy = y + it.top + it.h / 2;
          const d = Math.abs(cy - focusY) / H;
          const f = 1 - sstep(0.04, 0.42, d);
          // fade out before reaching the date header at the top of the frame
          const edge = sstep(H * 0.16, H * 0.34, cy) * (1 - sstep(H * 0.92, H * 1.05, cy));
          css(it.el, 'opacity', f3((0.18 + 0.82 * f) * edge));
          css(it.el, 'filter', f > 0.97 ? 'none' : `blur(${f3((1 - f) * 2.4)}px)`);
          css(it.el, '--focus', f3(f));
        }
      }
    }

    // ---- the ship's allies
    const F = X.finale;
    const finOn = p > F.eyebrow[0] - 0.004;
    css(T.finale, 'visibility', finOn ? 'visible' : 'hidden');
    css(T.finaleScrim, 'opacity', f3(sstep(0.86, 0.9, p)));
    if (!finOn) return;
    const rise = (el: HTMLElement | null | undefined, [a, b]: readonly [number, number], dist = 22) => {
      const tt = easeOut3(seg(p, a, b));
      css(el, 'opacity', f3(tt));
      css(el, 'transform', `translate3d(0, ${f3((1 - tt) * dist)}px, 0)`);
      return tt;
    };
    rise(T.fEyebrow, F.eyebrow, 14);
    {
      const tt = easeOut3(seg(p, ...F.logo));
      css(T.fLogo, 'opacity', f3(tt));
      css(T.fLogo, 'transform', `translate3d(0, ${f3((1 - tt) * 18)}px, 0) scale(${f3(lerp(0.94, 1, tt))})`);
      css(T.fLogo, 'clip-path', `inset(0 0 ${f3((1 - tt) * 100)}% 0)`);
    }
    rise(T.fCopy, F.copy);
    rise(T.fIdentity, F.identity);
    const c = rise(T.fCta, F.cta, 12);
    css(T.fCta, 'visibility', c > 0.02 ? 'visible' : 'hidden');
    css(T.cue, 'opacity', f3(clamp01(seg(p, ...F.cue))));
  }
}
