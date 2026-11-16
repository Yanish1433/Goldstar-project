import { useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { ArrowUpRight } from 'lucide-react';
import { useCategories } from '../api/hooks.js';
import { tokensV2 as t, DISPLAY_LIGHT, EYEBROW, FOCUS_RING, EASE_CSS, FINE_POINTER, PHONE } from './tokensV2.js';
import { Eyebrow, Display, Section, WRAP } from './ui.jsx';
import { useSectionMotion } from './motion.js';

// 3. Category entry as an editorial index: four big light-weight rows (Men, Women, Kids, Trek). On a fine pointer
// the row's shoe appears on a lit ivory tile through a clip-path wipe; on touch each row carries its own thumbnail.
// Signature move: the rows rise in one after another as the index enters.
export const CATEGORIES = [
  { key: 'men', label: 'Men', to: '/shop?category=men', line: 'Trainers, sneakers and everyday shoes', img: '/img/catalogue/C_M09584-2-1-scaled-2-800x800.webp', alt: 'Goldstar AX-1/A sneaker' },
  { key: 'women', label: 'Women', to: '/shop?category=women', line: 'Trek boots and lifestyle pairs', img: '/img/catalogue/C_M09747-2-1-scaled-2-800x800.webp', alt: 'Goldstar G10 L2102 mid-cut boot' },
  { key: 'kids', label: 'Kids', to: '/shop', line: 'School and play, built to last', img: '/v2/grey-sneakers.jpg', alt: 'A pair of grey Goldstar sneakers', note: 'In stores' },
  { key: 'trek-collection', label: 'Trek', to: '/shop?category=trek-collection', line: 'The G10 series and trail gear', img: '/img/catalogue/C_M09888-1-1-scaled-2-800x800.webp', alt: 'Goldstar G10-401 trek boot' },
];

function Row({ c, i, count }) {
  return (
    <Box component="li" data-row sx={{ borderTop: `1px solid ${t.line}`, '&:last-of-type': { borderBottom: `1px solid ${t.line}` } }}>
      <Box
        component={RouterLink}
        to={c.to}
        aria-label={`Shop ${c.label}${count ? `, ${count} styles` : ''}`}
        sx={{
          position: 'relative', display: 'grid', gridTemplateColumns: { xs: '72px 1fr auto', md: '88px 1fr 1fr auto' }, alignItems: 'center', gap: { xs: 2, md: 4 },
          py: { xs: 2, md: 3.5 }, color: t.ivory, textDecoration: 'none', ...FOCUS_RING,
          '& [data-label]': { transition: `transform 700ms ${EASE_CSS}, color 300ms ease` },
          '& [data-tile]': { clipPath: 'inset(0 0 100% 0)', transition: `clip-path 700ms ${EASE_CSS}` },
          '& [data-arrow]': { transition: `transform 600ms ${EASE_CSS}, color 300ms ease` },
          [FINE_POINTER]: {
            '&:hover, &:focus-visible': {
              '& [data-label]': { transform: 'translateX(18px)' },
              '& [data-tile]': { clipPath: 'inset(0 0 0% 0)' },
              '& [data-arrow]': { transform: 'translate(4px, -4px)', color: t.gold },
            },
          },
        }}
      >
        <Box component="span" sx={{ ...EYEBROW, fontVariantNumeric: 'tabular-nums', [PHONE]: { display: 'none' } }}>{String(i + 1).padStart(2, '0')}</Box>
        {/* Phone thumbnail (always visible on touch) */}
        <Box aria-hidden="true" sx={{ display: 'none', [PHONE]: { display: 'block', width: 72, height: 72, borderRadius: `${t.radiusSm}px`, backgroundColor: t.paper, overflow: 'hidden' } }}>
          <Box component="img" src={c.img} alt="" width={72} height={72} loading="lazy" decoding="async" sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', p: 0.75, boxSizing: 'border-box' }} />
        </Box>
        <Box data-label component="span" sx={{ ...DISPLAY_LIGHT, fontSize: { xs: 'clamp(36px, 11vw, 52px)', md: 'clamp(56px, 6.4vw, 112px)' }, lineHeight: 1 }}>
          {c.label}
        </Box>
        <Box component="span" sx={{ fontSize: 16, lineHeight: 1.5, color: t.ivoryDim, [PHONE]: { display: 'none' } }}>
          {c.line}
          <Box component="span" sx={{ display: 'block', ...EYEBROW, mt: 0.75 }}>{c.note || (count ? `${count} styles online` : 'Shop online')}</Box>
        </Box>
        <Box data-arrow component="span" aria-hidden="true" sx={{ color: t.ivoryDim, display: 'flex' }}>
          <ArrowUpRight size={32} strokeWidth={1.25} />
        </Box>
        {/* Desktop hover tile */}
        <Box
          data-tile
          aria-hidden="true"
          sx={{
            position: 'absolute', right: '9%', top: '50%', width: 'clamp(180px, 16vw, 260px)', aspectRatio: '1', mt: 'calc(clamp(180px, 16vw, 260px) / -2)',
            borderRadius: `${t.radiusMd}px`, backgroundColor: t.paper, boxShadow: t.shadowFloating, pointerEvents: 'none', zIndex: 2, overflow: 'hidden',
            [PHONE]: { display: 'none' },
          }}
        >
          <Box component="img" src={c.img} alt={c.alt} loading="lazy" decoding="async" width={260} height={260} sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', p: 2, boxSizing: 'border-box' }} />
        </Box>
      </Box>
    </Box>
  );
}

export default function Categories() {
  const ref = useRef(null);
  const cats = useCategories();
  const count = (key) => cats.data?.find((x) => x.slug === key)?.count;
  useSectionMotion(ref, (gsap) => {
    gsap.from('[data-row]', { yPercent: 40, opacity: 0, duration: 1.2, stagger: 0.09, scrollTrigger: { trigger: '[data-rows]', start: 'top 82%' } });
    gsap.from('[data-head] > *', { y: 24, opacity: 0, duration: 1.1, stagger: 0.08, scrollTrigger: { trigger: '[data-head]', start: 'top 85%' } });
  });
  return (
    <Section id="categories" labelledBy="cat-heading" sx={{ py: { xs: 10, md: 16 } }}>
      <Box ref={ref} sx={WRAP}>
        <Box data-head sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 3, mb: { xs: 5, md: 8 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Eyebrow>The range</Eyebrow>
            <Display id="cat-heading">A shoe for every road in Nepal.</Display>
          </Box>
          <Box component="p" sx={{ m: 0, maxWidth: '36ch', fontSize: { xs: 16, md: 18 }, lineHeight: 1.6, color: t.ivoryDim }}>
            From Kathmandu pavements to the Annapurna circuit: pick a starting point.
          </Box>
        </Box>
        <Box component="ul" data-rows sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {CATEGORIES.map((c, i) => <Row key={c.key} c={c} i={i} count={count(c.key)} />)}
        </Box>
      </Box>
    </Section>
  );
}
