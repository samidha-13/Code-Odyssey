import { asset } from '../data/asset';
import { CHOREO as K, type Chapter, easeInOut, easeOut3, lerp, seg, smooth, sstep } from './choreography';
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
  | 'introScrim'
  | 'hint'
  | 'aboutTrack'
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
type Track = { items: Item[]; startY: number; endY: number; range: readonly [number, number] };
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
  private about: Track = { items: [], startY: 0, endY: 0, range: K.about.track };
  private log: Track = { items: [], startY: 0, endY: 0, range: K.log.track };
  private deck: Track = { items: [], startY: 0, endY: 0, range: K.deck.track };
  private chapterP: Record<Chapter, number> = { home: 0, about: 0.25, timeline: 0.36, sponsors: 0.9, register: 0.94 };
  private mobile: boolean;
  portrait = false;

  constructor(
    renderer: Renderer,
    particleCanvas: HTMLCanvasElement,
    private texts: TextRefs,
    mobile: boolean,
  ) {
    this.r = renderer;
    this.mobile = mobile;
    this.atmos = new Particles(particleCanvas, mobile ? 46 : 80);
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
    this.atmos.resize(w, h, Math.min(dpr, 1.5));
    this.measureTrack(this.texts.aboutTrack, this.about, this.portrait ? h * 0.42 : h * 0.5);
    this.chapterP.about = K.about.track[1] - 0.012; // fully in focus, before it drifts on
    this.measureTrack(this.texts.logTrack, this.log, this.logFocus());
    this.measureTrack(this.texts.deckTrack, this.deck, this.deckFocus());
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
      const fall = lerp(0, 1.32, seg(p, po0, po1));
      bottle.draw(r, seg(p, ...K.bottle) * (bottle.n - 1), rect, sstep(j0, j1, p), fall > 0 ? { dissolve: fall, dissolveLook: [0.035, 0.12, 2.6] } : {});
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
      push: Math.pow(seg(p, 0.02, d1), 1.4) * 2.2,
      title: dissolve > 0 && dissolve < 1.32 ? { rect: tRect, dissolve } : null,
      paper: paperT > 0 && paperT < 1 ? lerp(0, 1.32, paperT) : 0,
    });

    // ------------------------------------------------- navbar contrast
    let glass: number;
    if (p < 0.17) glass = 0.3;
    else if (p < j1) glass = lerp(0.3, 0.14, seg(p, 0.17, 0.24));
    else if (p < po0) glass = lerp(0.14, 0.46, sstep(0.42, 0.5, p));
    else glass = lerp(0.46, 0.36, sstep(po0, K.shipIn[1], p));
    document.documentElement.style.setProperty('--nav-glass', glass.toFixed(3));

    this.text(p, tRect, dissolve);
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

  private text(p: number, tRect: Rect, dissolve: number) {
    const T = this.texts;
    const { H } = this;

    // the presenter line and dates frame the title, and leave with it
    const lines = 1 - sstep(0.004, 0.035, p);
    for (const [el, y, dir] of [
      [T.introEyebrow, tRect[1] - 6, -1],
      [T.introMeta, tRect[1] + tRect[3] + 10, 1],
    ] as const) {
      css(el, 'opacity', f3(lines));
      css(el, 'visibility', lines > 0.001 ? 'visible' : 'hidden');
      css(el, 'transform', `translate3d(-50%, ${f3(y + dir * (1 - lines) * 14)}px, 0) translateY(${dir < 0 ? '-100%' : '0'})`);
    }
    css(T.introScrim, 'opacity', f3(1 - sstep(0.004, 0.06, dissolve)));
    css(T.hint, 'opacity', f3(1 - sstep(0.002, 0.016, p)));

    // ---- about rises out of the dark water as the camera travels on
    this.runTrack(T.aboutTrack, this.about, p, this.portrait ? H * 0.42 : H * 0.5, [H * 0.12, H * 1.02], false);

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
