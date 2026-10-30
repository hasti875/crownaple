/**
 * Shape samplers.
 * Every shape returns a Float32Array of length n*3 (x,y,z per particle),
 * roughly fitting inside a radius of ~2.5 world units centred on the origin.
 *
 * To add a new shape: write a function (n) => Float32Array and register it in
 * `buildAllShapes` at the bottom. Then reference its key in src/content.ts.
 */

type Vec3 = [number, number, number];
type Sampler = () => Vec3;

const R = Math.random;
const rr = (a: number, b: number) => a + R() * (b - a);
const TAU = Math.PI * 2;

/** random unit vector */
function randDir(): Vec3 {
  const u = R() * 2 - 1;
  const t = R() * TAU;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(t), u, s * Math.sin(t)];
}

/** Fill n points from weighted samplers */
function build(n: number, parts: [number, Sampler][]): Float32Array {
  const out = new Float32Array(n * 3);
  const total = parts.reduce((a, p) => a + p[0], 0);
  let idx = 0;
  parts.forEach(([w, fn], pi) => {
    const count = pi === parts.length - 1 ? n - idx : Math.round((w / total) * n);
    for (let i = 0; i < count && idx < n; i++, idx++) {
      const [x, y, z] = fn();
      out[idx * 3] = x;
      out[idx * 3 + 1] = y;
      out[idx * 3 + 2] = z;
    }
  });
  // shuffle so morphs between shapes mix nicely
  for (let i = n - 1; i > 0; i--) {
    const j = (R() * (i + 1)) | 0;
    for (let k = 0; k < 3; k++) {
      const t = out[i * 3 + k];
      out[i * 3 + k] = out[j * 3 + k];
      out[j * 3 + k] = t;
    }
  }
  return out;
}

/* ---------- primitives ---------- */

function capsule(a: Vec3, b: Vec3, r: number): Sampler {
  return () => {
    const t = R();
    const d = randDir();
    return [
      a[0] + (b[0] - a[0]) * t + d[0] * r,
      a[1] + (b[1] - a[1]) * t + d[1] * r,
      a[2] + (b[2] - a[2]) * t + d[2] * r,
    ];
  };
}

function ellipsoid(c: Vec3, rx: number, ry: number, rz: number, jitter = 0.02): Sampler {
  return () => {
    const d = randDir();
    const j = 1 + rr(-jitter, jitter);
    return [c[0] + d[0] * rx * j, c[1] + d[1] * ry * j, c[2] + d[2] * rz * j];
  };
}

/* ---------- crown ---------- */

/** Crown: cylindrical band + 5 triangular spikes + jewel balls */
function crownSamplers(scale: number, yOff: number): [number, Sampler][] {
  const r = 0.8 * scale;
  const bandH = 0.35 * scale;
  const spikeH = 0.85 * scale;
  const spikes = 5;
  return [
    [
      0.35,
      () => {
        const a = R() * TAU;
        return [Math.cos(a) * r, yOff + R() * bandH, Math.sin(a) * r];
      },
    ],
    [
      0.5,
      () => {
        const k = (R() * spikes) | 0;
        const half = TAU / spikes / 2;
        // triangle on the cylinder: width shrinks linearly with height
        const t = 1 - Math.sqrt(R());
        const w = (1 - t) * half;
        const a2 = (k / spikes) * TAU + rr(-w, w);
        const rad = r * (1 - t * 0.12);
        return [Math.cos(a2) * rad, yOff + bandH + t * spikeH, Math.sin(a2) * rad];
      },
    ],
    [
      0.15,
      () => {
        const k = (R() * spikes) | 0;
        const a = (k / spikes) * TAU;
        const tip = R() < 0.5;
        const c: Vec3 = tip
          ? [Math.cos(a) * r * 0.88, yOff + bandH + spikeH + 0.08 * scale, Math.sin(a) * r * 0.88]
          : [Math.cos(a + TAU / 10) * r * 1.02, yOff + bandH * 0.5, Math.sin(a + TAU / 10) * r * 1.02];
        const d = randDir();
        const s = 0.09 * scale;
        return [c[0] + d[0] * s, c[1] + d[1] * s, c[2] + d[2] * s];
      },
    ],
  ];
}

/* ---------- pineapple ---------- */

function pineappleBody(c: Vec3, rx: number, ry: number): Sampler {
  return () => {
    // rejection sample favouring the diamond lattice lines
    for (;;) {
      const d = randDir();
      const u = Math.atan2(d[2], d[0]);
      const v = d[1];
      const a = ((u * 6) / Math.PI + v * 4) % 1;
      const b = ((u * 6) / Math.PI - v * 4) % 1;
      const fa = Math.min(Math.abs(a), 1 - Math.abs(a));
      const fb = Math.min(Math.abs(b), 1 - Math.abs(b));
      const onLine = fa < 0.06 || fb < 0.06;
      if (onLine || R() < 0.3) {
        const push = onLine ? 1.03 : 1;
        return [c[0] + d[0] * rx * push, c[1] + d[1] * ry * push, c[2] + d[2] * rx * push];
      }
    }
  };
}

