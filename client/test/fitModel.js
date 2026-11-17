// Projection of the boot with the camera maths of Stage.jsx (orbit camera at the distance that fits R*frame in
// fill*min(box), view offset to the box centre, shoe rotated 'YXZ' and lifted, focus point subtracted).
// Points: the boot's silhouette (support points of its convex hull, test/fixtures/bootHull.json, made by
// scripts/boot-hull.mjs from the GLB), so the bbox is the real one, not the over-estimating AABB.
import hull from './fixtures/bootHull.json' with { type: 'json' };
import { STORY_MODEL } from '../src/story/model.config.js';

export const HULL = hull;
const BOOT = HULL.size;
export const AABB = [];
[-1, 1].forEach((sx) => [-1, 1].forEach((sy) => [-1, 1].forEach((sz) => AABB.push([(sx * BOOT[0]) / 2, (sy * BOOT[1]) / 2, (sz * BOOT[2]) / 2]))));

const rotM = (rx, ry, rz) => {
  const c = Math.cos;
  const s = Math.sin;
  const Ry = [[c(ry), 0, s(ry)], [0, 1, 0], [-s(ry), 0, c(ry)]];
  const Rx = [[1, 0, 0], [0, c(rx), -s(rx)], [0, s(rx), c(rx)]];
  const Rz = [[c(rz), -s(rz), 0], [s(rz), c(rz), 0], [0, 0, 1]];
  const mul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  return mul(mul(Ry, Rx), Rz);
};

export function projectBoot(o, W, H, points = HULL.points) {
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
  points.forEach((pt) => {
    const p = [pt[0] - o.fx, pt[1] - o.fy, pt[2] - o.fz];
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
  });
  return { x0, x1, y0, y1, cx: (x0 + x1) / 2 / W, cy: (y0 + y1) / 2 / H };
}
