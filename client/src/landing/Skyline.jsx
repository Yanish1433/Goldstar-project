import { memo } from 'react';
import { brand } from '../theme/tokens.js';

// A Kathmandu valley skyline, hand-built from a few parametric shapes (no image, ~3 KB of markup): a Himalayan ridge
// behind, then tiered pagodas, the Boudhanath stupa with its gilded spire, a shikhara temple, the Dharahara tower and
// low brick houses, all in one tonal navy that runs into the footer's bottom bar. Decorative (aria-hidden).
const W = 1440;
const H = 220;
const BASE = H;

const r = (n) => Math.round(n * 10) / 10;

// Multi-tier pagoda (Nyatapola style): plinth steps, then roofs that shrink upward with flared eaves.
function pagoda(x, w, tiers, plinth = 3) {
  let y = BASE;
  const parts = [];
  // plinth steps
  for (let i = 0; i < plinth; i += 1) {
    const sw = w * (1 - i * 0.12);
    parts.push(`M${r(x - sw / 2)} ${r(y)}V${r(y - 6)}H${r(x + sw / 2)}V${r(y)}Z`);
    y -= 6;
  }
  let rw = w * 0.82;
  for (let t = 0; t < tiers; t += 1) {
    const body = 9 - t;
    const roof = 12 - t;
    const bw = rw * 0.55;
    parts.push(`M${r(x - bw / 2)} ${r(y)}V${r(y - body)}H${r(x + bw / 2)}V${r(y)}Z`);
    y -= body;
    parts.push(`M${r(x - rw / 2)} ${r(y + 2)}Q${r(x - rw / 2.6)} ${r(y - 1)} ${r(x - bw / 2.4)} ${r(y - roof)}H${r(x + bw / 2.4)}Q${r(x + rw / 2.6)} ${r(y - 1)} ${r(x + rw / 2)} ${r(y + 2)}Z`);
    y -= roof;
    rw *= 0.78;
  }
  return { d: parts.join(''), top: y };
}

function Pagoda({ x, w, tiers, plinth }) {
  const p = pagoda(x, w, tiers, plinth);
  return (
    <>
      <path d={p.d} />
      <path d={`M${x - 1.5} ${p.top}V${p.top - 10}H${x + 1.5}V${p.top}Z`} fill={brand.gold} opacity="0.85" />
    </>
  );
}

// Boudhanath-style stupa: terraces, a dome, the square harmika, thirteen-step spire and a parasol (gilded).
function Stupa({ x, s = 1 }) {
  const b = BASE;
  const dome = 34 * s;
  const terr = [0, 1, 2].map((i) => `M${r(x - (92 - i * 14) * s)} ${r(b - i * 7 * s)}V${r(b - (i + 1) * 7 * s)}H${r(x + (92 - i * 14) * s)}V${r(b - i * 7 * s)}Z`).join('');
  const top = b - 21 * s;
  const domeD = `M${r(x - 50 * s)} ${r(top)}C${r(x - 50 * s)} ${r(top - dome * 1.25)} ${r(x + 50 * s)} ${r(top - dome * 1.25)} ${r(x + 50 * s)} ${r(top)}Z`;
  const hy = top - dome * 0.94;
  const harmika = `M${r(x - 11 * s)} ${r(hy + 2)}V${r(hy - 13 * s)}H${r(x + 11 * s)}V${r(hy + 2)}Z`;
  const sy = hy - 13 * s;
  const spire = `M${r(x - 9 * s)} ${r(sy)}L${r(x - 2 * s)} ${r(sy - 40 * s)}H${r(x + 2 * s)}L${r(x + 9 * s)} ${r(sy)}Z`;
  const rings = Array.from({ length: 6 }, (_, i) => {
    const yy = sy - 5 * s - i * 6 * s;
    const hw = 8 * s - i * 1.05 * s;
    return `M${r(x - hw)} ${r(yy)}H${r(x + hw)}`;
  }).join('');
  const py = sy - 40 * s;
  const parasol = `M${r(x - 8 * s)} ${r(py)}Q${r(x)} ${r(py - 9 * s)} ${r(x + 8 * s)} ${r(py)}Z M${r(x - 1)} ${r(py - 6 * s)}V${r(py - 16 * s)}H${r(x + 1)}V${r(py - 6 * s)}Z`;
  return (
    <>
      <path d={terr + domeD + harmika} />
      <path d={spire + parasol} fill={brand.gold} opacity="0.9" />
      <path d={rings} stroke={brand.skyline} strokeWidth={1.4 * s} fill="none" />
    </>
  );
}

