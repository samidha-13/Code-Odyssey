import { asset } from '../data/asset';
import { CHOREO as K, type Chapter, at, bottleFilm, easeInOut, easeOut3, lerp, seg, smooth, sstep } from './choreography';

const easeOutBack = (t: number) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
import { Particles } from './particles';
import { Renderer, type Tex } from './renderer';

/** Still plates. The two films are image sequences (see FILMS). */
export const SCENE_ASSETS = {
  title: 'assets/title/code-odyssey-title.webp',
  sea: 'assets/ocean/ocean-open-sea-tile.webp',
  ship: 'assets/ship/csi-ship.webp',
} as const;
type SceneKey = keyof typeof SCENE_ASSETS;

/** scroll-scrubbed films, extracted by scripts/extract_frames.sh */
const FILMS = { hero: { frames: 150 }, bottle: { frames: 150 } } as const;
type FilmKey = keyof typeof FILMS;

const NAV_CLEARANCE = 84; // px: the CSI flag always sits below the fixed navbar

export type TextKey =
  | 'introEyebrow'
  | 'introMeta'
  | 'hint'
  | 'aboutTrack'
  | 'aboutScrim'
  | 'paperNote'
  | 'logHeader'
  | 'logTrack'
  | 'deckTrack'
  | 'deckScrim';
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
const pad = (i: number) => String(i).padStart(4, '0');

type Item = { el: HTMLElement; top: number; h: number; chapter?: Chapter };
type Track = {
  items: Item[];
  startY: number;
  endY: number;
  range: readonly [number, number];
  /** scroll progress at which each item sits at the focus line */
  stops: number[];
  /** how far from the focus (in viewport heights) an item starts to dim, and is fully dim */
  falloff: [number, number];
};
type Rect = [number, number, number, number];

/**
 * An image sequence scrubbed by scroll. Two textures hold the frames either
 * side of the current position and are cross-faded, so motion stays smooth
 * between the extracted frames.
 */
class Film {
  imgs: (HTMLImageElement | null)[];
  private a: Tex | null = null;
  private b: Tex | null = null;
  private ia = -1;
  private ib = -1;
  constructor(
    readonly key: FilmKey,
    readonly n: number,
    private set: 'd' | 'm',
  ) {
    this.imgs = new Array(n).fill(null);
  }
  url(i: number) {
    return asset(`assets/frames/${this.key}/${this.set}/${pad(i + 1)}.webp`);
  }
  /** load order: coarse to fine, so scrubbing works before every frame arrives */
  order() {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const step of [16, 8, 4, 2, 1])
      for (let i = 0; i < this.n; i += step)
        if (!seen.has(i)) {
          seen.add(i);
          out.push(i);
        }
    if (!seen.has(this.n - 1)) out.push(this.n - 1);
    return out;
  }
  private nearest(i: number) {
    for (let d = 0; d < this.n; d++) {
      if (this.imgs[i - d]) return i - d;
      if (this.imgs[i + d]) return i + d;
    }
    return -1;
  }
  get size(): [number, number] {
    const im = this.imgs.find(Boolean);
    return im ? [im.naturalWidth, im.naturalHeight] : [16, 9];
  }
  draw(r: Renderer, f: number, rect: Rect, opacity: number, extra: Partial<Parameters<Renderer['draw']>[1]> = {}) {
    if (opacity <= 0.002) return;
    const i0 = Math.max(0, Math.min(this.n - 1, Math.floor(f)));
    const i1 = Math.min(this.n - 1, i0 + 1);
    const t = f - i0;
    const ja = this.nearest(i0);
    if (ja < 0) return;
    const jb = this.imgs[i1] ? i1 : ja;
    if (ja === this.ib && jb !== this.ib) {
      [this.a, this.b] = [this.b, this.a];
      [this.ia, this.ib] = [this.ib, this.ia];
    }
    if (ja !== this.ia) {
      this.a = r.uploadFrame(this.imgs[ja]!, this.a);
      this.ia = ja;
    }
    r.draw(this.a!, { rect, opacity, ...extra });
    if (jb !== ja && t > 0.01) {
      if (jb !== this.ib) {
        this.b = r.uploadFrame(this.imgs[jb]!, this.b);
        this.ib = jb;
      }
      r.draw(this.b!, { rect, opacity: opacity * t, ...extra });
    }
  }
}

