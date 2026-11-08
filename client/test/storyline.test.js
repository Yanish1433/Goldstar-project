import { describe, expect, it } from 'vitest';
import { HOLD, KEYS, LAYOUTS, PALETTE, SECTIONS, START, TOTAL, TRACKS, TRANSITION, backgroundAt, colourIndexAt, copyTrack, endOf, trackAt, samplePose, sectionAt } from '../src/story/storyline.js';
import { STORY_MODEL, LABEL_ORDER, CALLOUTS, BADGES, COLOURWAYS, partColours } from '../src/story/model.config.js';
import { classifyTriangles, lineAt } from '../src/story/splitModel.js';

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
    COLOURWAYS.forEach((c) => Object.keys(STORY_MODEL.parts).forEach((name) => expect(partColours(c.key)[name]).toHaveLength(2)));
    [...CALLOUTS, ...BADGES].forEach((c) => expect(STORY_MODEL.parts[c.part]).toBeTruthy());
  });
  it('storyboard colourways map to the real SKUs (Pink/Grey are coming soon)', () => {
    expect(COLOURWAYS.map((c) => c.name)).toEqual(['Himalayan Earth', 'Annapurna Pink', 'Everest Grey', 'Kathmandu Black']);
    expect(COLOURWAYS.map((c) => c.product)).toEqual(['olive', null, null, 'black']);
  });
});

describe('classifyTriangles', () => {
  // Two disconnected quads: a big one (rank 0, 4 tris) and a small one (rank 1, 2 tris), plus a triangle that
  // is welded to the big one through duplicated positions (UV seam).
  const V = [
    // big: two stacked quads, y 0..1 and y 1..2
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 2, 0], [0, 2, 0],
    // small quad far away
    [5, 0, 0], [6, 0, 0], [6, 1, 0], [5, 1, 0],
    // seam duplicate of [1,2,0] and [0,2,0] + a new apex (belongs to the big island)
    [1, 2, 0], [0, 2, 0], [0.5, 3, 0],
  ];
  const I = [0, 1, 2, 0, 2, 3, 3, 2, 4, 3, 4, 5, 6, 7, 8, 6, 8, 9, 10, 12, 11];
  const pos = (i) => V[i];
  it('ranks islands by size (welding seams) and applies rules in order', () => {
    const { tri, islandCount } = classifyTriangles(pos, V.length, I, [{ islands: [0], where: { maxY: 1 } }, { islands: [1] }, { islands: [0] }]);
    expect(islandCount).toBe(2);
    expect(Array.from(tri)).toEqual([0, 0, 2, 2, 1, 1, 2]);
  });
  it('leaves unmatched triangles at -1 and supports a floor line', () => {
    const { tri } = classifyTriangles(pos, V.length, I, [{ islands: [0], where: { below: [[0, 1], [1, 1]] } }]);
    expect(Array.from(tri)).toEqual([0, 0, -1, -1, -1, -1, -1]);
    expect(lineAt([[0, 0], [2, 2]], 1)).toBe(1);
    expect(lineAt([[0, 0], [2, 2]], -5)).toBe(0);
    expect(lineAt([[0, 0], [2, 2]], 9)).toBe(2);
  });
});
