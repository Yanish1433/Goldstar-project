// Gold sparkles for Add to cart (the storyboard's glitter + trail to the cart). One fixed 2D canvas, created on demand
// and removed when the last particle dies; no WebGL. A burst pops from the source (button / product photo), a stream
// of glints arcs to the cart icon, and onLand fires when the stream arrives (~720 ms; all gone by ~1 s), with a small burst there.
// Particles are drawn from two pre-rendered sprites (soft dot, four-point glint) so a frame is just drawImage calls.

const GOLDS = ['#FFC21A', '#F5B400', '#FFB800', '#E39B00', '#FFD24D'];
const LAND_AT = 720; // ms after start
const BURST = 64;
const STREAM_FROM = 80;
const STREAM_TO = 500;

let canvas = null;
let ctx = null;
let dpr = 1;
let raf = 0;
let last = 0;
let parts = [];
let flights = [];
let sprites = null;

const rnd = (a, b) => a + Math.random() * (b - a);

function makeSprites() {
  const mk = (size, draw) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    if (!g) return null;
    draw(g, size);
    return c;
  };
  const sprite = (colour) => ({
    dot: mk(32, (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, '#FFF6D6');
      r.addColorStop(0.3, colour);
      r.addColorStop(0.62, colour);
      r.addColorStop(1, 'rgba(201,138,0,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, s, s);
    }),
    star: mk(48, (g, s) => {
      const c = s / 2;
      g.translate(c, c);
      g.fillStyle = colour;
      g.strokeStyle = '#B87700'; // darker rim: reads on cream and white as well as on the colour grounds
      g.lineWidth = 2;
      g.shadowColor = 'rgba(150,95,0,0.55)';
      g.shadowBlur = 5;
      g.beginPath();
      // four-point glint
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const rr = i % 2 ? c * 0.16 : c * 0.82;
        g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath();
      g.fill();
      g.shadowBlur = 0;
      g.stroke();
      g.fillStyle = '#FFFFFF';
      g.beginPath();
      g.arc(0, 0, c * 0.14, 0, Math.PI * 2);
      g.fill();
    }),
  });
  const out = GOLDS.map(sprite);
  return out.every((s) => s.dot && s.star) ? out : null;
}

function ensureCanvas() {
  if (canvas) return true;
  if (typeof document === 'undefined') return false;
  canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'gs-sparkles';
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '2147482000' });
  ctx = canvas.getContext('2d');
  sprites = sprites || (ctx ? makeSprites() : null);
  if (!ctx || !sprites) {
    canvas = null;
    ctx = null;
    return false;
  }
  resize();
  document.body.appendChild(canvas);
  window.addEventListener('resize', resize);
  return true;
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

function teardown() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  last = 0;
  window.removeEventListener('resize', resize);
  canvas?.remove();
  canvas = null;
  ctx = null;
  parts = [];
}

function spawn(x, y, vx, vy, life, opts = {}) {
  parts.push({
    x, y, vx, vy, life, age: 0, size: opts.size ?? rnd(7, 16), star: opts.star ?? Math.random() < 0.45, sp: Math.floor(Math.random() * GOLDS.length),
    g: opts.g ?? 900, drag: opts.drag ?? 2.2, tw: rnd(0, Math.PI * 2), rot: rnd(0, Math.PI), vr: rnd(-6, 6),
    // stream particles follow a bezier instead of physics
    path: opts.path || null, t0: opts.t0 || 0, dur: opts.dur || 0,
  });
}

function burst(x, y, n, spread = 1, life = [360, 680]) {
  for (let i = 0; i < n; i++) {
    const a = rnd(-Math.PI, 0) + rnd(-0.5, 0.5); // mostly upward
    const sp = rnd(140, 460) * spread;
    spawn(x + rnd(-10, 10), y + rnd(-6, 6), Math.cos(a) * sp, Math.sin(a) * sp, rnd(life[0], life[1]));
  }
}

