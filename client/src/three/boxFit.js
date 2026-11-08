// Pure geometry for the shoebox, derived from the boot's normalised bounding box (no three.js imports).
// Box-local units = the boot's normalised units. The boot lies on its side, toe to heel (lying pose: rotate about x by
// 90deg, so the boot's width becomes the box height and its height becomes the box depth).
export const WALL = 0.09;
export const FLOOR = 0.09;
export const FLAP_OPEN = 2.09; // radians (120deg): flaps stand up and lean outwards, clear of the boot
export const LYING = Math.PI / 2;

// size = [length, height, width] of the normalised boot.
export function fitBox([sx, sy, sz]) {
  const L = sx * 1.08; // inner length: boot + 8%
  const Z = sy * 1.08 + 0.12; // inner depth (the lying boot's height)
  const floorTop = FLOOR + 0.1; // top of the tissue paper
  const restBottom = floorTop + 0.04;
  const restCY = restBottom + sz / 2; // centre of the lying boot's bounding box
  const rim = restBottom + sz + 0.45; // top of the walls
  return {
    inner: { L, Z, H: rim - FLOOR },
    outer: { L: L + 2 * WALL, Z: Z + 2 * WALL, H: rim },
    floorTop,
    restBottom,
    restCY,
    rim,
    flapY: rim - 0.12, // closed tissue flaps sit just under the rim, above the boot
    hoverCY: rim + 0.55 + sz / 2,
    lidH: 0.5,
    boot: { sx, sy, sz },
  };
}

// Half extents of the boot's bounding box after rotating by Euler XYZ (three.js order) angles r = [rx, ry, rz].
export function rotatedHalf([sx, sy, sz], [rx, ry, rz]) {
  const cx = Math.cos(rx);
  const sxn = Math.sin(rx);
  const cy = Math.cos(ry);
  const syn = Math.sin(ry);
  const cz = Math.cos(rz);
  const szn = Math.sin(rz);
  // R = Rx * Ry * Rz
  const m = [
    [cy * cz, -cy * szn, syn],
    [cx * szn + sxn * syn * cz, cx * cz - sxn * syn * szn, -sxn * cy],
    [sxn * szn - cx * syn * cz, sxn * cz + cx * syn * szn, cx * cy],
  ];
  const h = [sx / 2, sy / 2, sz / 2];
  return m.map((row) => Math.abs(row[0]) * h[0] + Math.abs(row[1]) * h[1] + Math.abs(row[2]) * h[2]);
}

// Boot pose in box-local space once it is above the box (t >= arcEnd): bounding-box centre height + rotation.
export function bootLocalPose(s, fit) {
  const lie = s.lie;
  const rot = [LYING * lie + 0.5 * (1 - lie), -0.9 * (1 - lie), 0.7 * (1 - lie)];
  const cy = fit.hoverCY + (fit.restCY - fit.hoverCY) * s.drop + 0.12 * s.bounce;
  return { cx: 0, cy, cz: 0, rot };
}
