// Shoe line-art for SideDoodles (64x64 viewBox, side view facing right, single-colour strokes, a few paths each).
// Plain data so the doodles and the scratch contact sheet draw exactly the same thing.

export const BOOT = [
  // upper: padded collar, back of the ankle curving in then out to the heel, instep slope, rounded toe with spring
  'M13 13 C19 11 27 11 33 12.5 M13 13 C11.5 20 12 26 12.5 31 C12.8 36 9.5 38.5 9 45 M41 13 C41.5 22 44 28.5 49 32 C54 34.5 60 36 62 41 C63 43 63.2 44 63.5 45.5',
  // tongue, pull loop, collar padding line
  'M32 12.5 C32 7 35 4.5 38 4.5 C41 4.5 42 8 41.5 13 M12.5 14 C7 13 5.5 17 6.5 21 C7.2 23.5 10 24 12.3 23.5 M12.2 17.8 C17 16.6 22 16.6 26 17.3',
  // laces: four short parallel crossing strokes, a bow at the top, eyelets
  'M30.5 21 L38.5 16 M31.7 25.5 L39.7 20.5 M33.8 30 L41.8 25 M36.8 33.8 L44.8 28.8 M37 15.5 C32.5 11.5 31.5 16.5 37 15.5 C41.5 11.5 42.5 16.5 37 15.5 M37.5 18 h.1 M38.7 22.5 h.1 M40.8 27 h.1 M43.8 30.8 h.1',
  // toe-cap seam and heel-counter seam
  'M51 37 C48 40.5 48 43 49 45 M9.5 42.5 C15 41.5 19 36 18.5 29',
  // midsole band
  'M9 45 H63.5 M9 45 C7 45 6.5 46 6.5 47.5 V48 C6.5 49.5 7.5 50 9 50 H60 C62.5 50 63.5 48 63.5 45.5',
  // outsole: small even lugs
  'M8.5 50 V51.2 Q8.5 53 10.3 53 H12.7 Q14.5 53 14.5 51.2 V50 M15.5 50 V51.2 Q15.5 53 17.3 53 H19.7 Q21.5 53 21.5 51.2 V50 M22.5 50 V51.2 Q22.5 53 24.3 53 H26.7 Q28.5 53 28.5 51.2 V50 M29.5 50 V51.2 Q29.5 53 31.3 53 H33.7 Q35.5 53 35.5 51.2 V50 M36.5 50 V51.2 Q36.5 53 38.3 53 H40.7 Q42.5 53 42.5 51.2 V50 M43.5 50 V51.2 Q43.5 53 45.3 53 H47.7 Q49.5 53 49.5 51.2 V50 M50.5 50 V51.2 Q50.5 53 52.3 53 H54.7 Q56.5 53 56.5 51.2 V50 M57.5 50 V51.2 Q57.5 53 59.3 53 H61.7 Q63.5 53 63.5 51.2 V50',
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

export const HIGHTOP = [
  // canvas upper: low back, scooped collar, tall lace panel, round toe
  'M9 10 C15 8.5 24 8.5 31 9 M9 10 C8.5 20 9 28 9.5 34 C9.5 38 7.5 40 7 44.5 M31 9 C33.5 18 36 26 41 31.5 C46 34 56 34.5 60 39 C62.5 41.5 62.5 43 62.5 44.5',
  // five laces
  'M23.7 13.5 L31.2 9.5 M24.8 18 L32.3 14 M26 22.5 L33.5 18.5 M27.5 27 L35 23 M29.5 31 L37 27',
  // rounded toe cap and ankle circle patch
  'M49.5 34.5 C45.5 37 45.5 41.5 46.5 44.5 M21.5 22 a4.5 4.5 0 1 0 -9 0 a4.5 4.5 0 1 0 9 0',
  // flat vulcanised sole with foxing stripe
  'M7 44.5 H62.5 M7 44.5 V50 C7 52 8 53 10 53 H58 C61.5 53 63 51 63 47.5 V44.5 M7.2 48.2 H62.8',
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