export function pineapple(n: number): Float32Array {
  return build(n, [
    [0.66, pineappleBody([0, -0.55, 0], 1.1, 1.5)],
    ...crownSamplers(1, 0.85).map(([w, s]) => [w * 0.3, s] as [number, Sampler]),
    // little stem leaves at the bottom
    [0.04, ellipsoid([0, -2.1, 0], 0.25, 0.12, 0.25, 0.2)],
  ]);
}

export function crown(n: number): Float32Array {
  return build(n, [
    ...crownSamplers(2.1, -1.1),
    // sparkle halo
    [0.06, () => { const a = R() * TAU; const r = rr(2.3, 2.9); return [Math.cos(a) * r, rr(-0.2, 0.2), Math.sin(a) * r]; }],
  ]);
}

/* ---------- growth arrow + bar chart ---------- */

export function arrow(n: number): Float32Array {
  const pts: Vec3[] = [[-2.2, -1.6, 0], [-0.9, -0.2, 0], [0.0, -0.8, 0], [1.6, 1.3, 0]];
  const segs = pts.slice(1).map((p, i) => capsule(pts[i], p, 0.12));
  const end = pts[3];
  const dir = [1.6, 2.1];
  const dl = Math.hypot(dir[0], dir[1]);
  const dx = dir[0] / dl, dy = dir[1] / dl;
  const head: Sampler = () => {
    // cone along dir
    const t = R();
    const rad = (1 - t) * 0.45 * Math.sqrt(R());
    const a = R() * TAU;
    const px = -dy, py = dx;
    const ox = px * Math.cos(a) * rad, oy = py * Math.cos(a) * rad, oz = Math.sin(a) * rad;
    return [end[0] + dx * t * 0.8 + ox, end[1] + dy * t * 0.8 + oy, oz];
  };
  const bars: Sampler = () => {
    const k = (R() * 4) | 0;
    const x = -2 + k * 1.1;
    const h = 0.6 + k * 0.55;
    // box surface
    const face = (R() * 6) | 0;
    const w = 0.35;
    let px = rr(-w, w), py = rr(0, h), pz = rr(-w, w);
    if (face === 0) px = -w; else if (face === 1) px = w;
    else if (face === 2) pz = -w; else if (face === 3) pz = w;
    else if (face === 4) py = 0; else py = h;
    return [x + px, -2.3 + py, pz - 0.6];
  };
  return build(n, [
    [0.15, segs[0]], [0.12, segs[1]], [0.2, segs[2]], [0.18, head], [0.35, bars],
  ]);
}

/* ---------- globe ---------- */

export function globe(n: number): Float32Array {
  const r = 2.2;
  return build(n, [
    [0.45, () => { const d = randDir(); return [d[0] * r, d[1] * r, d[2] * r]; }],
    [0.2, () => { // latitude lines
      const lat = (((R() * 7) | 0) - 3) * 0.38;
      const a = R() * TAU; const rad = Math.cos(lat) * r * 1.01;
      return [Math.cos(a) * rad, Math.sin(lat) * r * 1.01, Math.sin(a) * rad];
    }],
    [0.17, () => { // longitude lines
      const lon = ((R() * 8) | 0) * (Math.PI / 8);
      const t = R() * TAU;
      return [Math.cos(t) * Math.cos(lon) * r * 1.01, Math.sin(t) * r * 1.01, Math.cos(t) * Math.sin(lon) * r * 1.01];
    }],
    [0.18, () => { // tilted orbit ring
      const a = R() * TAU; const rad = rr(2.9, 3.1);
      const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      const tilt = 0.45;
      return [x, z * Math.sin(tilt), z * Math.cos(tilt)];
    }],
  ]);
}

/* ---------- crowned astronaut mascot ---------- */

export function mascot(n: number): Float32Array {
  return build(n, [
    [0.2, ellipsoid([0, 1.0, 0], 0.72, 0.68, 0.68)], // helmet
    [0.06, () => { const d = randDir(); return [d[0] * 0.5, 1.0 + d[1] * 0.35, 0.45 + Math.abs(d[2]) * 0.3]; }], // visor
    ...crownSamplers(0.55, 1.55).map(([w, s]) => [w * 0.12, s] as [number, Sampler]),
    [0.22, ellipsoid([0, -0.25, 0], 0.75, 0.8, 0.55)], // torso
    [0.07, ellipsoid([0, -0.1, -0.6], 0.55, 0.6, 0.22)], // backpack
    [0.08, capsule([-0.7, 0.2, 0], [-1.3, 0.9, 0.2], 0.2)], // waving arm
    [0.08, capsule([0.7, 0.2, 0], [1.1, -0.6, 0.2], 0.2)],
    [0.085, capsule([-0.35, -0.9, 0], [-0.45, -2.0, 0.1], 0.23)],
    [0.085, capsule([0.35, -0.9, 0], [0.45, -2.0, 0.1], 0.23)],
  ]);
}

