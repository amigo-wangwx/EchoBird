// "Effort pulse" — the model-apply power surge, a faithful port of the Claude
// range-slider "Ultracode" fire (github.com/254558/claude-range-slider) to
// WebGL2. A dot-matrix fire simulation with feedback trails, gaussian bloom and
// a tone-mapped composite. The fire math is kept verbatim; only three things are
// ours: the cell grid adapts to the card size, the palette is driven by the
// theme accent (Claude coral) instead of purple, and a page-colour backdrop +
// one-shot envelope give the apply cover→reveal.
//
// Rendered on a <canvas> via WebGL2 — four passes per frame (sim → blur H →
// blur V → composite) ping-ponging two feedback FBOs, exactly like the original.
//
//  • default (looping) — the fire burns and re-kindles forever (demo use).
//  • `oneShot` — ignites, burns ~11s, then dissolves; the caller unmounts it
//    after EFFORT_PULSE_ONESHOT_MS.

import { useEffect, useRef } from 'react';

type RGB = [number, number, number];

const ACCENT_FALLBACK: RGB = [217, 119, 87]; // Claude coral
const BG_FALLBACK: RGB = [42, 39, 35]; // #2A2723 card surface colour

// ---- one-shot timeline (seconds): quick reveal → burn → slow dissolve ----
const OS_FADE_IN = 0.3;
const OS_HOLD = 9.5;
const OS_FADE_OUT = 1.2;
const OS_VISIBLE = OS_FADE_IN + OS_HOLD + OS_FADE_OUT; // ~11s
/** How long a `oneShot` pulse stays visible — callers unmount it after this. */
export const EFFORT_PULSE_ONESHOT_MS = Math.round(OS_VISIBLE * 1000);

// ---- looping timeline (seconds) — ambient burn for standalone/demo use ----
const LOOP_FADE = 1.0;
const LOOP_ON = 30.0;
const LOOP_CYCLE = LOOP_ON + LOOP_FADE * 2;

const CELL_PX = 7; // target cell size (px) → smaller = denser, more pixel-y grid
// Hottest highlight — a warm orange-tinted white (bright-orange body + white
// sparkles intermix). Constant on purpose: the hot core stays near-white for
// contrast rather than tracking the accent.
const HOT: RGB = [1.0, 0.94, 0.86];

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
const s01 = (x: number): number => {
  const c = clamp(x, 0, 1);
  return c * c * (3 - 2 * c);
};

function readRgb(name: string, fallback: RGB): RGB {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  return parts.length >= 3 ? [parts[0], parts[1], parts[2]] : fallback;
}
const norm = (c: RGB): RGB => [c[0] / 255, c[1] / 255, c[2] / 255];
const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

function oneShotEnvelope(tc: number): number {
  if (tc < OS_FADE_IN) return s01(tc / OS_FADE_IN);
  if (tc < OS_FADE_IN + OS_HOLD) return 1;
  if (tc < OS_VISIBLE) return 1 - s01((tc - OS_FADE_IN - OS_HOLD) / OS_FADE_OUT);
  return 0;
}
function loopEnvelope(tc: number): number {
  if (tc < LOOP_FADE) return s01(tc / LOOP_FADE);
  if (tc < LOOP_ON + LOOP_FADE) return 1;
  if (tc < LOOP_CYCLE) return 1 - s01((tc - LOOP_ON - LOOP_FADE) / LOOP_FADE);
  return 0;
}

const VERT = `#version 300 es
layout(location=0) in vec2 a_pos;
out vec2 v_uv;
void main(){ v_uv=a_pos*0.5+0.5; gl_Position=vec4(a_pos,0.0,1.0); }`;