const bez = (p, t) => {
  const u = 1 - t;
  return { x: u * u * p.x0 + 2 * u * t * p.cx + t * t * p.x1, y: u * u * p.y0 + 2 * u * t * p.cy + t * t * p.y1 };
};

// Advance the simulation by dt ms (exported for tests). Returns true while anything is alive.
export function stepSparkles(dt) {
  for (const f of flights) {
    f.t += dt;
    // stream emission: a few glints per frame along the arc, each with its own slight offset
    if (f.t >= STREAM_FROM && f.t <= STREAM_TO) {
      const n = dt > 20 ? 6 : 5;
      for (let i = 0; i < n; i++) {
        const jitter = { ...f.path, cx: f.path.cx + rnd(-40, 40), cy: f.path.cy + rnd(-30, 30) };
        spawn(f.path.x0, f.path.y0, 0, 0, 0, { path: jitter, t0: f.t, dur: LAND_AT - f.t + rnd(-60, 40), size: rnd(6, 13), star: Math.random() < 0.6 });
      }
    }
    if (!f.landed && f.t >= LAND_AT) {
      f.landed = true;
      burst(f.path.x1, f.path.y1, 14, 0.45, [160, 300]);
      f.onLand?.();
    }
  }
  flights = flights.filter((f) => !f.landed);
  const s = dt / 1000;
  for (const p of parts) {
    p.age += dt;
    p.rot += p.vr * s;
    if (p.path) {
      const k = Math.min(1, (p.age) / Math.max(60, p.dur));
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out
      const q = bez(p.path, e);
      p.x = q.x;
      p.y = q.y;
      p.life = p.dur + 120;
    } else {
      p.vx *= Math.exp(-p.drag * s);
      p.vy = p.vy * Math.exp(-p.drag * s) + p.g * s;
      p.x += p.vx * s;
      p.y += p.vy * s;
    }
  }
  parts = parts.filter((p) => p.age < p.life);
  return parts.length > 0 || flights.length > 0;
}

function draw() {
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of parts) {
    const fade = p.path ? (p.age < p.dur ? 1 : Math.max(0, 1 - (p.age - p.dur) / 120)) : 1 - p.age / p.life;
    const twinkle = 0.55 + 0.45 * Math.sin(p.tw + p.age * 0.03);
    ctx.globalAlpha = Math.max(0, Math.min(1, fade * 1.6)) * twinkle;
    const sp = sprites[p.sp];
    const size = p.size * (p.star ? 1.8 : 1.15) * (0.6 + 0.4 * fade);
    if (p.star) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(sp.star, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      ctx.drawImage(sp.dot, p.x - size / 2, p.y - size / 2, size, size);
    }
  }
  ctx.globalAlpha = 1;
}

function frame(t) {
  raf = 0;
  const dt = last ? Math.min(40, t - last) : 16;
  last = t;
  const alive = stepSparkles(dt);
  draw();
  if (alive) raf = requestAnimationFrame(frame);
  else teardown();
}

const centre = (r) => (r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);

// Burst from `sourceRect`, stream to the cart icon, onLand on arrival. Returns false (and calls onLand at once) when
// it cannot draw (no 2D canvas) or there is nowhere to fly.
export function playSparkles({ sourceRect, onLand } = {}) {
  const cartEl = typeof document !== 'undefined' ? document.getElementById('cart-button') : null;
  const from = centre(sourceRect);
  const to = centre(cartEl?.getBoundingClientRect?.());
  if (!from || !to || !ensureCanvas()) {
    onLand?.();
    return false;
  }
  burst(from.x, from.y, BURST);
  const lift = Math.max(120, Math.abs(from.x - to.x) * 0.25);
  flights.push({ t: 0, onLand, landed: false, path: { x0: from.x, y0: from.y, x1: to.x, y1: to.y, cx: (from.x + to.x) / 2 + (to.x > from.x ? -60 : 60), cy: Math.max(28, Math.min(from.y, to.y) - lift) } });
  if (!raf) raf = requestAnimationFrame(frame);
  return true;
}

// Test hook: drop everything.
export function resetSparkles() {
  flights = [];
  teardown();
}
