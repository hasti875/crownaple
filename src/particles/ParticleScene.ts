import * as THREE from "three";
import { buildAllShapes } from "./shapes";

/** A scroll keyframe: at scroll position `y` the cloud should be `shape`. */
export interface Keyframe {
  y: number;
  shape: string;
  x: number; // horizontal offset as fraction of half viewport width (-1..1)
  yo: number; // vertical offset as fraction of half viewport height
  s: number; // scale
  spin: number; // rotation speed (0 = face the camera, gentle wobble)
  tint?: string; // optional colour tint (social moments)
}

const vertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aRand;
  attribute vec3 aColor;
  attribute float aSize;
  uniform float uTime, uMorph, uAssemble, uScatter, uPixel, uTintAmt, uMotion;
  uniform vec3 uMouse, uTint;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }

  void main(){
    // per-particle stagger so the morph ripples instead of moving in lock-step
    float st = (aRand.x*0.5+0.5)*0.3;
    float t = clamp((uMorph - st)/0.7, 0.0, 1.0);
    float e = t*t*(3.0-2.0*t);
    vec3 p = mix(aFrom, aTo, e);

    // scatter into a swirling dust cloud mid-transition
    float sc = sin(3.14159*t) * uScatter;
    vec3 dust = rotY(p*1.25 + aRand*2.6, sc*2.5 + uTime*0.25);
    p = mix(p, dust, sc);

    // idle noise drift
    p += uMotion * 0.035 * vec3(sin(uTime*0.8+aRand.y*12.0), cos(uTime*0.7+aRand.z*12.0), sin(uTime*0.6+aRand.x*12.0));

    // loader assemble: from a loose cloud into the shape
    float a = clamp((uAssemble - (aRand.y*0.5+0.5)*0.4)/0.6, 0.0, 1.0);
    a = a*a*(3.0-2.0*a);
    p = mix(aRand*vec3(9.0,6.0,6.0), p, a);

    vec4 world = modelMatrix * vec4(p, 1.0);
    // mouse repel (world-space, z=0 plane)
    vec2 d = world.xy - uMouse.xy;
    float dist = length(d);
    world.xy += (d/(dist+1e-4)) * smoothstep(1.3, 0.0, dist) * 0.5 * uMotion;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixel * (18.0 / -mv.z);
    vColor = mix(aColor, uTint, uTintAmt * 0.8);
    vAlpha = 0.7 - sc*0.25;
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.6) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

