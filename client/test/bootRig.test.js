import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { buildParts, createTinter, disposeParts, partPoint } from '../src/story/splitModel.js';
import { STORY_MODEL, VIEWER_ANCHORS, displayForProduct, partColour } from '../src/story/model.config.js';

// A tiny stand-in glTF scene with the HD part names: boxes laid out along +x, 0.3 long in total.
function fakeScene({ insole = true } = {}) {
  const scene = new THREE.Group();
  const add = (name, x, y, w, h, matName = name) => {
    const node = new THREE.Group();
    node.name = name;
    node.position.set(x, y, 0);
    node.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), new THREE.MeshPhysicalMaterial({ name: matName })));
    scene.add(node);
    return node;
  };
  add('outsole', 0, 0.01, 0.3, 0.02);
  add('midsole', 0, 0.03, 0.28, 0.02);
  if (insole) add('insole', 0, 0.045, 0.24, 0.01);
  add('upper', 0, 0.12, 0.26, 0.15);
  add('overlays', 0, 0.1, 0.26, 0.1);
  add('toe_cap', 0.12, 0.05, 0.05, 0.04);
  add('heel_counter', -0.12, 0.07, 0.04, 0.08);
  add('eyelets', 0.03, 0.14, 0.08, 0.05);
  add('laces', 0.03, 0.15, 0.08, 0.05);
  const tongue = add('tongue', 0.02, 0.16, 0.05, 0.08);
  tongue.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), new THREE.MeshStandardMaterial({ name: 'logo' })));
  add('collar', -0.08, 0.18, 0.1, 0.03);
  add('pull_tab', -0.115, 0.18, 0.01, 0.03);
  return scene;
}

describe('boot part rig', () => {
  it('maps every HD node to its part, normalises the length and centres the rig', () => {
    const built = buildParts(fakeScene(), STORY_MODEL);
    expect(built.size.x).toBeCloseTo(STORY_MODEL.length, 5);
    STORY_MODEL.order.forEach((n) => expect(built.parts[n].group.children.length).toBeGreaterThan(0));
    const box = new THREE.Box3().setFromObject(built.root);
    expect(box.getCenter(new THREE.Vector3()).length()).toBeLessThan(1e-4);
  });

  it('clones materials per consumer and keeps the logo and hardware untinted', () => {
    const scene = fakeScene();
    const built = buildParts(scene, STORY_MODEL);
    const src = [];
    scene.traverse((o) => o.isMesh && src.push(o.material));
    built.root.traverse((o) => o.isMesh && expect(src).not.toContain(o.material));
    expect(built.parts.tongue.materials).toHaveLength(2);
    expect(built.parts.tongue.tint.map((m) => m.name)).toEqual(['tongue']);
    expect(built.parts.eyelets.tint).toHaveLength(0);
  });

  it('generates a footbed when the lite model has no insole', () => {
    const built = buildParts(fakeScene({ insole: false }), STORY_MODEL);
    expect(built.parts.insole.group.children).toHaveLength(1);
    expect(built.parts.insole.geometries).toHaveLength(1);
  });

  it('dispose releases only its own clones, never the shared glTF geometry', () => {
    const scene = fakeScene();
    const shared = [];
    scene.traverse((o) => o.isMesh && shared.push(vi.spyOn(o.geometry, 'dispose')));
    const built = buildParts(scene, STORY_MODEL);
    const own = built.parts.upper.materials.map((m) => vi.spyOn(m, 'dispose'));
    disposeParts(built);
    own.forEach((s) => expect(s).toHaveBeenCalled());
    shared.forEach((s) => expect(s).not.toHaveBeenCalled());
  });

  it('tints per part (pink: dark toe and heel) and eases to the target', () => {
    const built = buildParts(fakeScene(), STORY_MODEL);
    const t = createTinter(built.parts);
    const c = (hex) => new THREE.Color(hex);
    t.set({ upper: '#E2789A', toe_cap: '#2B2328' }, true);
    expect(built.parts.toe_cap.tint[0].color.equals(c('#2B2328'))).toBe(true);
    expect(built.parts.collar.tint[0].color.equals(c('#E2789A'))).toBe(true);
    expect(t.step(0.016)).toBe(false);
    t.set({ upper: '#303034' });
    expect(t.step(0.016)).toBe(true);
    for (let i = 0; i < 200 && t.step(0.05); i += 1);
    expect(built.parts.upper.tint[0].color.equals(c('#303034'))).toBe(true);
    expect(partColour('pink', 'toe_cap')).not.toBe(partColour('pink', 'upper'));
  });

  it('product hotspots resolve to points on real parts; SKU colours map to display colourways', () => {
    const built = buildParts(fakeScene(), STORY_MODEL);
    built.root.updateMatrixWorld(true);
    Object.values(VIEWER_ANCHORS).forEach((a) => expect(partPoint(built, a.part, a.anchor)).toBeInstanceOf(THREE.Vector3));
    expect(displayForProduct('olive').key).toBe('earth');
    expect(displayForProduct('black').key).toBe('black');
    expect(displayForProduct('nope').key).toBe('black');
  });
});
