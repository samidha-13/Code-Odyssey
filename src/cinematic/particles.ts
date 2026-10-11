/**
 * The 2D atmosphere layer above the WebGL scene:
 *  - desert dust: soft motes at several depths, drifting on gusting wind in a
 *    seamless loop, streaming outward as the camera pushes in;
 *  - title grains: when the title dissolves, its gold leaves as sand. Each
 *    grain's position is a pure function of the dissolve front, so the effect
 *    reverses exactly when scrolling back up.
 */

export type AtmosState = {
  time: number;
  /** 0..1 dust visibility */
  dust: number;
  /** camera push-in (0 = wide); dust streams outward as it grows */
  push: number;
  /** title placement on screen and its dissolve front (0 = intact) */
  title: { rect: [number, number, number, number]; dissolve: number } | null;
  /** dissolve front of the parchment (0 = intact) — its fibres drift away */
  paper: number;
};

type Mote = { x: number; y: number; z: number; s: number; sp: number };
type Grain = { u: number; v: number; tau: number; s: number; s2: number; color: string };

const fract = (v: number) => v - Math.floor(v);

export class Particles {
  private ctx: CanvasRenderingContext2D;
  private motes: Mote[] = [];
  private grains: Grain[] = [];
  private sprite: HTMLCanvasElement;
  private w = 1;
  private h = 1;

  constructor(private canvas: HTMLCanvasElement, count: number) {
    this.ctx = canvas.getContext('2d')!;
    let seed = 1234567;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < count; i++) {
      this.motes.push({ x: rnd(), y: rnd(), z: Math.pow(rnd(), 1.6), s: rnd(), sp: 0.6 + rnd() * 0.8 });
    }
    // a soft warm mote, drawn once and stamped many times
    this.sprite = document.createElement('canvas');
    this.sprite.width = this.sprite.height = 32;
    const g = this.sprite.getContext('2d')!;
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,232,196,1)');
    grad.addColorStop(0.35, 'rgba(255,214,160,0.55)');
    grad.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
  }

  /** samples the title art so its grains carry its real colours */
  setTitle(img: HTMLImageElement, count: number) {
    const cw = 300;
    const ch = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * cw));
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(img, 0, 0, cw, ch);
    const data = g.getImageData(0, 0, cw, ch).data;
    const pts: number[] = [];
    for (let i = 0; i < cw * ch; i++) if (data[i * 4 + 3] > 150) pts.push(i);
    let seed = 99991;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    this.grains = [];
    for (let k = 0; k < count && pts.length; k++) {
      const i = pts[Math.floor(rnd() * pts.length)];
      const x = i % cw;
      const y = Math.floor(i / cw);
      const u = (x + rnd()) / cw;
      const r = data[i * 4];
      const gg = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      this.grains.push({
        u,
        v: (y + rnd()) / ch,
        tau: u * 0.72 + rnd() * 0.28, // mirrors the shader's dissolve threshold
        s: rnd(),
        s2: rnd(),
        color: `rgb(${Math.min(255, r + 30)},${Math.min(255, gg + 22)},${b})`,
      });
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(st: AtmosState) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    if (st.dust > 0.01) {
      const t = st.time;
      const gust = Math.sin(t * 0.21) * 0.5 + Math.sin(t * 0.53 + 1.3) * 0.3 + 0.9; // always blowing, never steady
      const cx = w * 0.5;
      const cy = h * 0.66;
      for (const m of this.motes) {
        // loop across the frame on the wind; nearer motes travel faster
        const x0 = fract(m.x + t * 0.012 * m.sp * (0.4 + m.z * 1.6) * gust);
        const y0 = m.y + Math.sin(t * (0.4 + m.s * 0.5) + m.s * 9) * 0.012 * (0.3 + m.z) - fract(t * 0.004 * m.sp) * 0.05;
        const spread = 1 + st.push * (0.4 + m.z * 1.8);
        const x = cx + (x0 * w * 1.2 - w * 0.1 - cx) * spread;
        const y = cy + (y0 * h - cy) * spread;
        const size = (2 + m.z * m.z * 14) * (0.8 + m.s * 0.5) * (1 + st.push * m.z * 0.6);
        const a = st.dust * (0.22 + 0.5 * (1 - Math.abs(m.z - 0.45))) * (0.7 + 0.3 * Math.sin(t * 1.3 + m.s * 20));
        if (x < -20 || y < -20 || x > w + 20 || y > h + 20 || a < 0.01) continue;
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(this.sprite, x - size, y - size, size * 2, size * 2);
      }
      ctx.globalAlpha = 1;
    }

    if (st.paper > 0) {
      // parchment flakes: fill the frame, carried right on the same wind
      for (let i = 0; i < this.motes.length * 6; i++) {
        const m = this.motes[i % this.motes.length];
        const k = i / (this.motes.length * 6);
        const u = fract(m.x + k * 7.31);
        const v = fract(m.y + k * 3.17);
        const tau = u * 0.72 + fract(m.s * 13 + k * 5) * 0.28;
        const age = (st.paper - tau) / 0.32;
        if (age <= 0 || age >= 1) continue;
        const x = u * w + age * w * (0.2 + 0.3 * m.s);
        const y = v * h - age * h * (0.05 + 0.12 * m.z) + Math.sin(age * 6 + m.s * 10) * 8;
        const sz = 1.2 + m.z * 3.5;
        ctx.globalAlpha = Math.pow(1 - age, 1.3) * 0.85;
        ctx.fillStyle = m.s > 0.5 ? 'rgb(214,182,132)' : 'rgb(170,128,80)';
        ctx.fillRect(x, y, sz, sz * 0.7);
      }
      ctx.globalAlpha = 1;
    }

    const T = st.title;
    if (T && T.dissolve > 0 && this.grains.length) {
      const [rx, ry, rw, rh] = T.rect;
      for (const g of this.grains) {
        const age = (T.dissolve - g.tau) / 0.32;
        if (age <= 0 || age >= 1) continue;
        // carried off to the right on the same wind as the dust
        const x = rx + g.u * rw + age * w * (0.18 + 0.32 * g.s) + Math.sin(age * 7 + g.s * 12) * 10;
        const y = ry + g.v * rh - age * h * (0.04 + 0.14 * g.s2) + age * age * h * 0.06;
        const sz = 0.9 + g.s * 1.8;
        ctx.globalAlpha = Math.pow(1 - age, 1.4) * 0.95;
        ctx.fillStyle = g.color;
        ctx.fillRect(x, y, sz, sz);
      }
      ctx.globalAlpha = 1;
    }
  }
}