const dustVertex = /* glsl */ `
  attribute float aSize;
  uniform float uTime, uPixel;
  varying float vA;
  void main(){
    vec3 p = position;
    p.y = mod(p.y + uTime*0.06 + 8.0, 16.0) - 8.0;
    p.x += sin(uTime*0.2 + position.z) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p,1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixel * (10.0 / -mv.z);
    vA = 0.35 + 0.35*sin(uTime*1.5 + position.x*10.0);
  }
`;
const dustFragment = /* glsl */ `
  varying float vA;
  void main(){
    float d = length(gl_PointCoord-0.5);
    gl_FragColor = vec4(1.0, 0.78, 0.4, smoothstep(0.5,0.0,d)*vA);
  }
`;

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class ParticleScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  points: THREE.Points;
  dust: THREE.Points;
  material: THREE.ShaderMaterial;
  shapes: Record<string, Float32Array>;
  keyframes: Keyframe[] = [];
  assemble = 0;
  private seg = -1;
  private spinAngle = 0;
  private mouse = new THREE.Vector2();
  private mouseSmooth = new THREE.Vector2();
  private clock = new THREE.Clock();
  private raf = 0;
  private tint = new THREE.Color();
  private mobile: boolean;

  constructor(canvas: HTMLCanvasElement, private reduced: boolean) {
    this.mobile = window.innerWidth < 768;
    const n = this.mobile ? 12000 : 40000;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.z = 9;

    // Pre-sample all target shapes into Float32Arrays
    this.shapes = buildAllShapes(n);

    const geo = new THREE.BufferGeometry();
    const rand = new Float32Array(n * 3);
    const color = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const palette = [new THREE.Color("#f5a623"), new THREE.Color("#ffcf70"), new THREE.Color("#fff6e5"), new THREE.Color("#c97a2a")];
    for (let i = 0; i < n; i++) {
      rand[i * 3] = Math.random() * 2 - 1;
      rand[i * 3 + 1] = Math.random() * 2 - 1;
      rand[i * 3 + 2] = Math.random() * 2 - 1;
      const r = Math.random();
      const c = palette[r < 0.5 ? 0 : r < 0.82 ? 1 : r < 0.9 ? 2 : 3];
      color.set([c.r, c.g, c.b], i * 3);
      size[i] = 0.6 + Math.random() * (r > 0.82 && r < 0.9 ? 1.8 : 1.0);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.shapes.pineapple), 3));
    geo.setAttribute("aFrom", new THREE.BufferAttribute(new Float32Array(this.shapes.pineapple), 3));
    geo.setAttribute("aTo", new THREE.BufferAttribute(new Float32Array(this.shapes.pineapple), 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uAssemble: { value: 0 },
        uScatter: { value: reduced ? 0 : 1 },
        uMotion: { value: reduced ? 0.2 : 1 },
        uPixel: { value: this.renderer.getPixelRatio() },
        uMouse: { value: new THREE.Vector3(99, 99, 0) },
        uTint: { value: new THREE.Color("#ffcf70") },
        uTintAmt: { value: 0 },
      },
    });
    this.points = new THREE.Points(geo, this.material);
    this.scene.add(this.points);

    // background gold star-dust
    const dn = this.mobile ? 500 : 1400;
    const dpos = new Float32Array(dn * 3);
    const dsize = new Float32Array(dn);
    for (let i = 0; i < dn; i++) {
      dpos.set([(Math.random() - 0.5) * 24, (Math.random() - 0.5) * 16, -Math.random() * 12 + 1], i * 3);
      dsize[i] = 0.5 + Math.random();
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    dgeo.setAttribute("aSize", new THREE.BufferAttribute(dsize, 1));
    this.dust = new THREE.Points(dgeo, new THREE.ShaderMaterial({
      vertexShader: dustVertex, fragmentShader: dustFragment, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixel: { value: this.renderer.getPixelRatio() } },
    }));
    this.scene.add(this.dust);

    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onMove);
    this.loop();
  }

  private onMove = (e: PointerEvent) => {
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  };

  resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.mobile = w < 768;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  /** copy a shape into the from/to attributes when the scroll segment changes */
  private setSegment(i: number) {
    if (i === this.seg) return;
    this.seg = i;
    const geo = this.points.geometry;
    const a = this.keyframes[i], b = this.keyframes[Math.min(i + 1, this.keyframes.length - 1)];
    (geo.attributes.aFrom.array as Float32Array).set(this.shapes[a.shape]);
    (geo.attributes.aTo.array as Float32Array).set(this.shapes[b.shape]);
    geo.attributes.aFrom.needsUpdate = true;
    geo.attributes.aTo.needsUpdate = true;
  }

  setKeyframes(k: Keyframe[]) {
    this.keyframes = k;
    this.seg = -1;
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    const u = this.material.uniforms;
    u.uTime.value = time;
    u.uAssemble.value = this.assemble;
    (this.dust.material as THREE.ShaderMaterial).uniforms.uTime.value = time;

    const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    const halfW = halfH * this.camera.aspect;

    // ---- scroll → keyframe segment ----
    const kf = this.keyframes;
    let x = 0, y = 0, s = 1, spin = 0.2, tintAmt = 0;
    if (kf.length > 1) {
      const sy = window.scrollY;
      let i = 0;
      while (i < kf.length - 2 && sy > kf[i + 1].y) i++;
      const span = Math.max(1, kf[i + 1].y - kf[i].y);
      const r = THREE.MathUtils.clamp((sy - kf[i].y) / span, 0, 1);
      this.setSegment(i);
      // hold the shape at both ends, morph in the middle of the segment
      const m = THREE.MathUtils.clamp((r - 0.2) / 0.6, 0, 1);
      u.uMorph.value = this.reduced ? (r < 0.5 ? 0 : 1) : m;
      const e = smooth(r);
      const A = kf[i], B = kf[i + 1];
      x = lerp(A.x, B.x, e); y = lerp(A.yo, B.yo, e); s = lerp(A.s, B.s, e); spin = lerp(A.spin, B.spin, e);
      const ta = A.tint ? 1 - e : 0, tb = B.tint ? e : 0;
      tintAmt = Math.max(ta, tb);
      const tc = ta > tb ? A.tint : B.tint;
      if (tc) this.tint.set(tc);
    }
    if (this.mobile) { x *= 0.25; s *= 0.62; y = y * 0.5 + 0.15; }
    u.uTint.value.lerp(this.tint, 0.15);
    u.uTintAmt.value = lerp(u.uTintAmt.value, tintAmt, 0.1);

    // ---- transforms ----
    const p = this.points;
    p.position.x = lerp(p.position.x, x * halfW, 0.08);
    p.position.y = lerp(p.position.y, y * halfH, 0.08);
    p.scale.setScalar(lerp(p.scale.x, s, 0.08));
    this.mouseSmooth.lerp(this.mouse, 0.05);
    const motion = this.reduced ? 0.15 : 1;
    this.spinAngle += dt * Math.max(spin, 0) * motion;
    const flat = THREE.MathUtils.clamp(1 - spin * 4, 0, 1); // spin≈0 → face camera
    const wobble = Math.sin(time * 0.6) * 0.35;
    p.rotation.y = lerp(this.spinAngle, wobble, flat) + this.mouseSmooth.x * 0.35 * motion;
    p.rotation.x = -this.mouseSmooth.y * 0.2 * motion;
    u.uMouse.value.set(this.mouse.x * halfW, this.mouse.y * halfH, 0);

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onMove);
    this.points.geometry.dispose();
    this.material.dispose();
    this.dust.geometry.dispose();
    (this.dust.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}