// Sim pass — verbatim from the source, except: grid is u_grid (card-adaptive)
// and the ember / mid / hot palette is uniform-driven (theme coral, not purple).
const FRAG_SIM = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 fc;
uniform float u_time, u_slider, u_elapsed;
uniform vec2 u_grid;
uniform vec3 u_ember, u_mid, u_hot;
uniform sampler2D u_back;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec2 uv=v_uv;
  vec2 g=uv*u_grid;
  vec2 id=floor(g);
  vec2 cf=fract(g);
  float h=hash(id);
  vec2 ap=abs(cf-0.5);
  float cell=smoothstep(0.34,0.22,max(ap.x*0.9,ap.y));
  vec3 prev=texture(u_back,uv).rgb;
  float fade_mask = smoothstep(0.0, 0.3, uv.x);
  vec3 decay = prev * 0.90 * fade_mask;
  float act=smoothstep(0.95,1.0,u_slider);
  if(act<0.01||u_elapsed<0.0){ fc=vec4(decay,1.0); return; }
  float t=u_time;
  float cellDelay = h * 1.2;
  float cellAge   = max(u_elapsed - cellDelay, 0.0);
  float ignited   = step(0.001, cellAge);
  float cellSpd   = 0.85 + h * 0.30;
  float eased = 1.0 - pow(1.0 - clamp(cellAge / 2.5, 0.0, 1.0), 3.0);
  float dist  = eased * u_slider * cellSpd * ignited;
  float cellOff = (h - 0.5) * 0.05;
  float front   = max(u_slider - dist - cellOff, 0.02);
  float tail    = max(u_slider - front, 0.001);
  float inZ   = step(front - 0.003, uv.x) * step(uv.x, u_slider + 0.003);
  float dn    = clamp(max(u_slider - uv.x, 0.0) / tail, 0.0, 1.0);
  float bright = pow(1.0 - dn, 0.65);
  bright = max(bright, 0.04 * ignited) * inZ;
  bright *= 1.0 - smoothstep(0.94, 1.05, dn);
  float es = mix(0.15, 0.5, min(u_elapsed / 1.0, 1.0));
  float vy = abs(uv.y - 0.5) * 2.0;
  float vf = pow(max(1.0 - vy * vy * 0.45, 0.0), 0.75);
  float ts = mix(0.85, 1.0, min(u_elapsed / 1.5, 1.0));
  float f1 = sin(uv.x * 30.0 + t * 15.0 * ts + h * 6.28);
  float f2 = sin(uv.x * 17.0 + t * 8.0 * ts + h * 3.14);
  float f3 = sin(uv.x * 52.0 + t * 25.0 * ts + h * 10.0);
  float flame = smoothstep(0.08, 0.92, (f1 + f2 * 0.5 + f3 * 0.25) * 0.35 + 0.5);
  float r1 = sin(dn * 16.0 - t * 5.0 * ts + h * 3.0);
  float r2 = sin(dn * 8.0 - t * 2.5 * ts + h * 5.0);
  float rhythm = smoothstep(-0.15, 0.55, r1) * (r2 * 0.5 + 0.5);
  rhythm = pow(max(rhythm, 0.0), 1.2);
  float avgSpd = dist / max(cellAge, 0.001);
  float age    = max(cellAge - max(u_slider - uv.x, 0.0) / max(avgSpd, 0.001), 0.0);
  float flash  = step(0.0, age) * exp(-age * 3.2);
  float sp  = fract(t * (0.38 + h * 0.15) + h * 7.0);
  float sX  = u_slider - sp * tail;
  float sY  = 0.5 + sin(sp * 11.0 + h * 6.28) * 0.28;
  float spark = smoothstep(0.014, 0.0, abs(uv.x - sX))
              * smoothstep(0.18, 0.0, abs(uv.y - sY))
              * (1.0 - sp) * (1.0 - sp) * es;
  float energy = bright * vf * (flame * 0.42 + rhythm * 0.38)
               + flash * bright * vf * 0.55
               + spark * 0.7 * inZ;
  energy *= es;
  float edgeBase = exp(-pow((uv.x - front) * 18.0, 2.0));
  float ef1 = sin(uv.x * 45.0 + t * 20.0 * ts + h * 6.28) * 0.5 + 0.5;
  float ef2 = sin(uv.x * 28.0 + t * 11.0 * ts + h * 3.14) * 0.5 + 0.5;
  float edge = edgeBase * (0.25 + ef1 * ef2 * 1.5) * 1.6 * act * es;
  float leadD    = front - uv.x;
  float leadZone = smoothstep(0.07, 0.0, leadD) * step(0.0, leadD) * vf;
  float h2       = hash(id + vec2(99.0, 33.0));
  float leadF    = sin(leadD * 100.0 + t * 20.0 * ts + h2 * 6.28) * 0.5 + 0.5;
  float leadSpark = leadZone * step(0.6, h2) * leadF * act * es * 0.5;
  float total = energy + edge + leadSpark;
  float temp = 1.0 - dn;
  vec3 col   = mix(u_ember, u_mid, temp);
  col        = mix(col, u_hot, pow(temp, 10.0));
  col       *= total;
  float pulse = sin(t * 2.8) * 0.15 + 1.0;
  float core  = exp(-pow((uv.x - u_slider) * 30.0, 2.0));
  col += u_hot * core * 2.2 * pulse * act * es;
  col += u_mid * exp(-pow((uv.x - u_slider) * 3.5, 2.0)) * 0.12 * act * es;
  col *= cell;
  col *= fade_mask;
  fc = vec4(min(decay + col, vec3(1.5)), 1.0);
}`;

const FRAG_BLUR = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 fc;
uniform sampler2D u_tex;
uniform vec2 u_dir, u_res;
uniform float u_ext;
vec3 s(vec2 uv){
  vec3 c=texture(u_tex,uv).rgb;
  return u_ext>0.5 && dot(c,vec3(0.2126,0.7152,0.0722))<0.3 ? vec3(0.0) : c;
}
void main(){
  vec2 o=u_dir*1.8/u_res;
  vec3 r=s(v_uv)*0.227027;
  r+=s(v_uv+o)*0.194595;    r+=s(v_uv-o)*0.194595;
  r+=s(v_uv+o*2.0)*0.121622;r+=s(v_uv-o*2.0)*0.121622;
  r+=s(v_uv+o*3.0)*0.054054;r+=s(v_uv-o*3.0)*0.054054;
  fc=vec4(r,1.0);
}`;

