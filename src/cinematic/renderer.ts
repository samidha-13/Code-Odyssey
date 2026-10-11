/**
 * A deliberately small WebGL2 compositor for the cinematic.
 *
 * Every scene element is a supplied 2D render, so instead of a 3D engine we
 * draw textured quads ("layers") with a 2.5D camera computed on the CPU. The
 * shader adds the things DOM layers can't do cheaply: depth-of-field blur via
 * mip levels, refraction ripples, an animated waterline mask, analytic
 * vignette / band masks, colour grading and procedural light shafts.
 */

const VERT = `#version 300 es
in vec2 a_pos;
uniform vec4 u_rect;      // x, y, w, h in CSS px (top-left origin)
uniform vec2 u_res;       // viewport in CSS px
uniform float u_rot;      // rotation about the rect centre (radians)
out vec2 v_uv;
out vec2 v_screen;
void main() {
  vec2 c = u_rect.xy + u_rect.zw * 0.5;
  vec2 d = (a_pos - 0.5) * u_rect.zw;
  float cs = cos(u_rot), sn = sin(u_rot);
  vec2 p = c + vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs);
  v_uv = a_pos;
  v_screen = p;
  vec2 clip = (p / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec2 v_screen;
uniform sampler2D u_tex;
uniform vec2 u_texSize;
uniform vec2 u_res;
uniform int u_mode;          // 0 texture, 1 light shafts, 2 gradient fill
uniform float u_opacity;
uniform vec4 u_grade;        // brightness, saturation, tint amount, unused
uniform vec3 u_tint;
uniform vec4 u_vignette;     // rx, ry, feather, enabled
uniform vec4 u_band;         // y0, y1 (uv), enabled, unused   alpha *= smoothstep(y0, y1, uv.y)
uniform vec4 u_focus;        // cx, cy (uv), radius (uv), max extra lod
uniform float u_blur;        // extra lod everywhere
uniform vec4 u_ripple;       // amplitude (uv), frequency, time, start uv.y
uniform vec4 u_water;        // line y (px), amplitude (px), softness (px), side (+1 below, -1 above, 0 off)
uniform float u_time;
uniform vec4 u_colA;
uniform vec4 u_colB;
uniform vec4 u_rays;         // origin x, origin y (0..1 screen), intensity, spread
out vec4 o;

vec4 sampleTex(vec2 uv, float lod) {
  if (lod < 0.05) return texture(u_tex, uv);
  float l = lod;
  vec2 px = exp2(l) / u_texSize;
  vec4 c = textureLod(u_tex, uv, l) * 0.36;
  c += textureLod(u_tex, uv + vec2( 0.9,  0.4) * px, l) * 0.16;
  c += textureLod(u_tex, uv + vec2(-0.4,  0.9) * px, l) * 0.16;
  c += textureLod(u_tex, uv + vec2(-0.9, -0.4) * px, l) * 0.16;
  c += textureLod(u_tex, uv + vec2( 0.4, -0.9) * px, l) * 0.16;
  return c;
}

float waterMask() {
  if (u_water.w == 0.0) return 1.0;
  float x = v_screen.x;
  float wave = sin(x * 0.011 + u_time * 1.6) * u_water.y
             + sin(x * 0.027 - u_time * 2.2 + 1.7) * u_water.y * 0.45
             + sin(x * 0.061 + u_time * 3.1) * u_water.y * 0.18;
  float d = v_screen.y - (u_water.x + wave);
  float below = smoothstep(-u_water.z, u_water.z, d);
  return u_water.w > 0.0 ? below : 1.0 - below;
}

void main() {
  float mask = u_opacity * waterMask();

  if (u_mode == 1) {
    vec2 p = v_screen / u_res;
    vec2 d = p - u_rays.xy;
    d.x *= u_res.x / u_res.y;
    float ang = atan(d.x, d.y) * u_rays.w;
    float t = u_time;
    float r = pow(0.5 + 0.5 * sin(ang * 23.0 + t * 0.31), 6.0) * 0.55
            + pow(0.5 + 0.5 * sin(ang * 41.0 - t * 0.23 + 1.3), 9.0) * 0.5
            + pow(0.5 + 0.5 * sin(ang * 11.0 + t * 0.17 + 2.1), 4.0) * 0.35;
    float dist = length(d);
    float fall = exp(-dist * 1.35) * smoothstep(0.0, 0.18, d.y);
    vec3 col = vec3(0.55, 0.86, 1.0) * r * fall * u_rays.z;
    o = vec4(col * mask, 0.0); // additive under premultiplied blending
    return;
  }

  if (u_mode == 2) {
    vec4 c = mix(u_colA, u_colB, smoothstep(0.0, 1.0, v_uv.y));
    if (u_vignette.w != 0.0) {
      float dv = length((v_uv - 0.5) / vec2(u_vignette.x, u_vignette.y));
      float e = smoothstep(1.0 - u_vignette.z, 1.0, dv);
      c.a *= u_vignette.w > 0.0 ? e : 1.0 - e; // negative w: darken the centre instead
    }
    c.a *= mask;
    o = vec4(c.rgb * c.a, c.a);
    return;
  }

  vec2 uv = v_uv;
  // derivatives before any divergent branch
  vec2 ts = uv * u_texSize;
  float rho = max(length(dFdx(ts)), length(dFdy(ts)));
  float baseLod = max(0.0, log2(max(rho, 1e-4)));

  if (u_ripple.x > 0.0) {
    float k = smoothstep(u_ripple.w, u_ripple.w + 0.08, uv.y);
    float f = u_ripple.y;
    uv += vec2(sin(uv.y * f + u_ripple.z * 1.9) + 0.5 * sin(uv.y * f * 2.3 - u_ripple.z * 2.7),
               cos(uv.x * f * 0.71 + u_ripple.z * 1.3)) * u_ripple.x * k;
  }

  float blur = u_blur;
  if (u_focus.w > 0.0) {
    vec2 q = (v_uv - u_focus.xy) * vec2(u_texSize.x / u_texSize.y, 1.0);
    blur += u_focus.w * smoothstep(u_focus.z, u_focus.z * 2.4, length(q));
  }

  vec4 c = sampleTex(uv, blur > 0.05 ? baseLod + blur : 0.0);

  // grading on premultiplied colour
  c.rgb *= u_grade.x;
  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  c.rgb = mix(vec3(l), c.rgb, u_grade.y);
  c.rgb = mix(c.rgb, u_tint * c.a, u_grade.z);

  if (u_vignette.w > 0.0) {
    float dv = length((v_uv - 0.5) / vec2(u_vignette.x, u_vignette.y));
    mask *= 1.0 - smoothstep(1.0 - u_vignette.z, 1.0, dv);
  }
  if (u_band.z > 0.0) mask *= smoothstep(u_band.x, u_band.y, v_uv.y);

  o = c * mask;
}`;

