// Commerce kit: the small pieces every shop page shares (badges, price, swatches, trust row, header band, steps).
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Banknote, Check, RotateCcw, Truck } from 'lucide-react';
import { shop, WIDE } from '../../theme/tokens.js';
import { formatNPR, formatRange } from '../../lib/format.js';
import { PageBox } from '../Page.jsx';

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

export function Eyebrow({ children, sx, component = 'p', ...rest }) {
  return (
    <Typography component={component} variant="overline" sx={{ display: 'block', m: 0, ...sx }} {...rest}>
      {children}
    </Typography>
  );
}

// --- Badges --------------------------------------------------------------------------------------------------------
const BADGES = {
  new: { label: 'New', bg: shop.lilac, fg: shop.lilacInk },
  trek: { label: 'Trek', bg: shop.pine, fg: '#FFFFFF' },
  sale: { label: 'Sale', bg: shop.sale, fg: '#FFFFFF' },
  soon: { label: 'Coming soon', bg: shop.saffron, fg: shop.ink },
  out: { label: 'Sold out', bg: shop.ink, fg: '#FFFFFF' },
};

export function ShopBadge({ kind, sx }) {
  const b = BADGES[kind];
  if (!b) return null;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex', alignItems: 'center', height: 24, px: 1.25, borderRadius: `${shop.radius.pill}px`, backgroundColor: b.bg, color: b.fg,
        fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap', ...WIDE, ...sx,
      }}
    >
      {b.label}
    </Box>
  );
}

export const isOnSale = (c) => !!c && c.regularPrice > c.price;

// Badges from catalogue data: New (new-arrival), Trek (trek-collection), Sale (any colour below its regular price),
// Coming soon (nothing in stock). At most two, most useful first.
export function badgesFor(product) {
  const cats = product.categories || [];
  const out = [];
  if (!product.colourways?.some((c) => c.inStock)) out.push('soon');
  if (product.colourways?.some(isOnSale)) out.push('sale');
  if (cats.includes('new-arrival')) out.push('new');
  if (cats.includes('trek-collection')) out.push('trek');
  return out.slice(0, 2);
}

// "Trek · Women", "Casual · Men".
export function descriptorFor(product) {
  const cats = product.categories || [];
  const kind = cats.includes('trek-collection') ? 'Trek' : cats.includes('casual') ? 'Casual' : 'Everyday';
  const who = cats.includes('women') && cats.includes('men') ? 'Unisex' : cats.includes('women') ? 'Women' : cats.includes('men') ? 'Men' : null;
  return [kind, who].filter(Boolean).join(' · ');
}

// --- Price ---------------------------------------------------------------------------------------------------------
// One price, a range, or a sale price (raspberry) with the regular price struck through.
export function PriceTag({ price, regularPrice, from, to, size = 'md', sx, component = 'p' }) {
  const sale = price != null && regularPrice > price;
  const fs = { sm: 15, md: 17, lg: { xs: 28, md: 34 } }[size];
  const strong = { fontWeight: 800, ...(size === 'lg' ? WIDE : null), letterSpacing: size === 'lg' ? '-0.01em' : 0 };
  return (
    <Box component={component} sx={{ m: 0, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 1, rowGap: 0.25, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, ...sx }}>
      <Box component="span" sx={{ ...strong, fontSize: fs, color: sale ? shop.sale : shop.ink }}>
        {sale ? <span style={srOnly}>Sale price </span> : null}
        {price != null ? formatNPR(price) : formatRange(from, to)}
      </Box>
      {sale ? (
        <>
          <Box component="s" sx={{ fontSize: size === 'lg' ? 18 : 14, color: shop.ink2, fontWeight: 500, textDecorationThickness: '1.5px' }}>
            <span style={srOnly}>Regular price </span>
            {formatNPR(regularPrice)}
          </Box>
          {size !== 'sm' ? (
            <Box component="span" sx={{ fontSize: 13, fontWeight: 800, color: shop.sale }}>
              Save {Math.round((1 - price / regularPrice) * 100)}%
            </Box>
          ) : null}
        </>
      ) : null}
    </Box>
  );
}

// Price for a card summary: a range when colours differ, else that colour's (sale) price.
export function CardPrice({ product, colour }) {
  if (product.priceFrom !== product.priceTo) return <PriceTag from={product.priceFrom} to={product.priceTo} size="sm" />;
  return <PriceTag price={colour.price} regularPrice={colour.regularPrice} size="sm" />;
}

// --- Swatches ------------------------------------------------------------------------------------------------------
// A real colour dot with a ring when selected. Light colours get a hairline so they read on white.
export function Dot({ hex, size = 20, selected = false }) {
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        display: 'block', width: size, height: size, borderRadius: '50%', backgroundColor: hex, flexShrink: 0,
        boxShadow: selected ? `inset 0 0 0 1px rgba(0,0,0,0.12), 0 0 0 2px ${shop.surface}, 0 0 0 4px ${shop.ink}` : `inset 0 0 0 1px rgba(0,0,0,0.16)`,
        transition: 'box-shadow 180ms ease, transform 180ms ease',
      }}
    />
  );
}

