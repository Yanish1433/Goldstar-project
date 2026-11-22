// Shoe line-art for SideDoodles (64x64 viewBox, side view facing right, single-colour strokes, a few paths each).
// Plain data so the doodles and the scratch contact sheet draw exactly the same thing.

export const BOOT = [
  // upper: padded collar, shin, instep, toe box, down to the welt
  'M12 15 Q23 12 31 13 M43 14 Q44 27 49 33 Q56 36 60 40 Q63 42 63 47 M12 15 Q10 30 9.5 47',
  // tongue poking up over the collar
  'M31 13 Q32 5 38 5 Q43 5 43 14',
  // pull tab at the back
  'M11.5 16 Q5 16 5.5 22 Q6 25 10.5 25',
  // welt + chunky lugged outsole (zig-zag tread)
  'M7 47 H63 M7 47 V51 L11 56 L17 51 L23 56 L29 51 L35 56 L41 51 L47 56 L53 51 L59 56 Q63.5 55 63.5 50 V47',
  // crossing laces, lace bow, toe cap seam and mudguard line
  'M29 20 L41.5 23 L29 26.5 L42.5 30 L30 33.5 L45 35.5 M36 18 C29 11.5 28 19.5 36 18 C43 11.5 44 19.5 36 18 M52 39 Q48.5 43 49.5 47 M10 42 Q30 39.5 47 42',
  // eyelets
  'M41.5 23 h.1 M42.5 30 h.1 M29 20 h.1 M29 26.5 h.1',
];

export const SNEAKER = [
  // upper: heel counter, scooped collar, tongue, lace panel, toe box with a curved toe spring
  'M6.5 44 L6 31.5 Q6 28 10 28.5 Q15 30.5 20 28 L23 23 Q26.5 22.5 29 26 Q33 33 44 34.5 Q55 36 60 42 Q62 45 61 47',
  // heel tab
  'M7.5 28.5 L8 24.5 Q8.5 23 11 23.5 L12 29',
  // cupsole with toe spring
  'M5.5 44 H60 M5.5 44 V47 Q5.5 52 11 52 H46 Q57 52 61 46.5',
  // midline stitch
  'M12 48 h2 M19 48 h2 M26 48 h2 M33 48 h2 M40 48 h2 M47 48 h2',
  // laces
  'M26.5 29.5 l4 -5 M31.5 31.5 l4 -5 M36.5 32.5 l4 -4.5 M41.5 33.5 l3 -3',
  // Goldstar G swoosh
  'M13 41 C22 33 36 41 53 37.5',
];

// one shoe-sole print: forefoot, heel, tread dashes
export const PRINT = [
  'M14.5 12 Q14.5 4 21.5 4 Q28.5 4 28.5 11 Q28.5 17 26.5 23 Q24 28 19 27 Q14.5 25.5 14.5 19 Z',
  'M16.5 35 Q21.5 32.5 25.5 35 Q27 41 25 47 Q23 52 20.5 52 Q17.5 52 16 47 Q14.5 41 16.5 35 Z',
  'M18 11 l7 -2.5 M18 17.5 l8 -2.5 M19.5 41 l5 -1.5',
];
// the pair: left print tilted back, right print mirrored, a step ahead
export const PRINT_A = 'translate(-2 8) rotate(-7 20 28)';
export const PRINT_B = 'translate(66 2) scale(-1 1) rotate(-7 20 28)';
