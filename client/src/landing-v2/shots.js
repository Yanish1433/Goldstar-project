// Product photography for the landing. Every image is served from this app (public/img/catalogue holds the
// goldstarshoes.com catalogue in 800px and 1600px webp), never hotlinked from goldstarshoes.com.

const CAT = '/img/catalogue/';

// A catalogue name (e.g. 'C_M09888-2-scaled-2') as an <img> source set: 800 and 1600 wide.
export const shot = (name) => ({
  src: `${CAT}${name}-1600.webp`,
  thumb: `${CAT}${name}-800x800.webp`,
  srcSet: `${CAT}${name}-800x800.webp 800w, ${CAT}${name}-1600.webp 1600w`,
});

// The API stores goldstarshoes.com upload URLs. The same files live in public/img/catalogue, so map them onto the
// local copies (same file names, `-800x800` / `-1600` suffixes).
export function localise(url) {
  if (!url) return url;
  const m = /goldstarshoes\.com\/wp-content\/uploads\/[^/]+\/[^/]+\/(.+?)(?:-800x800)?\.webp$/.exec(url);
  return m ? shot(m[1]).thumb : url;
}

// Studio photos on a pure white sweep, per product and colourway. They sit on the landing's ivory tiles with
// `mix-blend-mode: multiply`, so the white melts into the tile (the API's first images for the AX range are shot on
// a grey sweep and would show as a grey square). Each one is the right colour for its colourway.
export const SHELF_SHOTS = {
  'g10-401': { black: 'C_M09888-2-scaled-2', olive: 'C_M09819-2-scaled-2' },
  'g10-l2102': { pink: 'C_M09747-2-1-scaled-2', 'grey-pink': 'C_M09743-2-1-scaled-2' },
  'ax-1-a': { olive: 'C_M09584-3-scaled-2' },
  'ax-3': { black: 'C_M09601-1-scaled-2', coffee: 'C_M09578-2-scaled-2', grey: 'C_M09563-3-scaled-2' },
  ax: { black: 'C_M09597-1-scaled-2', coffee: 'C_M09580-2-scaled-2', grey: 'C_M09565-2-scaled-2' },
};

export function shelfPhoto(product, colour) {
  const name = SHELF_SHOTS[product?.slug]?.[colour?.key];
  if (name) return shot(name);
  const thumb = localise(colour?.image?.thumb || colour?.image?.src);
  return { src: thumb, thumb, srcSet: undefined };
}

export const HERO_SHOT = { ...shot('C_M09888-2-scaled-2'), alt: 'A pair of black Goldstar G10-401 trek boots' };
