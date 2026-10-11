import { asset } from '../data/asset';
import {
  CHOREO as K,
  type Chapter,
  bell,
  easeIn2,
  easeInOut,
  easeOut3,
  lerp,
  seg,
  smooth,
  sstep,
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
  sea: 'assets/ocean/ocean-open-sea-tile.webp',
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
const Z_CLOSE = 9.4;
const NAV_CLEARANCE = 84; // px: the CSI flag always sits below the fixed navbar

export type TextKey = 'intro' | 'introScrim' | 'hint' | 'logHeader' | 'logTrack' | 'deckTrack' | 'deckScrim';
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

type Item = { el: HTMLElement; top: number; h: number; chapter?: Chapter };
type Track = { items: Item[]; startY: number; endY: number; range: readonly [number, number] };
type Flyer = { el: HTMLElement; x: number; y: number; depth: number };

export class Director {
  private r: Renderer;
  private particles: Particles;
  private tex: Partial<Record<SceneKey, Tex>> = {};
  private W = 1;
  private H = 1;
  private flyers: Flyer[] = [];
  private log: Track = { items: [], startY: 0, endY: 0, range: K.log.track };
  private deck: Track = { items: [], startY: 0, endY: 0, range: K.deck.track };
  private chapterP: Record<Chapter, number> = { home: 0, timeline: 0.31, about: 0.72, sponsors: 0.86, register: 1 };
  private barrelY = 0;
  portrait = false;

  constructor(
    renderer: Renderer,
    particleCanvas: HTMLCanvasElement,
    private texts: TextRefs,
    mobile: boolean,
  ) {
    this.r = renderer;
    this.particles = new Particles(particleCanvas, mobile ? 30 : 48);
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
            this.tex[k] = this.r.upload(img, k === 'sea');
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

  /** where each navbar chapter lives on the timeline */
  chapters() {
    return this.chapterP;
  }

  chapterAt(p: number): Chapter {
    const order: Chapter[] = ['register', 'sponsors', 'about', 'timeline'];
    for (const c of order) if (p >= this.chapterP[c] - 0.012) return c;
    return 'home';
  }

  private focusY(which: 'log' | 'deck') {
    if (which === 'log') return this.barrelY || this.H * 0.54;
    return this.portrait ? this.H * 0.27 : this.H * 0.52;
  }

  private measureTrack(el: HTMLElement | null | undefined, t: Track, focus: number) {
    if (!el) return;
    t.items = Array.from(el.querySelectorAll<HTMLElement>('[data-item]')).map((it) => ({
      el: it,
      top: it.offsetTop,
      h: it.offsetHeight,
      chapter: (it.dataset.chapter as Chapter | undefined) || undefined,
    }));
    const last = t.items[t.items.length - 1];
    t.startY = this.H * 1.02;
    t.endY = last ? focus - (last.top + last.h / 2) : 0;
    // the scroll position at which each tagged entry is in focus
    for (const it of t.items) {
      if (!it.chapter) continue;
      const y = focus - (it.top + it.h / 2);
      const k = (t.startY - y) / Math.max(1, t.startY - t.endY);
      this.chapterP[it.chapter] = lerp(t.range[0], t.range[1], Math.min(1, Math.max(0, k)));
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.W = w;
    this.H = h;
    this.portrait = w / h < 0.95;
    this.r.resize(w, h, dpr);
    this.particles.resize(w, h, Math.min(dpr, 1.5));

    // title letters: measured at rest so they can fly past the camera
    const intro = this.texts.intro;
    if (intro) {
      const els = Array.from(intro.querySelectorAll<HTMLElement>('[data-fly]'));
      els.forEach((el) => {
        el.style.transform = 'none';
        styleCache.delete(el);
      });
      const origin = (intro.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? { left: 0, top: 0 };
      this.flyers = els.map((el, i) => {
        const b = el.getBoundingClientRect();
        const r = { left: b.left - origin.left, top: b.top - origin.top, width: b.width, height: b.height };
        const d = Number(el.dataset.fly) || 1;
        return { el, x: r.left + r.width / 2, y: r.top + r.height / 2, depth: d * (0.9 + ((i * 37) % 23) / 100) };
      });
    }
    this.barrelY = this.portrait ? 0.6 * h : 0.54 * h;
    this.measureTrack(this.texts.logTrack, this.log, this.barrelY);
    this.measureTrack(this.texts.deckTrack, this.deck, this.focusY('deck'));
    this.chapterP.register = Math.min(1, this.chapterP.register);
  }

  /** Render one frame at scroll progress p (0..1) and wall time t (s). */
  frame(p: number, t: number) {
    const { W, H, r, tex } = this;
    r.time = t;
    r.begin(0.004, 0.016, 0.032);

    // ------------------------------------------------------------ camera
    const s0 = Math.max(W / WIDE.w, H / WIDE.h);
    const zoomT = smooth(seg(p, K.zoomStart, K.zoomEnd));
    let z = Math.exp(lerp(0, Math.log(Z_CLOSE), zoomT));
    const zP = Math.max((1.25 * W * CLOSE.r) / (CLOSE.gapW * s0), (1.25 * H * CLOSE.r) / (CLOSE.gapH * s0));
    const pe = seg(p, K.zoomEnd, K.portalEnd); // portal progress
    if (pe > 0) z = Math.exp(lerp(Math.log(Z_CLOSE), Math.log(zP), Math.pow(pe, 1.6)));
    const s = s0 * z;

    const sx0 = W / 2 + (WIDE.nx - WIDE.w / 2) * s0;
    const sy0 = H / 2 + (WIDE.ny - WIDE.h / 2) * s0;
    const k = smooth(seg(p, K.zoomEnd, K.zoomEnd + 0.05));
    const Sx = lerp(lerp(sx0, W / 2, sstep(1, 4, z)), W / 2, k);
    const Sy = lerp(sy0, H / 2, k);
    const Tx = lerp(WIDE.nx, PORTAL_TARGET.x, k);
    const Ty = lerp(WIDE.ny, PORTAL_TARGET.y, k);
    const hx = Sx + (WIDE.nx - Tx) * s; // helmet anchor on screen
    let hy = Sy + (WIDE.ny - Ty) * s;
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

    // ------------------------------------------- 01 · desert and helmet
    // (never blurred: parallax alone carries the depth)
    const inDesert = p < K.portalEnd + 0.01;
    if (inDesert && tex.wide && z < 10.6) {
      const A = tex.wide;
      const aOp = 1 - sstep(9, 10.6, z);
      r.draw(A, { rect: place(A, WIDE.nx, WIDE.ny, 1, s0 * Math.pow(z, 0.88)), opacity: aOp });
      r.draw(A, { rect: place(A, WIDE.nx, WIDE.ny, 1, s), opacity: aOp, band: [0.585, 0.665] });
      r.draw(A, { rect: place(A, WIDE.nx, WIDE.ny, 1, s0 * Math.pow(z, 1.12)), opacity: aOp, band: [0.8, 0.94] });
    }
    const B = tex.approach;
    if (inDesert && B && z > 2 && z < 12.5) {
      const vf = 0.4 * (1 - sstep(4.3, 6.2, z));
      r.draw(B, {
        rect: place(B, APPROACH.nx, APPROACH.ny, APPROACH.r, s),
        opacity: sstep(2.2, 3.9, z) * (1 - sstep(10.5, 12.5, z)),
        vignette: vf > 0.01 ? [0.5, 0.5, vf] : null,
      });
    }

    // ------------------------------------------- 02 · into the helmet
    const C = tex.closeup;
    const CP = tex.portal;
    const holeOpen = sstep(K.zoomEnd, K.zoomEnd + 0.025, p);
    const D = tex.depths;
    const climb = easeInOut(seg(p, K.deepEnd, K.riseEnd));

    if (D && pe > 0 && p < 0.5) {
      // deep water seen through the helmet, then all around: the camera
      // keeps travelling forward at the speed it entered with
      const coverD = Math.max(W / D.w, H / D.h);
      const fwd = Math.exp(lerp(Math.log(1.06), Math.log(1.36), seg(p, K.zoomEnd, K.deepEnd + 0.04)));
      const sc = coverD * fwd * (1 + 0.02 * Math.sin(t * 0.11));
      const dw = D.w * sc;
      const dh = D.h * sc;
      r.draw(D, {
        rect: [(W - dw) / 2 + Math.sin(t * 0.07) * W * 0.006, (H - dh) / 2 + Math.sin(t * 0.13) * H * 0.004 + climb * H * 0.9, dw, dh],
        opacity: 1 - sstep(0.36, 0.44, p),
        brightness: lerp(0.18, 1, sstep(K.zoomEnd + 0.03, K.portalEnd + 0.015, p)) * lerp(1, 1.3, seg(p, K.portalEnd, K.deepEnd)),
        ripple: [0.0016, 13, -1],
        band: climb > 0.002 ? [0, 0.4] : null,
      });
    }

    if (C && z > 5 && p < K.portalEnd + 0.01) {
      const cOp = sstep(6, 8.7, z) * (1 - sstep(0.9, 1, pe));
      const vf = 0.32 * (1 - sstep(8.7, 10, z));
      const grade = {
        brightness: lerp(1, 0.2, Math.pow(pe, 0.75)), // light falls away inside the helmet
        saturation: lerp(1, 0.5, pe),
        tint: [0.02, 0.06, 0.12] as [number, number, number],
        tintAmount: 0.45 * pe,
        vignette: vf > 0.01 ? ([0.5, 0.5, vf] as [number, number, number]) : null,
      };
      const rect = place(C, CLOSE.nx, CLOSE.ny, CLOSE.r, s);
      if (CP && holeOpen > 0) r.draw(CP, { rect, opacity: cOp, ...grade });
      r.draw(C, { rect, opacity: cOp * (1 - (CP ? holeOpen : 0)), ...grade });
    }

    if (pe > 0) {
      const radius = lerp(0.16, 1.7, easeIn2(seg(pe, 0.3, 1)));
      r.fill([0.004, 0.014, 0.03, 1], [0.004, 0.014, 0.03, 1], {
        vignette: [radius, radius, 0.85],
        invertVignette: true,
        opacity: sstep(0.28, 0.7, pe) * (1 - sstep(K.portalEnd - 0.01, K.portalEnd + 0.04, p)),
      });
      r.fill([0, 0.01, 0.03, 1], [0, 0.01, 0.03, 1], {
        vignette: [0.62, 0.62, 0.75],
        opacity: 0.7 * sstep(0.05, 0.7, pe) * (1 - seg(p, K.portalEnd, K.deepEnd) * 0.4),
      });
    }

    // ------------------------------------------------- 05 · the open sea
    // drawn first: it waits above the waterline during the breach
    const SEA = tex.sea;
    const SH = tex.ship;
    const [b0, b1] = K.breach;
    const breach = easeInOut(seg(p, b0, b1));
    const lineY = lerp(-0.1 * H, 1.15 * H, breach);
    // the ship and the sea share one scale, so its wake sits in waves of the
    // same size; the sea tiles seamlessly and flows past as the ship sails
    const shipScale = SH
      ? this.portrait
        ? Math.min((0.92 * W) / SH.w, (0.52 * H) / SH.h)
        : Math.min((H - NAV_CLEARANCE - 0.035 * H) / SH.h, (0.42 * W) / SH.w)
      : 1;
    if (SEA && p > b0) {
      const sc = shipScale * lerp(1.4, 1, easeOut3(seg(p, ...K.lift)));
      const sx = W / (SEA.w * sc);
      const sy = H / (SEA.h * sc);
      // forward travel: the water streams under the ship as you scroll
      const travel = seg(p, K.lift[0], 1) * (this.portrait ? 3.2 : 2.4) + t * 0.004;
      const glow = 1 - sstep(b0, K.lift[1], p);
      r.draw(SEA, {
        rect: [0, 0, W, H],
        uv: [0.5 - sx / 2 + Math.sin(t * 0.05) * 0.004, 0.5 - sy / 2 + travel, sx, sy],
        ripple: [0.0012 + 0.004 * glow, 22, -1],
        brightness: 1 + 0.45 * glow,
        tint: [0.12, 0.5, 0.66],
        tintAmount: 0.22 * glow,
      });
    }

    // ------------------------------- 03-04 · ascent with barrel and log
    const R = tex.rays;
    if (R && p > K.deepEnd - 0.01 && p < b1 + 0.01) {
      const rs = Math.max(W / R.w, (1.9 * H) / R.h) * 1.02;
      const rw = R.w * rs;
      const rh = R.h * rs;
      r.draw(R, {
        rect: [(W - rw) / 2 + Math.sin(t * 0.08) * W * 0.004, lerp(H - rh, -0.02 * rh, easeInOut(seg(p, K.deepEnd, K.riseEnd + 0.005))), rw, rh],
        opacity: sstep(K.deepEnd - 0.01, K.deepEnd + 0.05, p),
        // brightens on the way up, then deepens toward the sea's colour at the breach
        brightness: lerp(0.28, 1.04, sstep(0.38, 0.57, p)) * lerp(1, 0.72, sstep(b0, b1, p)),
        tint: [0.03, 0.17, 0.3],
        tintAmount: 0.35 * sstep(b0, b1, p),
        ripple: [0.0012 + 0.0022 * sstep(0.55, 0.6, p), 18, -1],
        water: p > b0 ? [lineY, 14, 8, 1] : null, // only the part below the waterline
      });
    }

    const BR = tex.barrel;
    {
      const [e0, e1] = K.barrel.enter;
      const [x0, x1] = K.barrel.exit;
      const bh = this.portrait ? 0.24 * H : 0.36 * H;
      const restY = this.portrait ? 0.6 * H : 0.54 * H;
      const inT = easeOut3(seg(p, e0, e1));
      const outT = easeInOut(seg(p, x0, x1));
      // drifts upward with the scroll while the log passes, swaying as it rises;
      // then recedes towards the bright surface and melts into the glare
      const drift = seg(p, e1, x0);
      const rest = restY - drift * 0.12 * H;
      const by = lerp(H + bh, rest, inT) - outT * (rest - 0.16 * H) + Math.sin(t * 0.9) * H * 0.006;
      this.barrelY = by;
      if (BR && p > e0 && p < x1 + 0.005) {
        const shrink = lerp(1, 0.5, outT);
        const bhh = bh * shrink;
        const bw = (BR.w / BR.h) * bhh;
        const bx = (this.portrait ? W * 0.83 : W / 2) + Math.sin(p * 34) * W * 0.012;
        const depth = 1 - sstep(0.36, 0.58, p); // 1 = deep, 0 = just under the surface
        const fade = 1 - sstep(x0 + (x1 - x0) * 0.45, x1, p);
        const rect: [number, number, number, number] = [bx - bw / 2 + Math.sin(t * 0.55) * W * 0.003, by - bhh / 2, bw, bhh];
        const rotation = Math.sin(p * 26) * 0.07 + Math.sin(t * 0.6) * 0.025 - 0.04;
        r.draw(BR, {
          rect,
          rotation,
          opacity: fade,
          brightness: lerp(1.02, 0.5, depth) * (1 + 0.25 * outT),
          saturation: lerp(0.92, 0.55, depth),
          tint: [0.06, 0.24, 0.34],
          tintAmount: lerp(0.2, 0.55, depth) + 0.2 * outT,
          ripple: [0.0025, 9, -1],
        });
        // lit from the surface above: the underside falls into the water's colour
        r.draw(BR, {
          rect,
          rotation,
          brightness: 0.4,
          saturation: 0.4,
          tint: [0.02, 0.12, 0.2],
          tintAmount: 0.75,
          band: [0.25, 1],
          opacity: 0.75 * fade,
          ripple: [0.0025, 9, -1],
        });
      }
    }

    // sunlight shafts: only briefly, as the surface comes near
    const [ra, rb, rc, rd] = K.rays;
    r.rays(0.4 * sstep(ra, rb, p) * (1 - sstep(rc, rd, p)), 0.5 + Math.sin(t * 0.05) * 0.03, -0.1, 1);
    // the lens clears as it leaves the water
    r.fill([1, 0.97, 0.9, 0.16], [1, 0.97, 0.92, 0.05], { opacity: bell(p, (b0 + b1) / 2, 0.012) });

    // ------------------------------------- 06 · the CSI ship on that sea
    if (SH && p > K.shipIn[0]) {
      const w2 = SH.w * shipScale;
      const h2 = SH.h * shipScale;
      const top = this.portrait ? Math.max(0.47 * H, H - h2 + 0.01 * H) : NAV_CLEARANCE;
      const inT = easeOut3(seg(p, ...K.shipIn));
      const sail = seg(p, K.shipIn[1], 1);
      // pitch and roll in the swell; it presses forward a touch as you scroll
      const y = lerp(-h2 - 0.04 * H, top, inT) + sail * 0.02 * H + Math.sin(t * 0.8) * 0.003 * H;
      const x = W / 2 - w2 / 2 + Math.sin(p * 18) * W * 0.006;
      r.draw(SH, { rect: [x, y, w2, h2], rotation: Math.sin(t * 0.5) * 0.004 + Math.sin(p * 18) * 0.008 });
    }

    // lens vignette — always on, subtle
    r.fill([0, 0, 0, 1], [0, 0, 0, 1], { vignette: [0.8, 0.8, 0.6], opacity: 0.3 });

    // bubbles in the deep and during the ascent (nothing else floats)
    this.particles.render({
      time: t,
      fwd: seg(p, K.portalEnd, K.deepEnd) * 0.5 + climb * 0.25,
      rise: climb * 2.4,
      dust: 0,
      motes: 0,
      bubbles: 0.65 * sstep(0.22, 0.27, p) * (1 - sstep(0.55, 0.585, p)),
      spray: 0,
      sprayAlpha: 0,
    });

    // ------------------------------------------------- navbar contrast
    let glass: number;
    if (p < K.zoomEnd) glass = 0.3;
    else if (p < K.deepEnd) glass = lerp(0.3, 0.12, pe);
    else if (p < b1) glass = lerp(0.12, 0.42, sstep(0.45, 0.58, p));
    else glass = lerp(0.42, 0.36, sstep(b1, K.shipIn[0], p));
    document.documentElement.style.setProperty('--nav-glass', glass.toFixed(3));

    this.text(p, sx0, sy0);
  }

  // ------------------------------------------------------------- text
  private runTrack(el: HTMLElement | null | undefined, tr: Track, p: number, focus: number, band: [number, number], hold: boolean) {
    const [ta, tb] = tr.range;
    const on = p > ta - 0.01 && (hold || p < tb + 0.02);
    css(el, 'visibility', on ? 'visible' : 'hidden');
    if (!on || !tr.items.length) return;
    const y = lerp(tr.startY, Math.min(tr.endY, tr.startY - 1), seg(p, ta, tb));
    css(el, 'transform', `translate3d(0, ${f3(y)}px, 0)`);
    css(el, 'opacity', f3(sstep(ta - 0.01, ta + 0.02, p) * (hold ? 1 : 1 - sstep(tb - 0.01, tb + 0.02, p))));
    const { H } = this;
    for (const it of tr.items) {
      const cy = y + it.top + it.h / 2;
      const f = 1 - sstep(0.04, 0.42, Math.abs(cy - focus) / H);
      const edge = sstep(band[0], band[0] + H * 0.16, cy) * (1 - sstep(band[1] - H * 0.12, band[1], cy));
      css(it.el, 'opacity', f3((0.16 + 0.84 * f) * edge));
      css(it.el, '--focus', f3(f));
    }
  }

  private text(p: number, fx: number, fy: number) {
    const T = this.texts;
    const { H } = this;

    // ---- the title is *in* the scene, nearer than the helmet: as the
    // camera pushes in, its letters swell and stream past the lens
    {
      const [a, b] = K.title;
      const tt = easeIn2(seg(p, a, b));
      const on = tt < 0.999;
      css(T.intro, 'visibility', on ? 'visible' : 'hidden');
      css(T.introScrim, 'opacity', f3(1 - smooth(seg(p, a, b))));
      if (on) {
        for (const f of this.flyers) {
          const m = Math.exp(Math.log(4.2) * tt * f.depth);
          const dx = (f.x - fx) * (m - 1);
          const dy = (f.y - fy) * (m - 1);
          css(f.el, 'transform', `translate3d(${f3(dx)}px, ${f3(dy)}px, 0) scale(${f3(m)})`);
          css(f.el, 'opacity', f3(1 - sstep(1.5, 3.0, m)));
        }
      }
    }
    css(T.hint, 'opacity', f3(1 - sstep(0.002, 0.016, p)));

    // ---- the voyage log rises past the barrel
    {
      const [ha, hb, hc, hd] = K.log.header;
      const hv = seg(p, ha, hb) * (1 - seg(p, hc, hd));
      css(T.logHeader, 'opacity', f3(hv));
      css(T.logHeader, 'visibility', hv > 0.001 ? 'visible' : 'hidden');
      this.runTrack(T.logTrack, this.log, p, this.barrelY, [H * (this.portrait ? 0.2 : 0.16), H * 1.05], false);
    }

    // ---- about, allies and the invitation sail in with the ship
    css(T.deckScrim, 'opacity', f3(sstep(K.shipIn[0] + 0.02, K.deck.track[0] + 0.02, p)));
    const band: [number, number] = this.portrait ? [H * 0.07, H * 0.47] : [H * 0.12, H * 1.04];
    this.runTrack(T.deckTrack, this.deck, p, this.focusY('deck'), band, true);
  }
}
