import { describe, expect, it } from 'vitest';
import { KEYFRAMES, CAMERA, PHONE_TABLE, sampleTimeline, sToP, makeSample, CALLOUT_STARTS, LAYER_STARTS, SNAP_S } from '../src/three/timeline.js';

const close = (a, b, d = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(d);

describe('sampleTimeline: every keyframe (desktop)', () => {
  KEYFRAMES.forEach((k) => {
    it(`${k.id} at s=${k.s}`, () => {
      const o = sampleTimeline(sToP(k.s), 'desktop');
      k.pos.forEach((v, i) => close(o.pos[i], v));
      k.rot.forEach((v, i) => close(o.rot[i], v));
      close(o.S, k.S);
    });
  });
  it('holds are flat', () => {
    expect(sampleTimeline(sToP(10)).pos[0]).toBeCloseTo(1.1, 6);
    expect(sampleTimeline(sToP(450)).pos[1]).toBeCloseTo(-0.7, 6);
  });
  it('clamps outside 0..1', () => {
    expect(sampleTimeline(-3).pos).toEqual(sampleTimeline(0).pos);
    expect(sampleTimeline(7).pos).toEqual(sampleTimeline(1).pos);
    expect(Number.isFinite(sampleTimeline(NaN).S)).toBe(true);
  });
  it('is continuous in time (no jumps)', () => {
    let prevS = sampleTimeline(0, 'desktop', makeSample()).S;
    for (let i = 1; i <= 900; i += 1) {
      const o = sampleTimeline(i / 900, 'desktop', makeSample());
      expect(Math.abs(o.S - prevS)).toBeLessThan(0.05);
      prevS = o.S;
    }
  });
  it('phone layout: shoe spans ~85% of the width at every chapter (S table), x = 0, y comes from frac', () => {
    KEYFRAMES.forEach((k) => {
      const o = sampleTimeline(sToP(k.s), 'phone');
      close(o.S, PHONE_TABLE[k.id][0]);
      close(o.frac, PHONE_TABLE[k.id][1]);
      expect(o.pos[1]).toBe(0);
      if (k.id !== 'K10') expect(o.pos[0]).toBe(0);
    });
    // the shoe is large at K0, K3, K5 and K8 (FX4)
    ['K0', 'K3', 'K5', 'K8'].forEach((id) => expect(PHONE_TABLE[id][0]).toBeGreaterThanOrEqual(0.75));
  });
});

describe('camera keyframes (U3)', () => {
  CAMERA.forEach((c) => {
    it(`camera at s=${c.s}`, () => {
      const o = sampleTimeline(sToP(c.s), 'desktop');
      c.pos.forEach((v, i) => close(o.cam.pos[i], v));
      c.look.forEach((v, i) => close(o.cam.look[i], v));
      close(o.cam.fov, c.fov);
    });
  });
  it('hero camera is [0, 0.4, 7.5]; performance dollies out; callouts dolly in; finale cranes up', () => {
    expect(sampleTimeline(0).cam.pos).toEqual([0, 0.4, 7.5]);
    expect(sampleTimeline(sToP(100)).cam.pos[2]).toBeCloseTo(8.2, 6);
    expect(sampleTimeline(sToP(250)).cam.pos[2]).toBeCloseTo(6.6, 6);
    expect(sampleTimeline(sToP(450)).cam.pos[1]).toBeCloseTo(0.9, 6);
    expect(sampleTimeline(sToP(900)).cam.pos[1]).toBeGreaterThan(sampleTimeline(sToP(700)).cam.pos[1]);
  });
  it('camera moves smoothly between chapters (no jumps) and clamps outside 0..1', () => {
    let prev = sampleTimeline(0).cam.pos[2];
    for (let i = 1; i <= 900; i += 1) {
      const z = sampleTimeline(i / 900).cam.pos[2];
      expect(Math.abs(z - prev)).toBeLessThan(0.1);
      prev = z;
    }
    expect(sampleTimeline(-5).cam.pos).toEqual(sampleTimeline(0).cam.pos);
    expect(sampleTimeline(9).cam.pos).toEqual(sampleTimeline(1).cam.pos);
  });
});

describe('explode, swoosh, callouts, layers, dust', () => {
  it('explode e: 0 before 400, 1 from 450 to 520, 0 after 570', () => {
    expect(sampleTimeline(sToP(399)).e).toBe(0);
    close(sampleTimeline(sToP(450)).e, 1);
    close(sampleTimeline(sToP(500)).e, 1);
    close(sampleTimeline(sToP(520)).e, 1);
    close(sampleTimeline(sToP(570)).e, 0);
    const mid = sampleTimeline(sToP(425)).e;
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
  });
  it('swoosh draws over 430-480 and fades over 500-530', () => {
    expect(sampleTimeline(sToP(430)).swooshT).toBe(0);
    close(sampleTimeline(sToP(480)).swooshT, 1);
    close(sampleTimeline(sToP(515)).swooshOpacity, 0.5);
    close(sampleTimeline(sToP(530)).swooshOpacity, 0);
  });
  it('callouts draw one after another then retract', () => {
    CALLOUT_STARTS.forEach((st, i) => {
      expect(sampleTimeline(sToP(st - 0.1)).callouts[i].dot).toBe(0);
      close(sampleTimeline(sToP(st + 3)).callouts[i].dot, 1);
      close(sampleTimeline(sToP(st + 9)).callouts[i].line, 1);
      close(sampleTimeline(sToP(st + 15)).callouts[i].text, 1);
    });
    sampleTimeline(sToP(330)).callouts.forEach((c) => {
      expect(c.dot).toBe(0);
      expect(c.line).toBe(0);
      expect(c.text).toBe(0);
    });
    const mid = sampleTimeline(sToP(307));
    expect(mid.callouts[0].line).toBeLessThan(1);
    expect(mid.callouts[0].text).toBe(1);
  });
  it('layer badges appear at 440/455/470 over 8vh', () => {
    LAYER_STARTS.forEach((st, i) => {
      expect(sampleTimeline(sToP(st - 0.1)).layers[i]).toBe(0);
      close(sampleTimeline(sToP(st + 8)).layers[i], 1);
    });
    expect(sampleTimeline(sToP(531)).layers.every((v) => v === 0)).toBe(true);
  });
  it('dust density table', () => {
    close(sampleTimeline(sToP(30)).dust, 1);
    close(sampleTimeline(sToP(110)).dust, 0.35);
    close(sampleTimeline(sToP(300)).dust, 0.25);
    close(sampleTimeline(sToP(750)).dust, 0.5);
    close(sampleTimeline(sToP(900)).dust, 0.8);
    close(sampleTimeline(sToP(900)).dustSpeed, 1.6);
  });
  it('float only in hero and colour; shoe hidden at the finale', () => {
    expect(sampleTimeline(sToP(10)).float).toBe(1);
    expect(sampleTimeline(sToP(300)).float).toBe(0);
    expect(sampleTimeline(sToP(750)).float).toBe(1);
    expect(sampleTimeline(sToP(900)).shoeVisible).toBe(false);
    expect(sampleTimeline(sToP(750)).shoeVisible).toBe(true);
  });
  it('reduced-motion snap poses exist for every section', () => {
    expect(Object.keys(SNAP_S)).toHaveLength(7);
  });
});
