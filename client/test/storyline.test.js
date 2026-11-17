import { describe, expect, it } from 'vitest';
import { HOLD, INTRO, INTRO_BEATS, KEYS, LAYOUTS, PALETTE, SECTIONS, START, TOTAL, TRACKS, TRANSITION, backgroundAt, colourIndexAt, copyTrack, endOf, introBeat, pinOf, trackAt, samplePose, sectionAt } from '../src/story/storyline.js';
import { STORY_MODEL, LABEL_ORDER, CALLOUTS, BADGES, COLOURWAYS, partColours } from '../src/story/model.config.js';

// WCAG relative luminance / contrast.
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('sections and timing', () => {
  it('each section starts after the previous pin plus one transition', () => {
    let s = 0;
    SECTIONS.forEach((sec) => {
      expect(START[sec.id]).toBe(s);
      s += sec.pin + TRANSITION;
    });
    expect(TOTAL).toBe(endOf('finale'));
  });
  it('follows the storyboard order with distinct colours, ending on the brand blue', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['hero', 'performance', 'callouts', 'anatomy', 'sole', 'colour', 'studio', 'finale']);
    expect(new Set(SECTIONS.map((s) => s.colour)).size).toBe(SECTIONS.length);
    expect(SECTIONS.at(-1).colour).toBe('goldstar');
  });
  it('every hold lies inside its own pin', () => {
    SECTIONS.forEach((s) => {
      expect(HOLD[s.id]).toBeGreaterThanOrEqual(START[s.id]);
      expect(HOLD[s.id]).toBeLessThanOrEqual(endOf(s.id));
      expect(sectionAt(HOLD[s.id])).toBe(SECTIONS.indexOf(s));
    });
  });
  it('copy is fully in before the hold and leaves after it', () => {
    SECTIONS.forEach((s) => {
      const tr = copyTrack(s.id);
      if (tr.in) expect(tr.in[1] + 21).toBeLessThanOrEqual(HOLD[s.id] + 1e-9); // + stagger of 3 items
      if (tr.out) expect(tr.out[0]).toBeGreaterThanOrEqual(HOLD[s.id]);
    });
  });
});