// Tappable swatches on a card: each is a 36 px target holding a 20 px dot (row gap keeps 44 px apart).
export function CardSwatches({ product, value, onChange }) {
  if (product.colourways.length < 2) {
    return <Typography variant="caption" sx={{ color: shop.ink2, fontWeight: 600 }}>{product.colourways[0]?.name}</Typography>;
  }
  return (
    <Box role="radiogroup" aria-label={`${product.name} colour`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: -0.75 }}>
      {product.colourways.map((c) => {
        const on = c.key === value;
        return (
          <Box
            key={c.key}
            component="button"
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.name}
            title={c.name}
            onClick={() => onChange(c.key)}
            sx={{ width: 36, height: 36, p: 0, border: 0, background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', borderRadius: '50%', '&:hover > span': { transform: 'scale(1.12)' } }}
          >
            <Dot hex={c.hex} selected={on} size={18} />
          </Box>
        );
      })}
    </Box>
  );
}

// --- Trust row -----------------------------------------------------------------------------------------------------
// How the demo store works (not claims about a real policy).
export const TRUST = [
  { icon: Banknote, title: 'Cash on delivery', body: 'Pay when the shoes reach you' },
  { icon: Truck, title: 'Delivery across Nepal', body: 'Fee confirmed on the call' },
  { icon: RotateCcw, title: 'Easy returns', body: 'Wrong size? Swap it' },
];

export function TrustRow({ variant = 'row', sx }) {
  const stack = variant === 'stack';
  return (
    <Box
      component="ul"
      aria-label="How this demo store works"
      sx={{
        listStyle: 'none', m: 0, p: 0, display: 'grid', gap: stack ? 1.5 : { xs: 1.5, md: 2 },
        gridTemplateColumns: stack ? '1fr' : { xs: '1fr', sm: 'repeat(3, minmax(0,1fr))' }, ...sx,
      }}
    >
      {TRUST.map(({ icon: Icon, title, body }) => (
        <Box component="li" key={title} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: shop.surface, boxShadow: `inset 0 0 0 1px ${shop.line}`, display: 'grid', placeItems: 'center', flexShrink: 0, color: shop.ink }}>
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>{title}</Typography>
            <Typography sx={{ fontSize: 13, color: shop.ink2, lineHeight: 1.35 }}>{body}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// --- Header band ---------------------------------------------------------------------------------------------------
// A compact branded band in one of the story's grounds, rounded at the bottom, under the header.
export const GROUNDS = {
  tangerine: { bg: shop.tangerine, ink: shop.tangerineInk, soft: 'rgba(26,11,5,0.78)' },
  lilac: { bg: shop.lilac, ink: shop.lilacInk, soft: 'rgba(20,15,51,0.8)' },
  pine: { bg: shop.pine, ink: '#F4F0E6', soft: '#B9D8CF', accent: shop.saffron },
  aubergine: { bg: shop.aubergine, ink: '#FFFFFF', soft: '#C9BEEA', accent: shop.saffron },
  blue: { bg: shop.blue, ink: '#FFFFFF', soft: '#D9D8FF', accent: shop.saffron },
  saffron: { bg: shop.saffron, ink: '#1A1405', soft: 'rgba(26,20,5,0.8)' },
};

export function Band({ ground = 'tangerine', children, sx, innerSx }) {
  const g = GROUNDS[ground];
  return (
    <Box component="section" sx={{ px: { xs: 1, sm: 1.5 }, pt: { xs: 1, sm: 1.5 }, ...sx }}>
      <Box sx={{ position: 'relative', overflow: 'hidden', backgroundColor: g.bg, color: g.ink, borderRadius: { xs: `${shop.radius.lg}px`, md: `${shop.radius.xl}px` } }}>
        <PageBox sx={{ position: 'relative', ...innerSx }}>{children}</PageBox>
      </Box>
    </Box>
  );
}

// --- Checkout steps ------------------------------------------------------------------------------------------------
const STEPS = ['Cart', 'Delivery', 'Confirmed'];

export function Steps({ current = 1, sx }) {
  return (
    <Box component="ol" aria-label="Checkout progress" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, ...sx }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <Box component="li" key={label} aria-current={now ? 'step' : undefined} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0,
                  backgroundColor: done ? shop.ink : now ? shop.blue : 'transparent', color: done || now ? '#FFFFFF' : shop.ink2,
                  boxShadow: done || now ? 'none' : `inset 0 0 0 1.5px ${shop.lineStrong}`,
                }}
              >
                {done ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : i + 1}
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: now ? 800 : 600, color: now || done ? shop.ink : shop.ink2 }}>
                {label}
                {done ? <span style={srOnly}> (done)</span> : null}
              </Typography>
            </Box>
            {i < STEPS.length - 1 ? <Box aria-hidden="true" sx={{ width: { xs: 16, sm: 40 }, height: 2, borderRadius: 1, backgroundColor: done ? shop.ink : shop.lineStrong }} /> : null}
          </Box>
        );
      })}
    </Box>
  );
}

// White rounded panel used for summaries and form sections.
export function Panel({ children, sx, component = 'div', ...rest }) {
  return (
    <Box component={component} sx={{ backgroundColor: shop.surface, borderRadius: `${shop.radius.lg}px`, boxShadow: `inset 0 0 0 1px ${shop.line}`, p: { xs: 2.5, md: 3.5 }, ...sx }} {...rest}>
      {children}
    </Box>
  );
}

// Thumbnail on a cream tile.
export function Thumb({ src, size = 72, sx }) {
  return (
    <Box sx={{ width: size, height: size, flexShrink: 0, borderRadius: `${shop.radius.md}px`, backgroundColor: shop.tile, overflow: 'hidden', ...sx }}>
      {src ? <Box component="img" src={src} alt="" width={size} height={size} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} /> : null}
    </Box>
  );
}
