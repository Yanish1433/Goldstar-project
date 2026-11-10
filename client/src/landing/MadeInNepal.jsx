import Box from '@mui/material/Box';
import { MapPin, Phone, Truck } from 'lucide-react';
import { brand, WIDE } from '../theme/tokens.js';
import { Eyebrow, LUG_PATTERN, Pill } from './ui.jsx';

// Brand story band: the Devanagari wordmark (Mukta) set huge over the G10's lug pattern, and three plain facts.
const FACTS = [
  { icon: MapPin, title: 'Made in Nepal', body: 'Designed and made by Goldstar Stride in Kathmandu.' },
  { icon: Truck, title: 'Cash on delivery', body: 'Order online and pay when your pair arrives.' },
  { icon: Phone, title: 'Order by phone', body: '+977-9801235097', href: 'tel:+9779801235097' },
];

export default function MadeInNepal() {
  return (
    <Box
      component="section"
      aria-labelledby="nepal-h"
      sx={{
        position: 'relative', overflow: 'hidden', color: brand.onNight, py: { xs: 9, md: 15 },
        backgroundColor: brand.navyDeep,
        backgroundImage: `linear-gradient(180deg, ${brand.navy} 0%, ${brand.navyDeep} 100%)`,
        '&::before': { content: '""', position: 'absolute', inset: 0, backgroundImage: LUG_PATTERN, backgroundSize: '28px 28px', opacity: 0.05, pointerEvents: 'none' },
      }}
    >
      <Box sx={{ position: 'relative', maxWidth: 1440, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, boxSizing: 'border-box' }}>
        <Box
          aria-hidden="true"
          lang="ne"
          sx={{ fontFamily: 'Mukta', fontWeight: 700, lineHeight: 0.9, letterSpacing: 0, whiteSpace: 'nowrap', color: 'transparent', WebkitTextStroke: `1.5px ${brand.gold}`, opacity: 0.85, fontSize: 'min(calc((100vw - 32px) / 3.4), 400px)', mb: { xs: 3, md: 5 }, userSelect: 'none' }}
        >
          गोल्डस्टार
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '6fr 5fr' }, gap: { xs: 5, md: 10 }, alignItems: 'start' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Eyebrow>Made with love in Nepal</Eyebrow>
            <Box component="h2" id="nepal-h" sx={{ m: 0, fontWeight: 800, ...WIDE, letterSpacing: '-0.03em', lineHeight: 0.98, fontSize: { xs: 'clamp(32px, 9vw, 44px)', md: 'clamp(44px, 4vw, 66px)' }, textWrap: 'balance' }}>
              From Kathmandu, for every road in Nepal.
            </Box>
            <Box component="p" sx={{ m: 0, fontSize: { xs: 16, md: 19 }, lineHeight: 1.55, color: brand.onNight2, maxWidth: '46ch' }}>
              Goldstar makes shoes for the way Nepal walks: city stairs, school runs, hill roads and high trails. The G10 is the trail end of that line-up.
            </Box>
            <Box sx={{ mt: 1 }}>
              <Pill to="/shop" variant="gold">Shop Goldstar</Pill>
            </Box>
          </Box>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: { xs: 1.5, md: 2 } }}>
            {FACTS.map(({ icon: Icon, title, body, href }) => (
              <Box component="li" key={title} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: { xs: 2, md: 2.5 }, borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${brand.line}` }}>
                <Box sx={{ width: 44, height: 44, flex: '0 0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: 'rgba(226,184,87,0.14)', color: brand.goldText }}>
                  <Icon size={20} strokeWidth={2} aria-hidden="true" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box component="h3" sx={{ m: 0, fontSize: 17, fontWeight: 800 }}>{title}</Box>
                  {href ? (
                    <Box component="a" href={href} sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: brand.onNight, fontSize: 16, fontWeight: 600, textDecorationColor: brand.gold, textUnderlineOffset: '4px', '&:hover': { color: brand.goldText }, '&:focus-visible': { outline: `3px solid ${brand.goldText}`, outlineOffset: 2 } }}>{body}</Box>
                  ) : (
                    <Box component="p" sx={{ m: 0, mt: 0.5, fontSize: 15, lineHeight: 1.5, color: brand.onNight2 }}>{body}</Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