export class Director {
  private r: Renderer;
  private atmos: Particles;
  private tex: Partial<Record<SceneKey, Tex>> = {};
  private films: Record<FilmKey, Film>;
  private W = 1;
  private H = 1;
  private aboutLines: HTMLElement[] = [];
  private inkLines: HTMLElement[] = [];
  // the log is a timeline: neighbouring milestones stay readable together
  private log: Track = { items: [], startY: 0, endY: 0, range: K.log.track, stops: [], falloff: [0.22, 0.75] };
  private deck: Track = { items: [], startY: 0, endY: 0, range: K.deck.track, stops: [], falloff: [0.04, 0.42] };
  private chapterP: Record<Chapter, number> = { home: 0, about: 0.25, timeline: 0.36, sponsors: 0.9, register: 0.94 };
  private mobile: boolean;
  portrait = false;
  private paperRect: Rect = [0, 0, 1, 1];
  private paperSet: 'd' | 'm' = 'd';
  /** a stretch of the timeline [a, b] given f times its scroll (the log on a phone) */
  private slow = { a: K.log.track[0], b: K.log.track[1], f: 1 };

  constructor(
    renderer: Renderer,
    particleCanvas: HTMLCanvasElement,
    private texts: TextRefs,
    mobile: boolean,
  ) {
    this.r = renderer;
    this.mobile = mobile;
    this.atmos = new Particles(particleCanvas, mobile ? 0 : 0);
    const set = mobile ? 'm' : 'd';
    this.films = {
      hero: new Film('hero', FILMS.hero.frames, set),
      bottle: new Film('bottle', FILMS.bottle.frames, set),
    };
  }

