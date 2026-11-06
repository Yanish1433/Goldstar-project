import {
  ACRONYMS,
  CALLOUTS_BY_SLUG,
  COLOUR_OVERRIDES,
  FEATURED_SLUG,
  NEPALI_NAMES,
  SORT_ORDER,
  SWATCHES,
} from '../seed/data/curated.js';
import { toNpr } from './money.js';
import { slugify } from './slug.js';

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** GET the Store API with a 10 s timeout. Throws on any failure. */
export async function fetchWooProducts(baseUrl, { timeoutMs = 10_000, fetchImpl = fetch } = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set('per_page', '20');
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': DESKTOP_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Store API answered HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Store API returned no products');
  return data;
}

// ---- text helpers -----------------------------------------------------------

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘' };

export function decodeEntities(s) {
  return String(s ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, ent) => {
    if (ent[0] === '#') {
      const code = ent[1].toLowerCase() === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[ent.toLowerCase()] ?? m;
  });
}

export function stripHtml(html) {
  return decodeEntities(
    String(html ?? '')
      .replace(/<(br|\/p|\/li|\/div|\/h[1-6])\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ''),
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** "RUBBER OUTSOLE FOR DURABILITY & SLIP RESISTANCE" -> "Rubber outsole for durability & slip resistance". */
export function sentenceCase(line) {
  const lower = line.trim().toLowerCase();
  const withAcronyms = lower.replace(/[a-z0-9]+/g, (w) => (ACRONYMS.includes(w.toUpperCase()) ? w.toUpperCase() : w));
  return withAcronyms.charAt(0).toUpperCase() + withAcronyms.slice(1);
}

export function shortSpecsFrom(html) {
  const items = [...String(html ?? '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => stripHtml(m[1]));
  return items.filter(Boolean).map(sentenceCase).slice(0, 12);
}

/** "AX -3" -> "AX-3"; trims, collapses whitespace, drops spaces around hyphens. */
export function normaliseModelName(name) {
  return decodeEntities(name).trim().replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-');
}

// ---- grouping ---------------------------------------------------------------

const attr = (listing, name) =>
  listing.attributes?.find((a) => a.name.toLowerCase() === name.toLowerCase())?.terms?.map((t) => t.name) ?? [];

const sortSizes = (sizes) => [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b));

function coloursOf(listing) {
  if (COLOUR_OVERRIDES[listing.id]) return [COLOUR_OVERRIDES[listing.id]];
  const keys = attr(listing, 'Color').map(slugify).filter(Boolean);
  if (!keys.length) {
    throw new Error(`Listing ${listing.id} has no colour; add it to COLOUR_OVERRIDES in seed/data/curated.js`);
  }
  return keys;
}

/**
 * Turns raw Store API listings into Product documents (plain objects, not yet saved).
 * Pure: no I/O. `meta` = { origin: 'live'|'snapshot', fetchedAt: Date }.
 */
export function groupWooProducts(listings, meta = {}) {
  // newest (highest id) first, so the first listing seen per colour is the primary.
  const sorted = [...listings].sort((a, b) => b.id - a.id);
  const models = new Map();

  for (const listing of sorted) {
    const name = normaliseModelName(listing.name);
    const slug = slugify(name);
    if (!models.has(slug)) models.set(slug, { slug, name, listings: [], colours: new Map() });
    const model = models.get(slug);
    model.listings.push(listing);
    for (const colourKey of coloursOf(listing)) {
      if (!SWATCHES[colourKey]) throw new Error(`No swatch for colour "${colourKey}" (listing ${listing.id})`);
      if (!model.colours.has(colourKey)) model.colours.set(colourKey, []);
      model.colours.get(colourKey).push(listing);
    }
  }

  const swatchOrder = Object.keys(SWATCHES);
  const products = [];

  for (const model of models.values()) {
    const primary = model.listings[0];
    const colourways = [...model.colours.entries()]
      .sort(([a], [b]) => swatchOrder.indexOf(a) - swatchOrder.indexOf(b))
      .map(([key, group]) => {
        const lead = group[0]; // highest id
        const swatch = SWATCHES[key];
        const price = toNpr(lead.prices?.price);
        const regular = Math.max(price, toNpr(lead.prices?.regular_price));
        const sizes = sortSizes(new Set(group.flatMap((l) => attr(l, 'UK-Size'))));
        return {
          key,
          name: swatch.name,
          nameNe: NEPALI_NAMES[model.slug]?.[key] ?? null,
          hex: swatch.hex,
          price,
          regularPrice: regular,
          sizes,
          inStock: group.some((l) => l.is_in_stock !== false),
          images: (lead.images ?? []).map((img) => ({
            src: img.src,
            thumb: img.thumbnail || img.src,
            alt: (img.alt || '').trim() || `${model.name} in ${swatch.name.toLowerCase()}`,
          })),
          productUrl: lead.permalink,
          wooIds: group.map((l) => l.id),
        };
      });

    const categories = [
      ...new Set(model.listings.flatMap((l) => (l.categories ?? []).map((c) => slugify(c.name || c.slug)))),
    ].filter(Boolean);
    const series = model.listings.flatMap((l) => attr(l, 'Series'))[0] ?? null;

    products.push({
      slug: model.slug,
      name: model.name,
      series,
      categories,
      description: stripHtml(primary.description).slice(0, 4000),
      shortSpecs: shortSpecsFrom(primary.short_description),
      featured: model.slug === FEATURED_SLUG,
      active: true,
      sortOrder: SORT_ORDER[model.slug] ?? 100,
      colourways,
      specCallouts: CALLOUTS_BY_SLUG[model.slug] ?? [],
      source: {
        wooIds: model.listings.map((l) => l.id),
        fetchedAt: meta.fetchedAt ?? new Date(),
        origin: meta.origin ?? 'snapshot',
      },
    });
  }

  return products.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
