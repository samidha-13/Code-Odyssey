/**
 * Sparse atmospheric particles drawn on a 2D canvas above the WebGL scene.
 * Positions are a pure function of the camera (forward travel / rise) plus a
 * slow time drift, so they stream past correctly in both scroll directions.
 */

export type ParticleState = {
  time: number;
  /** forward travel of the camera (arbitrary units, monotonic with scroll) */
  fwd: number;
  /** vertical rise of the camera */
  rise: number;
  dust: number; // warm desert dust 0..1
  motes: number; // deep-sea suspended specks
  bubbles: number; // rising bubbles
  spray: number; // 0..1 progress of the surface-breach spray burst (0 = none)
  sprayAlpha: number;
};

type P = { x: number; y: number; z: number; r: number; s: number; vx: number; vy: number };

const fract = (v: number) => v - Math.floor(v);

export class Particles {
  private ctx: CanvasRenderingContext2D;
  private list: P[] = [];
  private w = 1;
  private h = 1;

  constructor(private canvas: HTMLCanvasElement, count: number) {
    this.ctx = canvas.getContext('2d')!;
    let seed = 1234567;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      this.list.push({
        x: rnd() * 2 - 1,
        y: rnd() * 2 - 1,
        z: rnd(),
        r: 0.4 + rnd() * rnd() * 1.8,
        s: rnd(),
        vx: rnd() * 2 - 1,
        vy: -(0.4 + rnd() * 0.9),
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

  render(st: ParticleState) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    const any = st.dust + st.motes + st.bubbles + st.sprayAlpha;
    if (any < 0.01) return;
    const cx = w / 2;
    const cy = h / 2;
    const F = Math.max(w, h) * 0.42;
    const n = this.list.length;

    for (let i = 0; i < n; i++) {
      const p = this.list[i];

      // depth in (0.12, 1]: forward travel pulls particles towards the camera
      const d = 0.12 + 0.88 * fract(p.z - st.fwd * (0.6 + p.s * 0.4));
      const nearFade = Math.min(1, (d - 0.12) / 0.12);
      const farFade = Math.min(1, (1 - d) / 0.25 + 0.2);

      if (st.dust > 0.01 && i % 2 === 0) {
        const x = p.x * 1.4 + Math.sin(st.time * 0.12 + p.s * 6) * 0.05 + st.time * 0.008 * (0.5 + p.s);
        const wx = fract((x + 1.4) / 2.8) * 2.8 - 1.4;
        const sx = cx + (wx * F) / d;
        const sy = cy + ((p.y * 0.7 + 0.15 + Math.sin(st.time * 0.3 + p.s * 9) * 0.02) * F) / d;
        const rad = (p.r * 1.1) / d;
        const a = st.dust * nearFade * farFade * (0.25 + p.s * 0.35);
        dot(ctx, sx, sy, rad, `rgba(255,214,168,${a.toFixed(3)})`);
      }

      if (st.motes > 0.01) {
        const wy = fract((p.y + st.rise * 0.9 + st.time * 0.004 + 1) / 2) * 2 - 1;
        const sx = cx + ((p.x + Math.sin(st.time * 0.1 + p.s * 7) * 0.03) * F * 1.3) / d;
        const sy = cy + (wy * F * 1.1) / d;
        const rad = Math.min(2.2, (p.r * 0.55) / d);
        const a = st.motes * nearFade * farFade * (0.18 + p.s * 0.4);
        dot(ctx, sx, sy, rad, `rgba(150,200,235,${a.toFixed(3)})`);
      }

      if (st.bubbles > 0.01 && i % 3 === 0) {
        // bubbles rise on their own and stream down as the camera ascends
        const wy = fract((p.y + p.vy * st.time * 0.05 + st.rise * 1.6 + 2) / 2) * 2 - 1;
        const wob = Math.sin(st.time * 2 + p.s * 20) * 0.012;
        const dd = 0.35 + d * 0.65;
        const sx = cx + ((p.x * 1.2 + wob) * F) / dd;
        const sy = cy + (wy * F * 1.2) / dd;
        const rad = (1.2 + p.r * 1.6) / dd;
        const a = st.bubbles * (0.25 + p.s * 0.35) * Math.min(1, (1 - Math.abs(wy)) * 3);
        bubble(ctx, sx, sy, rad, a);
      }

      if (st.sprayAlpha > 0.01 && i % 2 === 1) {
        const t = st.spray;
        const ang = p.x * Math.PI * 0.9 - Math.PI / 2;
        const spd = 0.5 + p.s * 0.9;
        const sx = cx + Math.cos(ang) * spd * t * w * 0.7 + p.vx * w * 0.08;
        const sy = h * 0.95 + Math.sin(ang) * spd * t * h * 1.1 + t * t * h * 0.9;
        const rad = 0.8 + p.r * 1.5;
        const a = st.sprayAlpha * (0.35 + p.s * 0.5) * (1 - t);
        dot(ctx, sx, sy, rad, `rgba(235,248,255,${a.toFixed(3)})`);
      }
    }
  }
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  if (x < -10 || y < -10 || x > ctx.canvas.width + 10 || y > ctx.canvas.height + 10) return;
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.arc(x, y, Math.max(0.3, r), 0, Math.PI * 2);
  ctx.fill();
}

function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  ctx.beginPath();
  ctx.strokeStyle = `rgba(200,235,255,${(a * 0.9).toFixed(3)})`;
  ctx.lineWidth = 0.8;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = `rgba(255,255,255,${(a * 0.8).toFixed(3)})`;
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
}