describe('palette contrast (WCAG AA)', () => {
  Object.entries(PALETTE).forEach(([name, p]) => {
    it(`${name}: ink on ground >= 4.5:1`, () => expect(contrast(p.ink, p.bg)).toBeGreaterThanOrEqual(4.5));
  });
  it('anatomy label accent and soft text are readable on pine', () => {
    expect(contrast(PALETTE.pine.accent, PALETTE.pine.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(PALETTE.pine.soft, PALETTE.pine.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(PALETTE.goldstar.soft, PALETTE.goldstar.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('samplePose', () => {
  it('hits every keyframe exactly', () => {
    KEYS.forEach((k) => {
      const o = samplePose(k.t, 'desktop');
      ['ry', 'rx', 'rz', 'lift', 'explode', 'fill'].forEach((key) => {
        if (k[key] !== undefined) expect(o[key]).toBeCloseTo(k[key], 6);
      });
      if (k.box) expect(o.cx).toBeCloseTo(LAYOUTS.desktop[k.box].cx, 6);
    });
  });
  it('is continuous (no jumps) on desktop and phone', () => {
    ['desktop', 'phone'].forEach((layout) => {
      let prev = samplePose(0, layout);
      for (let t = 0.5; t <= TOTAL; t += 0.5) {
        const o = samplePose(t, layout);
        expect(Math.abs(o.ry - prev.ry)).toBeLessThan(0.2); // fastest spin: the flip into the grip pose
        expect(Math.abs(o.cx - prev.cx)).toBeLessThan(0.02);
        expect(Math.abs(o.explode - prev.explode)).toBeLessThan(0.05);
        prev = { ...o };
      }
    });
  });
  it('clamps and survives bad input', () => {
    expect(samplePose(-50).ry).toBe(samplePose(0).ry);
    expect(samplePose(TOTAL + 500).lift).toBe(samplePose(TOTAL).lift);
    expect(Number.isFinite(samplePose(NaN).fill)).toBe(true);
  });
  it('performance turns a full 360 during its pin', () => {
    expect(samplePose(endOf('performance')).ry - samplePose(START.performance).ry).toBeCloseTo(Math.PI * 2, 6);
  });
  it('explodes only in the anatomy chapter, fully at its hold, and reassembles before it ends', () => {
    expect(samplePose(START.anatomy - 1).explode).toBe(0);
    expect(samplePose(HOLD.anatomy).explode).toBe(1);
    expect(samplePose(endOf('anatomy')).explode).toBe(0);
    expect(samplePose(HOLD.sole).explode).toBe(0);
  });
  it('tilts to the side tread in the grip chapter (never sole-up) and leaves the frame in the finale', () => {
    expect(samplePose(HOLD.sole).rx).toBeLessThan(-0.3);
    expect(samplePose(HOLD.sole).rx).toBeGreaterThan(-0.7);
    expect(samplePose(HOLD.finale).alpha).toBe(0);
    expect(samplePose(HOLD.finale).lift).toBeGreaterThan(3);
  });
  it('studio weight is 1 only in the studio', () => {
    expect(samplePose(HOLD.studio).studio).toBe(1);
    expect(samplePose(HOLD.colour).studio).toBe(0);
    expect(samplePose(HOLD.finale).studio).toBe(0);
  });
  it('phones keep the stage in the top half (copy below)', () => {
    SECTIONS.forEach((s) => {
      const o = samplePose(HOLD[s.id], 'phone');
      if (o.alpha < 0.02) return;
      expect(o.cy + o.h / 2).toBeLessThanOrEqual(0.6);
    });
  });
  it('desktop stage never covers the copy column', () => {
    // copy left (hero, colour): stage starts right of 36vw + 6vw; copy right (reveal, sole): stage ends before 60vw
    [['hero', 'left'], ['colour', 'left'], ['performance', 'right'], ['sole', 'right']].forEach(([id, copy]) => {
      const o = samplePose(HOLD[id], 'desktop');
      if (copy === 'left') expect(o.cx - o.w / 2).toBeGreaterThanOrEqual(0.4);
      else expect(o.cx + o.w / 2).toBeLessThanOrEqual(0.6 + 1e-9);
    });
  });
});

describe('labels, background, colour', () => {
  it('callouts and badges appear one by one and leave before the chapter ends', () => {
    [['callouts', CALLOUTS, 'callouts'], ['badges', BADGES, 'anatomy']].forEach(([key, list, sec]) => {
      const tr = TRACKS[key];
      list.forEach((_, n) => {
        const s0 = tr.from + n * tr.step;
        expect(trackAt(key, s0 - 0.01, n)).toBe(0);
        expect(trackAt(key, s0 + tr.fade, n)).toBe(1);
        expect(trackAt(key, tr.out[1], n)).toBe(0);
        expect(trackAt(key, HOLD[sec], n)).toBe(1);
      });
      expect(tr.out[1]).toBeLessThanOrEqual(endOf(sec));
    });
  });
  it('background is solid during pins and blends during transitions', () => {
    SECTIONS.forEach((s, i) => expect(backgroundAt(HOLD[s.id])).toEqual([i, i, 0]));
    const [a, b, m] = backgroundAt(endOf('hero') + TRANSITION / 2);
    expect([a, b]).toEqual([0, 1]);
    expect(m).toBeCloseTo(0.5, 6);
  });
  it('scroll walks through the colourways in the colour chapter', () => {
    expect(colourIndexAt(START.colour, 4)).toBe(0);
    expect(colourIndexAt(endOf('colour'), 4)).toBe(3);
    expect(colourIndexAt(HOLD.colour, 4)).toBe(0);
    expect(colourIndexAt(START.colour + 10, 1)).toBe(0);
  });
});

describe('model part map and colourways', () => {
  it('every part has a label, detail, offset and anchor, and every colourway colours every part', () => {
    expect([...LABEL_ORDER].sort()).toEqual(Object.keys(STORY_MODEL.parts).sort());
    Object.values(STORY_MODEL.parts).forEach((p) => {
      expect(p.label).toBeTruthy();
      expect(p.detail).toBeTruthy();
      expect(p.offset).toHaveLength(3);
      expect(p.anchor).toHaveLength(3);
      expect(p.nodeNames || p.generate).toBeTruthy();
    });
    COLOURWAYS.forEach((c) => Object.keys(STORY_MODEL.parts).filter((n) => !STORY_MODEL.keepMaterials.includes(n)).forEach((name) => expect(partColours(c.key)[name]).toMatch(/^#[0-9A-F]{6}$/i)));
    [...CALLOUTS, ...BADGES].forEach((c) => expect(STORY_MODEL.parts[c.part]).toBeTruthy());
  });
  it('storyboard colourways map to the real SKUs (Pink/Grey are coming soon)', () => {
    expect(COLOURWAYS.map((c) => c.name)).toEqual(['Himalayan Earth', 'Annapurna Pink', 'Everest Grey', 'Kathmandu Black']);
    expect(COLOURWAYS.map((c) => c.product)).toEqual(['olive', null, null, 'black']);
  });
});

describe('phone framing from the performance chapter on (captain addendum 4b)', () => {
  // Side-on boot length on screen: the framing puts R * frame at fill * min(box) / 2 and the boot is 3 long.
  const lengthPx = (o, W, H) => (o.fill * Math.min(o.w * W, o.h * H) * 1.5) / (o.R * STORY_MODEL.frame);
  [[375, 667], [390, 844], [320, 568], [414, 896]].forEach(([W, H]) => {
    it(`the boot fills >= 85% of a ${W}x${H} phone in the feature chapters`, () => {
      ['performance', 'callouts', 'sole', 'colour'].forEach((id) => {
        const o = samplePose(HOLD[id], 'phone');
        expect(lengthPx(o, W, H) / W).toBeGreaterThanOrEqual(0.85);
      });
    });
  });
  it('the hero keeps its own box (the poster render matches it) and the exploded anatomy keeps R 2.4', () => {
    expect(samplePose(HOLD.hero, 'phone')).toMatchObject(LAYOUTS.phone.hero);
    expect(LAYOUTS.phone.hero).toEqual({ cx: 0.5, cy: 0.32, w: 0.94, h: 0.4 });
    expect(LAYOUTS.desktop.hero).toEqual({ cx: 0.68, cy: 0.55, w: 0.56, h: 0.74 });
    expect(samplePose(HOLD.anatomy, 'phone').R).toBeCloseTo(2.4, 6);
  });
});

// Project the assembled boot's bounding box with the same camera maths as Stage.jsx (orbit camera at the distance that
// fits R*frame in fill*min(box), view offset to the box centre, shoe rotated 'YXZ' and lifted, focus point subtracted).
const BOOT = [3, 2.1394880766826345, 1.345957823419904]; // rig units, measured from g10-hd.glb (buildParts size)
const rotM = (rx, ry, rz) => {
  const c = Math.cos;
  const s = Math.sin;
  const Ry = [[c(ry), 0, s(ry)], [0, 1, 0], [-s(ry), 0, c(ry)]];
  const Rx = [[1, 0, 0], [0, c(rx), -s(rx)], [0, s(rx), c(rx)]];
  const Rz = [[c(rz), -s(rz), 0], [s(rz), c(rz), 0], [0, 0, 1]];
  const mul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  return mul(mul(Ry, Rx), Rz);
};
function projectBoot(o, W, H) {
  const t = Math.tan((30 / 2) * (Math.PI / 180));
  const m = o.fill * Math.min(o.w * W, o.h * H);
  const d = (o.R * STORY_MODEL.frame * H) / (m * t);
  const pos = [Math.sin(o.az) * Math.cos(o.el) * d, Math.sin(o.el) * d, Math.cos(o.az) * Math.cos(o.el) * d];
  const f = pos.map((v) => -v / d);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const r0 = cross(f, [0, 1, 0]);
  const rl = Math.hypot(...r0);
  const r = r0.map((v) => v / rl);
  const u = cross(r, f);
  const R = rotM(o.rx, o.ry, o.rz);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  [-1, 1].forEach((sx) => [-1, 1].forEach((sy) => [-1, 1].forEach((sz) => {
    const p = [(sx * BOOT[0]) / 2 - o.fx, (sy * BOOT[1]) / 2 - o.fy, (sz * BOOT[2]) / 2 - o.fz];
    const w = [0, 1, 2].map((i) => R[i][0] * p[0] + R[i][1] * p[1] + R[i][2] * p[2]);
    w[1] += o.lift;
    const q = [w[0] - pos[0], w[1] - pos[1], w[2] - pos[2]];
    const X = q[0] * r[0] + q[1] * r[1] + q[2] * r[2];
    const Y = q[0] * u[0] + q[1] * u[1] + q[2] * u[2];
    const Z = q[0] * f[0] + q[1] * f[1] + q[2] * f[2];
    const px = ((X / (Z * t * (W / H)) + 1) / 2) * W + o.cx * W - W / 2;
    const py = ((1 - Y / (Z * t)) / 2) * H + o.cy * H - H / 2;
    x0 = Math.min(x0, px);
    x1 = Math.max(x1, px);
    y0 = Math.min(y0, py);
    y1 = Math.max(y1, py);
  })));
  return { x0, x1, y0, y1, cx: (x0 + x1) / 2 / W, cy: (y0 + y1) / 2 / H };
}

describe('hero intro: the whole boot, centred and big, turned by scroll (reversible)', () => {
  // [W, H, layout, appbar px]. The captions sit below the boot: a bottom band on desktop (from 81% of the height) and
  // under it from 55% on phones, so the boot's projected box must stay above that line (and below the AppBar).
  const VIEWPORTS = [[1440, 900, 'desktop', 68], [1841, 822, 'desktop', 68], [1366, 650, 'desktop', 68], [1920, 1080, 'desktop', 68], [1024, 768, 'desktop', 68], [375, 740, 'phone', 64], [390, 844, 'phone', 64], [360, 640, 'phone', 64], [414, 896, 'phone', 64], [320, 568, 'phone', 64]];
  const sweep = (fn, step = 0.5) => { for (let t = 0; t <= INTRO.end; t += step) fn(t); };
  it('ends on the full hero pose, which is the hold; the opening is the intro box', () => {
    expect(HOLD.hero).toBe(INTRO.end);
    expect(samplePose(INTRO.end).R).toBeCloseTo(1.6, 6);
    ['desktop', 'phone'].forEach((l) => expect(samplePose(HOLD.hero, l)).toMatchObject({ fx: 0, fy: 0, fz: 0, rx: 0, ry: -0.65, rz: 0.04, el: 0.14, shadow: 1 }));
    ['desktop', 'phone'].forEach((l) => expect(samplePose(0, l)).toMatchObject(LAYOUTS[l].intro));
  });
  it('T=0 is as large as the Add to cart pose (same framing radius), aimed at the boot centre at every intro step', () => {
    ['desktop', 'phone'].forEach((l) => {
      const a = samplePose(0, l);
      const s = samplePose(HOLD.studio, l);
      expect(a.fill * Math.min(a.w, a.h)).toBeGreaterThanOrEqual(s.fill * Math.min(s.w, s.h) * (l === 'phone' ? 0.9 : 1) - 1e-9);
      expect(a.R).toBe(s.R);
    });
    sweep((t) => { const p = samplePose(t); expect([p.fx, p.fy, p.fz]).toEqual([0, 0, 0]); });
  });
  VIEWPORTS.forEach(([W, H, l, appbar]) => {
    it(`${W}x${H}: the whole boot stays inside the viewport, below the AppBar and clear of the captions at every intro step`, () => {
      const bottom = (l === 'desktop' ? 0.81 : 0.55) * H;
      for (let t = 0; t <= INTRO.glide[0]; t += 5) {
        const b = projectBoot(samplePose(t, l), W, H);
        expect(b.x0, `x0 @${t}`).toBeGreaterThanOrEqual(0.015 * W);
        expect(b.x1, `x1 @${t}`).toBeLessThanOrEqual(0.985 * W);
        expect(b.y0, `top @${t}`).toBeGreaterThanOrEqual(appbar);
        expect(b.y1, `bottom @${t}`).toBeLessThanOrEqual(bottom);
      }
    });
    it(`${W}x${H}: the opening boot is centred (within 5% of the viewport centre; phones sit above their captions)`, () => {
      const b = projectBoot(samplePose(0, l), W, H);
      expect(Math.abs(b.cx - 0.5)).toBeLessThanOrEqual(0.05);
      if (l === 'desktop') expect(Math.abs(b.cy - 0.5)).toBeLessThanOrEqual(0.05);
      else expect(b.cy).toBeLessThanOrEqual(0.4);
    });
  });
  it('each beat turns the whole boot so its part faces the camera; the outsole beat tips but is never sole-up, shadow off', () => {
    const [p1, p2, p3] = INTRO.beatT.map((t) => samplePose(t));
    expect(new Set([p1.ry, p2.ry, p3.ry].map((v) => v.toFixed(2))).size).toBe(3);
    expect(p1.ry).toBeLessThan(-0.6); // 3/4 front: the tongue logo faces the camera
    expect(Math.abs(p2.ry)).toBeLessThan(0.4); // side-on: the lace hardware in profile
    expect(p3.rx).toBeLessThan(-0.3); // tipped: the lugs show
    expect(p3.shadow).toBe(0);
    sweep((t) => { const p = samplePose(t); expect(p.rx).toBeGreaterThanOrEqual(-0.6); expect(p.rx).toBeLessThanOrEqual(0); });
  });
  it('is a pure function of T: the same T gives the same pose (so scrolling up plays it backward exactly)', () => {
    const key = (t) => { const p = samplePose(t); return [p.cx, p.cy, p.fill, p.R, p.rx, p.ry, p.rz, p.el, p.shadow].join(); };
    const fwd = [];
    const back = [];
    sweep((t) => fwd.push(key(t)));
    for (let t = INTRO.end; t >= 0; t -= 0.5) back.unshift(key(t));
    expect(back).toEqual(fwd);
  });
  it('the glide from the centre to the hero box finishes before the headline starts to arrive', () => {
    expect(INTRO.glide[1]).toBeLessThanOrEqual(copyTrack('hero').in[0]);
    expect(INTRO.glide[0]).toBeLessThanOrEqual(INTRO.captionOut[1]);
    ['desktop', 'phone'].forEach((l) => {
      const g = samplePose(INTRO.glide[1], l);
      expect(g).toMatchObject(LAYOUTS[l].hero);
      expect(g.rx).toBe(0);
    });
  });
  it('the first caption is up at T=0 and one caption leads at every T; each beat is fully shown >= 25vh', () => {
    expect(introBeat(0).vis[0]).toBe(1);
    sweep((t) => { if (t <= INTRO.captionOut[0]) expect(Math.max(...introBeat(t).vis)).toBeGreaterThanOrEqual(0.5 - 1e-9); });
    for (let i = 0; i < INTRO_BEATS; i += 1) {
      let run = 0;
      let best = 0;
      for (let t = 0; t <= INTRO.end; t += 0.5) { if (introBeat(t).vis[i] > 0.999) { run += 0.5; best = Math.max(best, run); } else run = 0; }
      expect(best).toBeGreaterThanOrEqual(25);
    }
  });
  it('rail click targets sit inside their own beat, the thumb is monotonic and the rail leaves after the last caption', () => {
    INTRO.beatT.forEach((t, i) => expect(introBeat(t).index).toBe(i));
    let p = 0;
    sweep((t) => { const b = introBeat(t); expect(b.progress).toBeGreaterThanOrEqual(p); p = b.progress; });
    expect(introBeat(INTRO.captionOut[0] - 1).rail).toBe(1);
    expect(introBeat(INTRO.captionOut[1]).rail).toBe(0);
    expect(introBeat(HOLD.hero).vis.every((v) => v === 0)).toBe(true);
  });
  it('the hero headline arrives after the last caption has left and is fully in by the hold', () => {
    const tr = copyTrack('hero');
    expect(tr.in[0]).toBeGreaterThanOrEqual(INTRO.captionOut[0]);
    expect(tr.in[1] + 21).toBeLessThanOrEqual(HOLD.hero + 1e-9);
  });
  it('the intro does not push later chapters out of order', () => {
    expect(START.performance).toBe(100 + pinOf('hero'));
    expect(pinOf('hero')).toBeGreaterThan(INTRO.end);
  });
});
