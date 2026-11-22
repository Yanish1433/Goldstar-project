import { describe, expect, it } from 'vitest';
import { HOLD, KEYS, LAYOUTS, storyLayout, compactLabels, PALETTE, SECTIONS, START, TOTAL, TRACKS, TRANSITION, backgroundAt, colourIndexAt, copyTrack, endOf, pinOf, trackAt, samplePose, sectionAt } from '../src/story/storyline.js';
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

import { projectBoot, AABB } from './fitModel.js';

describe('hero opening: the page starts on the hero pose (no intro)', () => {
  // Every size of the responsive matrix (client/scripts/responsive-matrix.mjs), with the layout storyLayout picks.
  const MATRIX = [[320, 568], [360, 640], [360, 800], [375, 667], [375, 812], [390, 844], [393, 852], [412, 915], [414, 896], [430, 932],
    [667, 375], [844, 390], [932, 430], [740, 360], [768, 1024], [820, 1180], [1024, 768], [1024, 1366], [1280, 720], [1366, 650], [1440, 900], [1536, 730], [1841, 822], [1920, 1080], [2560, 1080], [2560, 1440]];
  const VIEWPORTS = MATRIX.map(([W, H]) => {
    const l = storyLayout(W, H);
    return [W, H, l, l === 'desktop' ? 68 : 64];
  });
  it('picks the layout from the viewport: landscape phones side by side, portrait < 900 stacked, the rest desktop', () => {
    expect(storyLayout(844, 390)).toBe('landscape');
    expect(storyLayout(932, 430)).toBe('landscape');
    expect(storyLayout(667, 375)).toBe('landscape');
    expect(storyLayout(390, 844)).toBe('phone');
    expect(storyLayout(820, 1180)).toBe('phone');
    expect(storyLayout(1024, 768)).toBe('desktop');
    expect(storyLayout(1024, 1366)).toBe('desktop');
    expect(storyLayout(1366, 650)).toBe('desktop');
    expect(storyLayout(2560, 1080)).toBe('desktop');
    expect(compactLabels('landscape') && compactLabels('phone') && !compactLabels('desktop')).toBe(true);
  });
  it('every layout has every box, and none is left over from the removed intro', () => {
    Object.values(LAYOUTS).forEach((boxes) => expect(Object.keys(boxes).sort()).toEqual(Object.keys(LAYOUTS.desktop).sort()));
    expect(Object.keys(LAYOUTS.desktop)).not.toContain('intro');
  });
  it('the first frame is the hero pose in its own box, held for a short pin, and the hold is the first frame', () => {
    ['desktop', 'phone', 'landscape'].forEach((l) => expect(samplePose(0, l)).toMatchObject(LAYOUTS[l].hero));
    expect(HOLD.hero).toBe(0);
    expect(pinOf('hero')).toBe(40);
    expect(samplePose(0).fill).toBeCloseTo(0.92, 6);
  });
  it('the hero headline is not scroll-driven: it is on screen at load', () => {
    expect(copyTrack('hero').in).toBeNull();
  });
  it('the silhouette model is the real boot: inside its AABB at the hero pose', () => {
    const o = samplePose(0, 'desktop');
    const h = projectBoot(o, 1440, 900);
    const a = projectBoot(o, 1440, 900, AABB);
    expect(h.x0).toBeGreaterThanOrEqual(a.x0);
    expect(h.x1).toBeLessThanOrEqual(a.x1);
    expect((h.x1 - h.x0) / (a.x1 - a.x0)).toBeLessThan(0.95);
  });
  VIEWPORTS.forEach(([W, H, l, appbar]) => {
    it(`${W}x${H} (${l}): the hero boot is on screen, below the AppBar, and on the side the copy leaves free`, () => {
      const b = projectBoot(samplePose(0, l), W, H);
      expect(b.x0).toBeGreaterThanOrEqual(0);
      expect(b.x1).toBeLessThanOrEqual(W);
      expect(b.y0).toBeGreaterThanOrEqual(appbar);
      expect(b.y1).toBeLessThanOrEqual(H);
      if (l !== 'phone') expect(b.cx).toBeGreaterThan(0.55); // copy left, boot right
    });
  });
  it('the hero pin hands over to performance in order, and the story is the old one shifted earlier', () => {
    expect(pinOf('hero')).toBeLessThan(START.performance);
    expect(START.performance).toBe(140);
    expect(HOLD.performance).toBeGreaterThan(endOf('hero'));
    const hs = KEYS.filter((k) => k.t <= endOf('hero'));
    expect(hs).toHaveLength(2);
  });
});