  /** The first hero frame and the title first; then the films, then the sea. */
  async load(onCritical: () => void, onProgress: (f: number) => void) {
    const filmFrames = this.films.hero.n + this.films.bottle.n;
    const total = Object.keys(SCENE_ASSETS).length + filmFrames;
    let done = 0;
    const tick = () => onProgress(++done / total);
    const img = (src: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => resolve(im);
        im.onerror = () => {
          console.warn(`[cinematic] failed to load ${src}`);
          resolve(null);
        };
        im.src = src;
      });
    const still = async (k: SceneKey) => {
      const im = await img(asset(SCENE_ASSETS[k]));
      if (im) {
        try {
          this.tex[k] = this.r.upload(im, k === 'sea');
          if (k === 'title') this.atmos.setTitle(im, this.mobile ? 700 : 1500);
        } catch {
          /* a missing plate just isn't drawn */
        }
      }
      tick();
    };
    const film = async (f: Film, order = f.order()) => {
      let next = 0;
      const worker = async () => {
        while (next < order.length) {
          const i = order[next++];
          f.imgs[i] = f.imgs[i] ?? (await img(f.url(i)));
          tick();
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
    };

    const hero = this.films.hero;
    hero.imgs[0] = await img(hero.url(0));
    tick();
    await still('title');
    onCritical();
    await film(hero, hero.order().filter((i) => i !== 0));
    await film(this.films.bottle);
    await Promise.all([still('sea'), still('ship')]);
  }

  chapters() {
    return this.chapterP;
  }

  chapterAt(p: number): Chapter {
    const order = (Object.keys(this.chapterP) as Chapter[])
      .filter((c) => c !== 'home')
      .sort((a, b) => this.chapterP[b] - this.chapterP[a]);
    for (const c of order) if (p >= this.chapterP[c] - 0.012) return c;
    return 'home';
  }

  private logFocus() {
    return this.portrait ? this.H * 0.27 : this.H * 0.5;
  }
  private deckFocus() {
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
    t.stops = t.items.map((it) => {
      const y = focus - (it.top + it.h / 2);
      const k = (t.startY - y) / Math.max(1, t.startY - t.endY);
      const p = lerp(t.range[0], t.range[1], Math.min(1, Math.max(0, k)));
      if (it.chapter) this.chapterP[it.chapter] = p;
      return p;
    });
  }

  /** where each block of the ship's log sits in focus, for scroll snapping */
  deckStops() {
    return this.deck.stops;
  }

  /**
   * On a phone the log is one tall column read in the top of the screen, so it
   * would race past on its share of the scroll. Its stretch of the timeline gets
   * extra scroll until the text moves no faster than LOG_RATE px per px scrolled.
   */
  private fitLog() {
    const LOG_RATE = 0.6;
    const { a, b } = this.slow;
    const scroll = (b - a) * K.lengthVh.mobile * this.H;
    const travel = this.log.startY - this.log.endY;
    this.slow.f = this.portrait && scroll > 0 ? Math.max(1, travel / (LOG_RATE * scroll)) : 1;
  }
  /** how much longer the pinned scroll is than the timeline it plays */
  lengthScale() {
    const { a, b, f } = this.slow;
    return 1 + (b - a) * (f - 1);
  }
  /** scroll progress (0..1) → position on the timeline */
  timeAt(s: number) {
    const { a, b, f } = this.slow;
    const q = s * this.lengthScale();
    return q <= a ? q : q < a + (b - a) * f ? a + (q - a) / f : q - (b - a) * (f - 1);
  }
  /** position on the timeline → scroll progress (0..1), the inverse of timeAt */
  scrollAt(p: number) {
    const { a, b, f } = this.slow;
    return (p <= a ? p : p < b ? a + (p - a) * f : p + (b - a) * (f - 1)) / this.lengthScale();
  }

  resize(w: number, h: number, dpr: number) {
    this.W = w;
    this.H = h;
    this.portrait = w / h < 0.95;
    this.r.resize(w, h, dpr);
    this.atmos.resize(w, h, Math.min(dpr, 1.5));
    this.aboutLines = Array.from(this.texts.aboutTrack?.querySelectorAll<HTMLElement>('[data-line]') ?? []);
    this.inkLines = Array.from(this.texts.paperNote?.querySelectorAll<HTMLElement>('[data-ink]') ?? []);
    this.chapterP.about = K.about.in[1] + 0.02; // fully revealed
    this.measureTrack(this.texts.logTrack, this.log, this.logFocus());
    this.measureTrack(this.texts.deckTrack, this.deck, this.deckFocus());
    this.fitLog();
  }

  private cover(iw: number, ih: number, zoom = 1): Rect {
    const { W, H } = this;
    const s = Math.max(W / iw, H / ih) * zoom;
    return [(W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s];
  }

  private titleRect(p: number): Rect {
    const { W, H } = this;
    const T = this.tex.title;
    const aspect = T ? T.w / T.h : 3.39;
    const w = this.portrait ? W * 0.94 : Math.min(W * 0.8, 1380, H * 0.62 * aspect);
    const h = w / aspect;
    const grow = 1 + 0.06 * smooth(seg(p, ...K.title)); // the camera starts to move in
    const cy = H * (this.portrait ? 0.3 : 0.34);
    return [W / 2 - (w * grow) / 2, cy - (h * grow) / 2, w * grow, h * grow];
  }

  /** Render one frame at scroll progress p (0..1) and wall time t (s). */
  frame(p: number, t: number) {
    const { W, H, r, tex, films } = this;
    r.time = t;
    r.begin(0.004, 0.016, 0.032);

    // ------------------------------------ 01 · desert → helmet → deep (film)
    const hero = films.hero;
    const heroRect = this.cover(...hero.size);
    const [j0, j1] = K.join;
    if (p < j1 + 0.005) hero.draw(r, seg(p, ...K.hero) * (hero.n - 1), heroRect, 1);

    // ------------------------------- 03 · the message in a bottle (film)
    const bottle = films.bottle;
    const [po0, po1] = K.paperOff;
    const off = easeInOut(seg(p, po0, po1));
    const paperT = seg(p, po0, po1);

    // the open sea waits beneath the unrolled paper
    const SEA = tex.sea;
    const SH = tex.ship;
    const shipScale = SH
      ? this.portrait
        ? Math.min((0.92 * W) / SH.w, (0.52 * H) / SH.h)
        : Math.min((H - NAV_CLEARANCE - 0.035 * H) / SH.h, (0.42 * W) / SH.w)
      : 1;
    if (SEA && p > po0) {
      const sc = shipScale * lerp(1.45, 1, easeOut3(seg(p, ...K.lift)));
      const sx = W / (SEA.w * sc);
      const sy = H / (SEA.h * sc);
      const travel = seg(p, K.lift[0], 1) * (this.portrait ? 3.2 : 2.4) + t * 0.004;
      // carries the bright daylight of the bottle's sea, then settles to its own colour
      const glow = 1 - sstep(po0, K.lift[1], p);
      r.draw(SEA, {
        rect: [0, 0, W, H],
        uv: [0.5 - sx / 2 + Math.sin(t * 0.05) * 0.004, 0.5 - sy / 2 + travel, sx, sy],
        ripple: [0.0012 + 0.003 * glow, 22, -1],
        brightness: 1 + 0.9 * glow,
        tint: [0.5, 0.64, 0.72],
        tintAmount: 0.35 * glow,
      });
    }

    if (p > j0) {
      // the camera leans into the unrolled paper while it crumbles away on
      // the wind (the same dissolve as the title), uncovering the open sea
      const rect = this.cover(...bottle.size, 1 + 0.35 * off);
      this.paperRect = rect;
      this.paperSet = bottle.size[0] < 800 ? 'm' : 'd';
      const fall = lerp(0, 1.32, seg(p, po0, po1));
      bottle.draw(r, bottleFilm(p) * (bottle.n - 1), rect, sstep(j0, j1, p), fall > 0 ? { dissolve: fall, dissolveLook: [0.035, 0.12, 2.6] } : {});
    }

    // ------------------------------------- 06 · the CSI ship on that sea
    if (SH && p > K.shipIn[0]) {
      const w2 = SH.w * shipScale;
      const h2 = SH.h * shipScale;
      const top = this.portrait ? Math.max(0.47 * H, H - h2 + 0.01 * H) : NAV_CLEARANCE;
      const inT = easeOut3(seg(p, ...K.shipIn));
      const sail = seg(p, K.shipIn[1], 1);
      const y = lerp(-h2 - 0.04 * H, top, inT) + sail * 0.02 * H + Math.sin(t * 0.8) * 0.003 * H;
      const x = W / 2 - w2 / 2 + Math.sin(p * 18) * W * 0.006;
      r.draw(SH, { rect: [x, y, w2, h2], rotation: Math.sin(t * 0.5) * 0.004 + Math.sin(p * 18) * 0.008 });
    }

    // ------------------------------------------------ 00 · the title
    const [ta, tb] = K.title;
    const dissolve = lerp(0, 1.32, seg(p, ta, tb));
    const tRect = this.titleRect(p);
    if (tex.title && dissolve < 1.3) r.draw(tex.title, { rect: tRect, dissolve: dissolve > 0 ? dissolve : undefined });

    // lens vignette — always on, subtle
    r.fill([0, 0, 0, 1], [0, 0, 0, 1], { vignette: [0.8, 0.8, 0.6], opacity: 0.28 });

    // dust over the desert; the title's grains on the same wind
    const [d0, d1] = K.dust;
    this.atmos.render({
      time: t,
      dust: 1 - sstep(d0, d1, p),
      push: Math.pow(seg(p, at(0.02), d1), 1.4) * 2.2,
      title: dissolve > 0 && dissolve < 1.32 ? { rect: tRect, dissolve } : null,
      paper: paperT > 0 && paperT < 1 ? lerp(0, 1.32, paperT) : 0,
    });

    // ------------------------------------------------- navbar contrast
    let glass: number;
    if (p < at(0.17)) glass = 0.3;
    else if (p < j1) glass = lerp(0.3, 0.14, seg(p, at(0.17), at(0.24)));
    else if (p < po0) glass = lerp(0.14, 0.46, sstep(at(0.42), at(0.5), p));
    else glass = lerp(0.46, 0.36, sstep(po0, K.shipIn[1], p));
    document.documentElement.style.setProperty('--nav-glass', glass.toFixed(3));

    this.text(p, tRect);
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
      const f = 1 - sstep(tr.falloff[0], tr.falloff[1], Math.abs(cy - focus) / H);
      const edge = sstep(band[0], band[0] + H * 0.16, cy) * (1 - sstep(band[1] - H * 0.12, band[1], cy));
      css(it.el, 'opacity', f3((0.16 + 0.84 * f) * edge));
      css(it.el, '--focus', f3(f));
    }
  }

  private text(p: number, tRect: Rect) {
    const T = this.texts;
    const { H } = this;

    // the presenter line and dates frame the title, and leave with it
    const lines = 1 - sstep(at(0.004), at(0.035), p);
    for (const [el, y, dir] of [
      [T.introEyebrow, tRect[1] - 6, -1],
      [T.introMeta, tRect[1] + tRect[3] + 10, 1],
    ] as const) {
      css(el, 'opacity', f3(lines));
      css(el, 'visibility', lines > 0.001 ? 'visible' : 'hidden');
      css(el, 'transform', `translate3d(-50%, ${f3(y + dir * (1 - lines) * 14)}px, 0) translateY(${dir < 0 ? '-100%' : '0'})`);
    }
    css(T.hint, 'opacity', f3(1 - sstep(at(0.002), at(0.016), p)));
    // ---- about pops out of the dark, line by line, as the camera enters
    {
      const [a0, a1] = K.about.in;
      const [o0, o1] = K.about.out;
      const on = p > a0 - 0.002 && p < o1 + 0.002;
      css(T.aboutTrack, 'visibility', on ? 'visible' : 'hidden');
      const out = easeInOut(seg(p, o0, o1));
      css(T.aboutScrim, 'opacity', f3(sstep(a0, a1, p) * (1 - out)));
      if (on) {
        const n = this.aboutLines.length;
        const span = a1 - a0;
        this.aboutLines.forEach((el, i) => {
          const st = a0 + (i / Math.max(1, n)) * span * 0.55;
          const tt = seg(p, st, st + span * 0.45);
          const e = easeOutBack(tt);
          css(el, 'opacity', f3(Math.min(1, tt * 1.6)));
          css(el, 'transform', `translate3d(0, ${f3((1 - e) * 46)}px, 0) scale(${f3(0.86 + 0.14 * e)})`);
          css(el, 'filter', tt > 0.98 ? 'none' : `blur(${f3((1 - tt) * 10)}px)`);
        });
        css(T.aboutTrack, 'opacity', f3(1 - out));
        css(T.aboutTrack, 'transform', `translate3d(-50%, calc(-50% - ${f3(out * H * 0.18)}px), 0) scale(${f3(1 + out * 0.06)})`);
      }
    }

    // ---- shortlisted teams, written in ink on the unrolled paper
    {
      const [k0, k1] = K.ink;
      const [po0, po1] = K.paperOff;
      const gone = sstep(po0, po0 + (po1 - po0) * 0.45, p);
      const on = p > k0 - 0.002 && gone < 0.999;
      css(T.paperNote, 'visibility', on ? 'visible' : 'hidden');
      if (on) {
        // the paper's inner writing area, in source-frame pixels
        const [rx, ry, rw, rh] = this.paperRect;
        const srcW = this.paperSet === 'm' ? 405 : 1278;
        const ox = this.paperSet === 'm' ? 436.5 : 0;
        const sx = rw / srcW;
        const sy = rh / 720;
        const x0 = Math.max(rx + (220 - ox) * sx, rx + 12, 14);
        const x1 = Math.min(rx + (1060 - ox) * sx, rx + rw - 12, this.W - 14);
        const y0 = ry + 110 * sy;
        const y1 = ry + 640 * sy;
        css(T.paperNote, 'transform', `translate3d(${f3(x0)}px, ${f3(y0)}px, 0)`);
        css(T.paperNote, 'width', `${f3(Math.max(10, x1 - x0))}px`);
        css(T.paperNote, 'height', `${f3(Math.max(10, y1 - y0))}px`);
        css(T.paperNote, '--paper-scale', f3(Math.min((x1 - x0) / 700, (y1 - y0) / 430)));
        css(T.paperNote, 'opacity', f3(1 - gone));
        const n = this.inkLines.length;
        this.inkLines.forEach((el, i) => {
          const st = k0 + (i / n) * (k1 - k0) * 0.7;
          const tt = smooth(seg(p, st, st + (k1 - k0) * 0.32));
          css(el, 'clip-path', `inset(-10% ${f3((1 - tt) * 100)}% -10% -2%)`);
          css(el, 'opacity', f3(Math.min(1, tt * 2)));
        });
      }
    }

    // ---- the voyage log rises beside the bottle
    const [ha, hb, hc, hd] = K.log.header;
    const hv = seg(p, ha, hb) * (1 - seg(p, hc, hd));
    css(T.logHeader, 'opacity', f3(hv));
    css(T.logHeader, 'visibility', hv > 0.001 ? 'visible' : 'hidden');
    this.runTrack(T.logTrack, this.log, p, this.logFocus(), this.portrait ? [H * 0.16, H * 0.5] : [H * 0.16, H * 1.05], false);

    // ---- about, allies and the invitation sail in with the ship
    css(T.deckScrim, 'opacity', f3(sstep(K.shipIn[0] + 0.02, K.deck.track[0] + 0.02, p)));
    const band: [number, number] = this.portrait ? [H * 0.07, H * 0.47] : [H * 0.12, H * 1.04];
    this.runTrack(T.deckTrack, this.deck, p, this.deckFocus(), band, true);
  }
}
