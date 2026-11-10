import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { brand, WIDE } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';
import { Pill } from './ui.jsx';
import { CONTACT, WhatsAppIcon } from '../components/Footer.jsx';

// Sticky mini product bar (Apple's product nav), shown once the hero has scrolled away. Desktop: a slim glass bar
// under the header. Phones: a thumb-reachable bar on the bottom edge (safe-area aware); while it shows it publishes
// its height as --gs-bottom-ui, so the WhatsApp button and the cart snackbar sit above it. Fixed, so no layout shift.
const PHONE = '@media (max-width:899.95px)';
export const BAR_H = 64;

export default function BuyBar({ product }) {
  const [show, setShow] = useState(false);
  const from = product?.colourways?.length ? Math.min(...product.colourways.map((c) => c.price)) : null;

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      setShow(window.scrollY > window.innerHeight * 0.75);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const phone = window.matchMedia?.('(max-width: 899.95px)').matches;
    if (show && phone) root.style.setProperty('--gs-bottom-ui', `calc(${BAR_H}px + env(safe-area-inset-bottom))`);
    else root.style.removeProperty('--gs-bottom-ui');
    return () => root.style.removeProperty('--gs-bottom-ui');
  }, [show]);

  return (
    <Box
      role="region"
      aria-label="G10-401 quick buy"
      aria-hidden={show ? undefined : 'true'}
      inert={show ? undefined : true}
      sx={{
        position: 'fixed', left: 0, right: 0, zIndex: 1100, top: 'var(--appbar-h, 64px)', color: brand.onNight,
        backgroundColor: 'rgba(18,21,58,0.86)', backdropFilter: 'saturate(1.6) blur(18px)', boxShadow: `inset 0 -1px 0 ${brand.line}`,
        transform: show ? 'none' : 'translateY(-110%)', opacity: show ? 1 : 0, visibility: show ? 'visible' : 'hidden',
        transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 240ms ease, visibility 0s linear 320ms',
        ...(show ? { transitionDelay: '0s' } : null),
        '@media (prefers-reduced-motion: reduce)': { transition: 'opacity 160ms ease, visibility 0s linear 160ms', transform: 'none' },
        [PHONE]: {
          top: 'auto', bottom: 0, boxShadow: `inset 0 1px 0 ${brand.line}`, pb: 'env(safe-area-inset-bottom)',
          transform: show ? 'none' : 'translateY(110%)',
        },
      }}
    >
      <Box sx={{ maxWidth: 1440, mx: 'auto', boxSizing: 'border-box', px: { xs: 2, sm: 3, lg: 4 }, height: { xs: BAR_H, md: 56 }, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'baseline' }, columnGap: 2, minWidth: 0, flex: 1 }}>
          <Box component={RouterLink} to="/product/g10-401" tabIndex={-1} sx={{ color: 'inherit', textDecoration: 'none', fontSize: { xs: 16, md: 18 }, fontWeight: 800, ...WIDE, whiteSpace: 'nowrap' }}>G10-401 Trek</Box>
          <Box component="span" sx={{ fontSize: { xs: 13, md: 15 }, color: brand.onNight2, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{from ? `From ${formatNPR(from)}` : 'Made in Nepal'}</Box>
        </Box>
        <Box component={RouterLink} to="/g10" sx={{ display: { xs: 'none', md: 'inline-flex' }, alignItems: 'center', minHeight: 44, color: brand.onNight, fontSize: 15, fontWeight: 600, textDecoration: 'none', '&:hover': { color: brand.goldText }, '&:focus-visible': { outline: `3px solid ${brand.goldText}`, outlineOffset: 2 } }}>
          Explore in 3D
        </Box>
        <Box
          component="a"
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Goldstar on WhatsApp"
          sx={{ display: 'none', [PHONE]: { display: 'grid' }, placeItems: 'center', width: 44, height: 44, flex: '0 0 auto', borderRadius: '50%', backgroundColor: brand.whatsapp, color: '#FFFFFF', '&:focus-visible': { outline: `3px solid ${brand.goldText}`, outlineOffset: 2 } }}
        >
          <WhatsAppIcon size={22} />
        </Box>
        <Pill to="/product/g10-401" size="sm" variant="gold" sx={{ minWidth: 96 }}>Buy</Pill>
      </Box>
    </Box>
  );
}