export type Tex = { tex: WebGLTexture; w: number; h: number };

export type DrawOpts = {
  rect: [number, number, number, number];
  opacity?: number;
  brightness?: number;
  saturation?: number;
  tint?: [number, number, number];
  tintAmount?: number;
  vignette?: [number, number, number] | null; // rx, ry, feather
  band?: [number, number] | null;
  focus?: [number, number, number, number] | null;
  blur?: number;
  ripple?: [number, number, number] | null; // amplitude, frequency, start uv.y
  water?: [number, number, number, number] | null; // lineY, amp, soft, side
  rotation?: number; // radians about the rect centre
  /** fill only: darken the centre instead of the edges */
  invertVignette?: boolean;
};

const U = [
  'u_rect', 'u_res', 'u_tex', 'u_texSize', 'u_mode', 'u_opacity', 'u_grade', 'u_tint', 'u_vignette',
  'u_band', 'u_focus', 'u_blur', 'u_ripple', 'u_water', 'u_time', 'u_colA', 'u_colB', 'u_rays', 'u_rot',
] as const;
type UName = (typeof U)[number];

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  private loc = {} as Record<UName, WebGLUniformLocation | null>;
  private white: WebGLTexture;
  private w = 1;
  private h = 1;
  time = 0;

  static create(canvas: HTMLCanvasElement): Renderer | null {
    try {
      const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
      });
      if (!gl) return null;
      return new Renderer(gl);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    gl.useProgram(p);
    for (const n of U) this.loc[n] = gl.getUniformLocation(p, n);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, 'a_pos');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(this.loc.u_tex, 0);

    this.white = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.white);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
  }

  upload(img: HTMLImageElement): Tex {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textures.push(tex);
    return { tex, w: img.naturalWidth, h: img.naturalHeight };
  }

  resize(cssW: number, cssH: number, dpr: number) {
    const c = this.gl.canvas as HTMLCanvasElement;
    const pw = Math.max(1, Math.round(cssW * dpr));
    const ph = Math.max(1, Math.round(cssH * dpr));
    if (c.width !== pw || c.height !== ph) {
      c.width = pw;
      c.height = ph;
    }
    this.w = cssW;
    this.h = cssH;
    this.gl.viewport(0, 0, pw, ph);
  }

  begin(r = 0, g = 0, b = 0) {
    const gl = this.gl;
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.loc.u_res, this.w, this.h);
    gl.uniform1f(this.loc.u_time, this.time);
  }

  private common(o: DrawOpts, mode: number) {
    const gl = this.gl;
    const L = this.loc;
    gl.uniform1i(L.u_mode, mode);
    gl.uniform4f(L.u_rect, o.rect[0], o.rect[1], o.rect[2], o.rect[3]);
    gl.uniform1f(L.u_opacity, o.opacity ?? 1);
    gl.uniform1f(L.u_rot, o.rotation ?? 0);
    const w = o.water;
    gl.uniform4f(L.u_water, w?.[0] ?? 0, w?.[1] ?? 0, w?.[2] ?? 1, w?.[3] ?? 0);
  }

  draw(t: Tex, o: DrawOpts) {
    const op = o.opacity ?? 1;
    if (op <= 0.002) return;
    const [x, y, w, h] = o.rect;
    if (x > this.w || y > this.h || x + w < 0 || y + h < 0) return;
    const gl = this.gl;
    const L = this.loc;
    this.common(o, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.uniform2f(L.u_texSize, t.w, t.h);
    gl.uniform4f(L.u_grade, o.brightness ?? 1, o.saturation ?? 1, o.tintAmount ?? 0, 0);
    const tint = o.tint ?? [0, 0, 0];
    gl.uniform3f(L.u_tint, tint[0], tint[1], tint[2]);
    const v = o.vignette;
    gl.uniform4f(L.u_vignette, v?.[0] ?? 1, v?.[1] ?? 1, v?.[2] ?? 0, v ? 1 : 0);
    const b = o.band;
    gl.uniform4f(L.u_band, b?.[0] ?? 0, b?.[1] ?? 1, b ? 1 : 0, 0);
    const f = o.focus;
    gl.uniform4f(L.u_focus, f?.[0] ?? 0.5, f?.[1] ?? 0.5, f?.[2] ?? 1, f?.[3] ?? 0);
    gl.uniform1f(L.u_blur, o.blur ?? 0);
    const r = o.ripple;
    gl.uniform4f(L.u_ripple, r?.[0] ?? 0, r?.[1] ?? 0, this.time, r?.[2] ?? -1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Solid or vertical-gradient fill. Colours are straight (non-premultiplied) RGBA. */
  fill(top: [number, number, number, number], bottom: [number, number, number, number], o: Partial<DrawOpts> = {}) {
    const op = o.opacity ?? 1;
    if (op <= 0.002) return;
    const gl = this.gl;
    const L = this.loc;
    this.common({ rect: o.rect ?? [0, 0, this.w, this.h], ...o }, 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.white);
    gl.uniform4f(L.u_colA, ...top);
    gl.uniform4f(L.u_colB, ...bottom);
    const v = o.vignette;
    gl.uniform4f(L.u_vignette, v?.[0] ?? 1, v?.[1] ?? 1, v?.[2] ?? 0, v ? (o.invertVignette ? -1 : 1) : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  rays(intensity: number, originX: number, originY: number, spread = 1) {
    if (intensity <= 0.002) return;
    const gl = this.gl;
    this.common({ rect: [0, 0, this.w, this.h], opacity: 1 }, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.white);
    gl.uniform4f(this.loc.u_rays, originX, originY, intensity, spread);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private textures: WebGLTexture[] = [];

  /** Frees GPU memory. The context itself is kept so the canvas can be reused. */
  dispose() {
    for (const t of this.textures) this.gl.deleteTexture(t);
    this.textures = [];
  }
}