// Shikhara (Krishna Mandir style): a stepped curvilinear tower on a base, with small corner pavilions.
function Shikhara({ x, h = 92 }) {
  const b = BASE - 14;
  const d = `M${x - 34} ${BASE}V${b}H${x + 34}V${BASE}Z`
    + `M${x - 18} ${b}C${x - 18} ${b - h * 0.55} ${x - 8} ${b - h * 0.9} ${x} ${b - h}C${x + 8} ${b - h * 0.9} ${x + 18} ${b - h * 0.55} ${x + 18} ${b}Z`
    + [-28, 28].map((o) => `M${x + o - 7} ${b}V${b - 14}L${x + o} ${b - 24}L${x + o + 7} ${b - 14}V${b}Z`).join('');
  return (
    <>
      <path d={d} />
      <path d={`M${x - 1.2} ${b - h}V${b - h - 12}H${x + 1.2}V${b - h}Z`} fill={brand.gold} opacity="0.85" />
    </>
  );
}

// Dharahara: a slender white tower with a gallery and a small dome.
function Tower({ x, h = 150 }) {
  const d = `M${x - 11} ${BASE}L${x - 7} ${BASE - h}H${x + 7}L${x + 11} ${BASE}Z`
    + `M${x - 10} ${BASE - h}H${x + 10}V${BASE - h - 5}H${x - 10}Z`
    + `M${x - 7} ${BASE - h - 5}C${x - 7} ${BASE - h - 18} ${x + 7} ${BASE - h - 18} ${x + 7} ${BASE - h - 5}Z`;
  return (
    <>
      <path d={d} />
      <path d={`M${x - 1} ${BASE - h - 15}V${BASE - h - 28}H${x + 1}V${BASE - h - 15}Z`} fill={brand.gold} opacity="0.85" />
    </>
  );
}

// Low houses with pitched roofs: a deterministic row (seeded widths and heights).
function houses(x0, x1, seed) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let x = x0;
  const out = [];
  while (x < x1) {
    const w = 22 + rnd() * 30;
    const h = 18 + rnd() * 30;
    out.push(`M${r(x)} ${BASE}V${r(BASE - h)}L${r(x + w / 2)} ${r(BASE - h - 8 - rnd() * 6)}L${r(x + w)} ${r(BASE - h)}V${BASE}Z`);
    x += w - 2;
  }
  return out.join('');
}

// Himalayan ridge: a fixed jagged polyline with a few snow-caught tips.
const RIDGE = [[0, 150], [70, 128], [120, 140], [190, 96], [230, 112], [300, 70], [345, 98], [410, 84], [470, 120], [540, 92], [600, 58], [640, 80], [700, 66], [760, 104], [830, 74], [880, 96], [950, 48], [1000, 78], [1060, 64], [1120, 100], [1190, 80], [1250, 112], [1310, 86], [1380, 118], [1440, 104]];
const ridgeD = `M0 ${H}` + RIDGE.map(([x, y]) => `L${x} ${y}`).join('') + `L${W} ${H}Z`;
const snow = [[300, 70], [600, 58], [950, 48], [1060, 64]].map(([x, y]) => `M${x - 14} ${y + 13}L${x} ${y}L${x + 13} ${y + 12}L${x + 5} ${y + 9}L${x} ${y + 14}L${x - 6} ${y + 9}Z`).join('');

function Skyline({ sx }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" style={{ display: 'block', width: '100%', height: '100%', ...sx }}>
      <path d={ridgeD} fill={brand.indigo} opacity="0.55" />
      <path d={snow} fill="#C9CCF0" opacity="0.18" />
      <g fill={brand.night}>
        <path d={houses(0, 1440, 7)} opacity="0.55" transform="translate(0 -6)" />
        <path d={houses(0, 1440, 3)} />
        <Pagoda x={180} w={70} tiers={3} />
        <Tower x={318} h={150} />
        <Pagoda x={470} w={96} tiers={5} />
        <Stupa x={720} s={1.05} />
        <Shikhara x={940} h={98} />
        <Pagoda x={1080} w={80} tiers={3} plinth={2} />
        <Pagoda x={1270} w={62} tiers={2} />
      </g>
    </svg>
  );
}

export default memo(Skyline);