// Composite — the source tone-map, plus our theme backdrop and one-shot
// envelope. Output is premultiplied so the canvas dissolves over the card.
const FRAG_COMP = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 fc;
uniform sampler2D u_scene, u_glow;
uniform vec3 u_bg;
uniform float u_env;
void main(){
  vec3 s=texture(u_scene,v_uv).rgb;
  vec3 g=texture(u_glow,v_uv).rgb;
  // Warm per-channel exposure (blue suppressed) so the hottest cells read as
  // orange-tinted white, never pure white.
  vec3 fire=1.0-exp(-(s+g*1.2+s*g*0.35)*vec3(1.3,0.95,0.55));
  vec3 outc=min(u_bg+fire, vec3(1.0));
  fc=vec4(outc*u_env, u_env);
}`;

interface EffortPulseProps {
  width?: number;
  height?: number;
  fill?: boolean;
  oneShot?: boolean;
  className?: string;
}

export function EffortPulse({
  width = 285,
  height = 70,
  fill = false,
  oneShot = false,
  className,
}: EffortPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true });
    if (!gl) {
      console.warn('[EffortPulse] WebGL2 unavailable');
      return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let ember: RGB = [0, 0, 0];
    let mid: RGB = [0, 0, 0];
    let bg: RGB = [0, 0, 0];
    const refreshColors = (): void => {
      const a = norm(readRgb('--accent-rgb', ACCENT_FALLBACK));
      ember = scale(a, 0.42);
      mid = a;
      // Backdrop matches the model card's own surface so the cover is seamless.
      bg = norm(readRgb('--bg-surface-rgb', BG_FALLBACK));
    };
    refreshColors();

    // ── program helpers ──
    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('[EffortPulse] shader:', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const link = (vs: string, fs: string): WebGLProgram | null => {
      const v = compile(gl.VERTEX_SHADER, vs);
      const f = compile(gl.FRAGMENT_SHADER, fs);
      if (!v || !f) return null;
      const p = gl.createProgram();
      if (!p) return null;
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.bindAttribLocation(p, 0, 'a_pos');
      gl.linkProgram(p);
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('[EffortPulse] link:', gl.getProgramInfoLog(p));
        return null;
      }
      return p;
    };

    const simP = link(VERT, FRAG_SIM);
    const blurP = link(VERT, FRAG_BLUR);
    const compP = link(VERT, FRAG_COMP);
    if (!simP || !blurP || !compP) return;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // uniform locations
    const uSim = {
      time: gl.getUniformLocation(simP, 'u_time'),
      slider: gl.getUniformLocation(simP, 'u_slider'),
      elapsed: gl.getUniformLocation(simP, 'u_elapsed'),
      grid: gl.getUniformLocation(simP, 'u_grid'),
      ember: gl.getUniformLocation(simP, 'u_ember'),
      mid: gl.getUniformLocation(simP, 'u_mid'),
      hot: gl.getUniformLocation(simP, 'u_hot'),
      back: gl.getUniformLocation(simP, 'u_back'),
    };
    const uBlur = {
      dir: gl.getUniformLocation(blurP, 'u_dir'),
      ext: gl.getUniformLocation(blurP, 'u_ext'),
      tex: gl.getUniformLocation(blurP, 'u_tex'),
      res: gl.getUniformLocation(blurP, 'u_res'),
    };
    const uComp = {
      scene: gl.getUniformLocation(compP, 'u_scene'),
      glow: gl.getUniformLocation(compP, 'u_glow'),
      bg: gl.getUniformLocation(compP, 'u_bg'),
      env: gl.getUniformLocation(compP, 'u_env'),
    };

    // ── FBOs (ping-pong sim + blur) ──
    type FBO = { fbo: WebGLFramebuffer; tex: WebGLTexture };
    let cw = 0;
    let ch = 0;
    let cols = 8;
    let rows = 6;
    let simA: FBO | null = null;
    let simB: FBO | null = null;
    let blurH: FBO | null = null;
    let blurV: FBO | null = null;
    const makeFBO = (): FBO | null => {
      const fbo = gl.createFramebuffer();
      const tex = gl.createTexture();
      if (!fbo || !tex) return null;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cw, ch, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { fbo, tex };
    };

    const freeFBO = (e: FBO | null): void => {
      if (!e) return;
      gl.deleteFramebuffer(e.fbo);
      gl.deleteTexture(e.tex);
    };

    const setup = (): boolean => {
      const dw = fill ? Math.round(canvas.clientWidth) : width;
      const dh = fill ? Math.round(canvas.clientHeight) : height;
      if (dw < 1 || dh < 1) return false;
      const ncw = Math.round(dw * dpr);
      const nch = Math.round(dh * dpr);
      // Size unchanged (the ResizeObserver's initial fire, or a no-op reflow) —
      // keep the existing FBOs: no double-alloc on mount, no trail wiped to black.
      if (ncw === cw && nch === ch && simA) return true;
      cw = ncw;
      ch = nch;
      canvas.width = cw;
      canvas.height = ch;
      cols = Math.max(8, Math.round(dw / CELL_PX));
      rows = Math.max(3, Math.round(dh / CELL_PX));
      freeFBO(simA);
      freeFBO(simB);
      freeFBO(blurH);
      freeFBO(blurV);
      simA = makeFBO();
      simB = makeFBO();
      blurH = makeFBO();
      blurV = makeFBO();
      return !!(simA && simB && blurH && blurV);
    };

    let ready = setup();
    gl.disable(gl.BLEND);

    const drawQuad = (): void => gl.drawArrays(gl.TRIANGLES, 0, 6);

    const frame = (t: number, elapsed: number, env: number): void => {
      if (!simA || !simB || !blurH || !blurV) return;
      gl.viewport(0, 0, cw, ch);

      // pass 1 — sim (reads simA feedback, writes simB)
      gl.bindFramebuffer(gl.FRAMEBUFFER, simB.fbo);
      gl.useProgram(simP);
      gl.uniform1f(uSim.time, t * 0.001);
      gl.uniform1f(uSim.slider, 1.0);
      gl.uniform1f(uSim.elapsed, elapsed);
      gl.uniform2f(uSim.grid, cols, rows);
      gl.uniform3f(uSim.ember, ember[0], ember[1], ember[2]);
      gl.uniform3f(uSim.mid, mid[0], mid[1], mid[2]);
      gl.uniform3f(uSim.hot, HOT[0], HOT[1], HOT[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, simA.tex);
      gl.uniform1i(uSim.back, 0);
      drawQuad();

      // pass 2 — horizontal blur (extract bright)
      gl.useProgram(blurP);
      gl.uniform2f(uBlur.res, cw, ch);
      gl.bindFramebuffer(gl.FRAMEBUFFER, blurH.fbo);
      gl.uniform2f(uBlur.dir, 1, 0);
      gl.uniform1f(uBlur.ext, 1);
      gl.bindTexture(gl.TEXTURE_2D, simB.tex);
      gl.uniform1i(uBlur.tex, 0);
      drawQuad();

      // pass 3 — vertical blur
      gl.bindFramebuffer(gl.FRAMEBUFFER, blurV.fbo);
      gl.uniform2f(uBlur.dir, 0, 1);
      gl.uniform1f(uBlur.ext, 0);
      gl.bindTexture(gl.TEXTURE_2D, blurH.tex);
      drawQuad();

      // pass 4 — composite to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(compP);
      gl.uniform3f(uComp.bg, bg[0], bg[1], bg[2]);
      gl.uniform1f(uComp.env, env);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, simB.tex);
      gl.uniform1i(uComp.scene, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, blurV.tex);
      gl.uniform1i(uComp.glow, 1);
      drawQuad();

      const tmp = simA;
      simA = simB;
      simB = tmp;
    };

    let raf = 0;
    let startMs = 0;
    const loop = (nowMs: number): void => {
      if (!ready) {
        ready = setup();
        if (!ready) {
          raf = window.requestAnimationFrame(loop);
          return;
        }
      }
      if (!startMs) startMs = nowMs;
      const elapsed = (nowMs - startMs) / 1000;
      // Reduced motion: freeze the fire (no flicker / travel) by pinning its
      // time; a one-shot still animates only the envelope, so cover→reveal is an
      // opacity change rather than motion.
      const ft = reduce ? startMs + 2500 : nowMs;
      const fe = reduce ? 2.5 : elapsed;
      if (oneShot) {
        frame(ft, fe, oneShotEnvelope(elapsed));
        if (elapsed < OS_VISIBLE + 0.05) raf = window.requestAnimationFrame(loop);
      } else if (reduce) {
        frame(ft, fe, 1);
        if (elapsed < 1.5) raf = window.requestAnimationFrame(loop); // settle a static frame, then stop
      } else {
        frame(nowMs, elapsed, loopEnvelope(elapsed % LOOP_CYCLE));
        raf = window.requestAnimationFrame(loop);
      }
    };
    // Always drive via the loop (even reduced motion) so setup() retries until
    // the element is laid out — a lone frame() before layout would stay blank.
    raf = window.requestAnimationFrame(loop);

    let ro: ResizeObserver | null = null;
    if (fill) {
      ro = new ResizeObserver(() => {
        ready = setup();
      });
      ro.observe(canvas);
    }
    const obs = new MutationObserver(refreshColors);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      window.cancelAnimationFrame(raf);
      obs.disconnect();
      ro?.disconnect();
      freeFBO(simA);
      freeFBO(simB);
      freeFBO(blurH);
      freeFBO(blurV);
      gl.deleteProgram(simP);
      gl.deleteProgram(blurP);
      gl.deleteProgram(compP);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(vbo);
    };
  }, [width, height, fill, oneShot]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={
        fill
          ? { display: 'block', width: '100%', height: '100%', transform: 'scaleX(-1)' }
          : { display: 'block', width, height, transform: 'scaleX(-1)' }
      }
    />
  );
}
