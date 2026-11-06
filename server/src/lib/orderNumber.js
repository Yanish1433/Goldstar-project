import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // [A-HJ-NP-Z2-9]

/** "GS-261104-7KQ2": GS-YYMMDD (Nepal time, UTC+5:45) + 4 random chars. */
export function generateOrderNumber(now = new Date()) {
  const np = new Date(now.getTime() + (5 * 60 + 45) * 60_000);
  const yy = String(np.getUTCFullYear()).slice(2);
  const mm = String(np.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(np.getUTCDate()).padStart(2, '0');
  let tail = '';
  for (let i = 0; i < 4; i++) tail += ALPHABET[randomInt(ALPHABET.length)];
  return `GS-${yy}${mm}${dd}-${tail}`;
}