/* ---------- galaxy swirl ---------- */

export function galaxy(n: number): Float32Array {
  return build(n, [
    [1, () => {
      const arm = (R() * 3) | 0;
      const d = Math.pow(R(), 1.5) * 3;
      const a = arm * (TAU / 3) + d * 1.6 + rr(-0.3, 0.3);
      const s = 0.25 * (1 - d / 4);
      return [Math.cos(a) * d + rr(-s, s), rr(-s, s) * 0.8, Math.sin(a) * d + rr(-s, s)];
    }],
  ]);
}

/* ---------- 2D social logos sampled from canvas ---------- */

type Draw = (c: CanvasRenderingContext2D, S: number) => void;

function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

const LOGOS: Record<string, Draw> = {
  facebook: (c, S) => {
    c.beginPath(); c.arc(S / 2, S / 2, S * 0.45, 0, TAU); c.fill();
    c.globalCompositeOperation = "destination-out";
    c.font = `900 ${S * 0.78}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.fillText("f", S * 0.56, S * 0.98);
  },
  instagram: (c, S) => {
    c.lineWidth = S * 0.08;
    rrect(c, S * 0.1, S * 0.1, S * 0.8, S * 0.8, S * 0.22); c.stroke();
    c.beginPath(); c.arc(S / 2, S / 2, S * 0.19, 0, TAU); c.stroke();
    c.beginPath(); c.arc(S * 0.71, S * 0.29, S * 0.05, 0, TAU); c.fill();
  },
  youtube: (c, S) => {
    rrect(c, S * 0.05, S * 0.2, S * 0.9, S * 0.6, S * 0.16); c.fill();
    c.globalCompositeOperation = "destination-out";
    c.beginPath(); c.moveTo(S * 0.41, S * 0.34); c.lineTo(S * 0.66, S * 0.5); c.lineTo(S * 0.41, S * 0.66); c.closePath(); c.fill();
  },
  linkedin: (c, S) => {
    rrect(c, S * 0.08, S * 0.08, S * 0.84, S * 0.84, S * 0.12); c.fill();
    c.globalCompositeOperation = "destination-out";
    c.font = `900 ${S * 0.55}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("in", S * 0.5, S * 0.55);
  },
  whatsapp: (c, S) => {
    c.lineWidth = S * 0.07;
    c.beginPath(); c.arc(S / 2, S * 0.48, S * 0.36, Math.PI * 0.75, Math.PI * 0.65 + TAU - 0.15); c.stroke();
    c.beginPath(); c.moveTo(S * 0.2, S * 0.7); c.lineTo(S * 0.1, S * 0.92); c.lineTo(S * 0.33, S * 0.83); c.closePath(); c.fill();
    // handset
    c.save(); c.translate(S / 2, S * 0.48); c.rotate(-0.6);
    c.lineWidth = S * 0.09; c.lineCap = "round";
    c.beginPath(); c.arc(0, 0, S * 0.15, Math.PI * 0.6, Math.PI * 1.4); c.stroke();
    c.restore();
  },
  threads: (c, S) => {
    c.font = `700 ${S * 0.95}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("@", S / 2, S * 0.5);
  },
};

function logo(n: number, draw: Draw): Float32Array {
  const S = 200;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const c = cv.getContext("2d")!;
  c.fillStyle = c.strokeStyle = "#fff";
  draw(c, S);
  const data = c.getImageData(0, 0, S, S).data;
  const pix: number[] = [];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (data[(y * S + x) * 4 + 3] > 128) pix.push(x, y);
  const count = pix.length / 2 || 1;
  const scale = 4.4 / S;
  return build(n, [[1, () => {
    const k = ((R() * count) | 0) * 2;
    return [(pix[k] + R() - S / 2) * scale, -(pix[k + 1] + R() - S / 2) * scale, rr(-0.12, 0.12)];
  }]]);
}

/** Pre-sample every shape once, up front */
export function buildAllShapes(n: number): Record<string, Float32Array> {
  const shapes: Record<string, Float32Array> = {
    pineapple: pineapple(n),
    crown: crown(n),
    arrow: arrow(n),
    globe: globe(n),
    mascot: mascot(n),
    galaxy: galaxy(n),
  };
  for (const k of Object.keys(LOGOS)) shapes[k] = logo(n, LOGOS[k]);
  return shapes;
}
