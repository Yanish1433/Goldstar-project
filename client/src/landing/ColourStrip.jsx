import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { ArrowRight } from 'lucide-react';
import { brand } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';
import { COLOURWAYS } from '../story/model.config.js';
import { Eyebrow, SectionTitle } from './ui.jsx';

// The four G10 colourways as colour-blocked tiles drawn from the boot's own part colours (upper, overlays, toe cap,
// midsole, outsole): no stand-in photography. In-stock ones link to the product page in that colour.
function Tile({ c, product }) {
  const p = c.parts;
  const real = c.product ? product?.colourways?.find((x) => x.key === c.product) : null;
  const body = (
    <>
      <Box
        aria-hidden="true"
        sx={{
          position: 'relative', aspectRatio: '4 / 5', borderRadius: '20px', overflow: 'hidden',
          background: `linear-gradient(160deg, ${p.upper} 0%, ${p.upper} 46%, ${p.overlays} 46%, ${p.overlays} 64%, ${p.collar} 64%)`,
          boxShadow: 'inset 0 0 0 1px rgba(22,18,14,0.06)',
          '&::before': { content: '""', position: 'absolute', left: 0, right: 0, bottom: '17%', height: '9%', backgroundColor: p.midsole },
          '&::after': { content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: '17%', backgroundColor: p.outsole, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 14px, rgba(255,255,255,0.08) 14px 16px)' },
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mt: 1.5 }}>
        <Box>
          <Box component="h3" className="tile-name" sx={{ m: 0, fontSize: { xs: 16, md: 18 }, fontWeight: 800, color: brand.ink }}>{c.name}</Box>
          <Box component="p" sx={{ m: 0, mt: 0.25, fontSize: 14, color: brand.ink2 }}>
            {real ? `In stock · ${formatNPR(real.price)}` : 'Coming soon'}
          </Box>
        </Box>
        {real ? <ArrowRight className="tile-arrow" size={20} strokeWidth={2} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 2, color: brand.navy }} /> : null}
      </Box>
    </>
  );
  if (!real) return <Box component="li" aria-label={`${c.name}, coming soon`} sx={{ opacity: 0.92 }}>{body}</Box>;
  return (
    <Box component="li">
      <Box
        component={RouterLink}
        to={`/product/g10-401?colour=${c.product}`}
        aria-label={`${c.name}, in stock, ${formatNPR(real.price)}: shop this colour`}
        sx={{
          display: 'block', color: 'inherit', textDecoration: 'none', borderRadius: '20px',
          '& > div:first-of-type': { transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms ease' },
          '& .tile-arrow': { transition: 'transform 200ms ease' },
          '@media (hover:hover)': { '&:hover > div:first-of-type': { transform: 'translateY(-4px)', boxShadow: '0 18px 40px rgba(22,18,14,0.16)' }, '&:hover .tile-arrow': { transform: 'translateX(3px)' }, '&:hover .tile-name': { textDecoration: 'underline', textUnderlineOffset: '4px' } },
          '&:focus-visible': { outline: `3px solid ${brand.navy}`, outlineOffset: 4 },
        }}
      >
        {body}
      </Box>
    </Box>
  );
}

export default function ColourStrip({ product }) {
  return (
    <Box component="section" id="colours" aria-labelledby="colours-h" sx={{ backgroundColor: brand.paper, color: brand.ink, py: { xs: 8, md: 14 } }}>
      <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, boxSizing: 'border-box' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 2, md: 6 }, alignItems: 'end', mb: { xs: 4, md: 7 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Eyebrow tone={brand.navy}>Colourways</Eyebrow>
            <SectionTitle id="colours-h">Pick your trail colour.</SectionTitle>
          </Box>
          <Box component="p" sx={{ m: 0, fontSize: { xs: 16, md: 19 }, lineHeight: 1.5, color: brand.ink2, maxWidth: '44ch', justifySelf: { md: 'end' } }}>
            Named for the places it was made to walk. Every colourway is the same boot: same lugs, same midsole, same tough upper.
          </Box>
        </Box>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, columnGap: { xs: 1.5, md: 3 }, rowGap: { xs: 3, md: 4 } }}>
          {COLOURWAYS.map((c) => <Tile key={c.key} c={c} product={product} />)}
        </Box>
      </Box>
    </Box>
  );
}
