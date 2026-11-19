import { useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { Mail, MapPin, Phone } from 'lucide-react';
import { brand } from '../theme/tokens.js';
import Logo from '../landing/Logo.jsx';
import Skyline from '../landing/Skyline.jsx';
import { BRAND_ICONS } from '../landing/brandIcons.js';

// Site footer (every store route; the admin console is bare). Night-navy ground deepening to indigo, gold column
// heads, a Kathmandu skyline rising out of the bottom bar, and a floating WhatsApp button. Columns: 4 -> 2 -> 1
// (a plain stack on phones, no accordions). Store pages are routed in-app; Goldstar's own pages open goldstarshoes.com.
export const CONTACT = {
  company: 'GOLDSTAR STRIDE LTD',
  phone: '+977-9801235097',
  tel: 'tel:+9779801235097',
  email: 'inquire@goldstarstride.com',
  address: 'Sankha park, Ringroad, Kathmandu',
  whatsapp: 'https://wa.me/9779801235097',
};

const GS = 'https://goldstarshoes.com';
export const SOCIAL = [
  { key: 'facebook', name: 'Facebook', href: 'https://www.facebook.com/Goldstarnepal/' },
  { key: 'instagram', name: 'Instagram', href: 'https://www.instagram.com/goldstar_shoes/' },
  { key: 'tiktok', name: 'TikTok', href: 'https://www.tiktok.com/@goldstarshoes.official' },
  { key: 'pinterest', name: 'Pinterest', href: '#' }, // no Pinterest account is linked from goldstarshoes.com yet
];

export const COLUMNS = [
  {
    title: 'Highlights',
    links: [
      { label: 'New Arrival', to: '/shop?category=new-arrival' },
      { label: 'Best Seller', to: '/shop?category=trending' },
      { label: 'Women’s Collection', to: '/shop?category=women' },
      { label: 'Men’s Collection', to: '/shop?category=men' },
      { label: 'Best Deal', to: '/shop?sort=price_asc' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Privacy Policies', href: `${GS}/privacy-policy/` },
      { label: 'Track Order', to: '/account' },
      { label: 'Account Details', to: '/account' },
      { label: 'Lost Password', to: '/login' },
      { label: 'B2B', href: `${GS}/b2b/` },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: `${GS}/about/` },
      { label: 'Career', href: `${GS}/career/` },
      { label: 'Terms & Conditions', href: `${GS}/terms-conditions/` },
    ],
  },
];

const linkSx = {
  position: 'relative', display: 'inline-flex', alignItems: 'center', minHeight: 44, minWidth: 44, color: brand.onNight2, fontSize: 15, fontWeight: 500,
  textDecoration: 'none', transition: 'color 180ms ease',
  '@media (pointer:fine)': { minHeight: 36 },
  '&::after': { content: '""', position: 'absolute', left: 0, right: 0, bottom: { xs: 8, md: 6 }, height: '1.5px', backgroundColor: brand.gold, transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)' },
  '&:hover': { color: brand.onNight },
  '&:hover::after, &:focus-visible::after': { transform: 'scaleX(1)' },
  '&:focus-visible': { outline: `2px solid ${brand.goldText}`, outlineOffset: 3, borderRadius: '2px', color: brand.onNight },
  '@media (prefers-reduced-motion: reduce)': { '&::after': { transition: 'none' } },
};

function FooterLink({ link }) {
  if (link.to) return <Box component={RouterLink} to={link.to} sx={linkSx}>{link.label}</Box>;
  return <Box component="a" href={link.href} target="_blank" rel="noopener noreferrer" sx={linkSx}>{link.label}</Box>;
}

const headSx = { m: 0, mb: { xs: 1, md: 2 }, fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: brand.goldText };

function BrandIcon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={BRAND_ICONS[name]} fill="currentColor" />
    </svg>
  );
}

function SocialButton({ s }) {
  const ext = s.href !== '#';
  return (
    <Box
      component="a"
      href={s.href}
      aria-label={`Goldstar on ${s.name}`}
      {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
      sx={{
        width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', color: brand.onNight,
        backgroundColor: 'rgba(255,255,255,0.06)', boxShadow: `inset 0 0 0 1px ${brand.line}`,
        transition: 'background-color 180ms ease, color 180ms ease, transform 180ms cubic-bezier(0.22,1,0.36,1)',
        '&:hover': { backgroundColor: brand.gold, color: brand.onGold, transform: 'translateY(-2px)' },
        '&:focus-visible': { outline: `2px solid ${brand.goldText}`, outlineOffset: 3 },
      }}
    >
      <BrandIcon name={s.key} />
    </Box>
  );
}

function ContactLine({ icon: Icon, children, href }) {
  const inner = (
    <>
      <Box component="span" sx={{ width: 32, height: 32, flex: '0 0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: 'rgba(226,184,87,0.12)', color: brand.goldText }}>
        <Icon size={16} strokeWidth={2} aria-hidden="true" />
      </Box>
      <Box component="span" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Box>
    </>
  );
  const sx = { display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 44, color: brand.onNight, fontSize: 15, textDecoration: 'none' };
  return (
    <Box component="li">
      {href ? (
        <Box component="a" href={href} sx={{ ...sx, '&:hover': { color: brand.goldText }, '&:focus-visible': { outline: `2px solid ${brand.goldText}`, outlineOffset: 3 } }}>{inner}</Box>
      ) : (
        <Box sx={{ ...sx, color: brand.onNight2 }}>{inner}</Box>
      )}
    </Box>
  );
}

export function WhatsAppIcon({ size }) {
  return <BrandIcon name="whatsapp" size={size} />;
}

// Phones (and landscape phones): the floating button never covers a control. While the page scrolls it samples
// what lies under it (elementsFromPoint, once per frame) and steps aside (fades out, not clickable) whenever a link,
// button, input or price is beneath it; it comes back as soon as the spot is clear. Desktop keeps the plain button.
export const WA_AVOID_QUERY = '(max-width:899.95px), (max-height:500px) and (orientation:landscape)';
const CONTROL = 'a[href], button, input, select, textarea, label, [role="button"], [data-price]';
export function useStepAside(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !window.matchMedia || !document.elementsFromPoint) return undefined;
    const mq = window.matchMedia(WA_AVOID_QUERY);
    let raf = 0;
    const check = () => {
      raf = 0;
      if (!mq.matches) { el.removeAttribute('data-aside'); return; }
      const r = el.getBoundingClientRect();
      const pts = [[0.5, 0.5], [0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]];
      let hit = false;
      for (const [fx, fy] of pts) {
        const under = document.elementsFromPoint(r.left + r.width * fx, r.top + r.height * fy);
        if (under.some((u) => u !== el && !el.contains(u) && u.closest(CONTROL) && !u.closest('[aria-hidden="true"]'))) { hit = true; break; }
      }
      if (hit) el.setAttribute('data-aside', '');
      else el.removeAttribute('data-aside');
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    mq.addEventListener?.('change', queue);
    // Content can move under a still button (images loading, a route change, a drawer closing).
    const iv = setInterval(queue, 800);
    queue();
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      mq.removeEventListener?.('change', queue);
    };
  }, [ref]);
}

function WhatsAppButton() {
  const ref = useRef(null);
  useStepAside(ref);
  return (
    <Box
      ref={ref}
      component="a"
      href={CONTACT.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Goldstar on WhatsApp"
      sx={{
        position: 'fixed', zIndex: 1150, right: { xs: 16, md: 24 },
        bottom: { xs: 'calc(16px + env(safe-area-inset-bottom) + var(--gs-bottom-ui, 0px))', md: 24 },
        width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center',
        backgroundColor: brand.whatsapp, color: '#FFFFFF', boxShadow: '0 10px 28px rgba(10,12,40,0.35), 0 2px 6px rgba(10,12,40,0.25)',
        transition: 'transform 200ms cubic-bezier(0.22,1,0.36,1), bottom 280ms cubic-bezier(0.22,1,0.36,1), background-color 180ms ease',
        '&:hover': { transform: 'translateY(-2px) scale(1.04)', backgroundColor: '#0F7A6E' },
        '&:focus-visible': { outline: `3px solid ${brand.navy}`, outlineOffset: 3 },
        '@media print': { display: 'none' },
        // Landing on phones: the Buy bar carries WhatsApp instead, so nothing floats over the copy or the CTAs.
        '@media (max-width:899.95px)': { 'html[data-landing] &': { display: 'none' } },
        // Landscape phones: smaller, and clear of a notch / the home indicator.
        '@media (max-height:500px) and (orientation:landscape)': {
          width: 48, height: 48, right: 'max(12px, env(safe-area-inset-right))', bottom: 'calc(12px + env(safe-area-inset-bottom) + var(--gs-bottom-ui, 0px))',
          '& svg': { width: 24, height: 24 },
        },
        [`@media ${WA_AVOID_QUERY}`]: {
          right: 'max(16px, env(safe-area-inset-right))',
          transition: 'transform 200ms cubic-bezier(0.22,1,0.36,1), opacity 180ms ease, visibility 0s linear 0s, bottom 280ms cubic-bezier(0.22,1,0.36,1)',
          '&:hover': { transform: 'none' }, // no sticky hover lift after a tap
          // Fade only: a transform would move the box the check measures (and it would flip back and forth).
          '&[data-aside]': { opacity: 0, visibility: 'hidden', pointerEvents: 'none', transition: 'opacity 180ms ease, visibility 0s linear 180ms' },
        },
      }}
    >
      <BrandIcon name="whatsapp" size={28} />
    </Box>
  );
}

export default function Footer() {
  return (
    <>
      <Box
        component="footer"
        sx={{
          position: 'relative', zIndex: 1, color: brand.onNight, overflow: 'hidden',
          // Night at the top to a dusk-navy glow on the horizon, so the skyline reads as a silhouette.
          backgroundColor: brand.nightRaised,
          backgroundImage: `radial-gradient(70% 45% at 50% 100%, rgba(226,184,87,0.10) 0%, rgba(226,184,87,0) 70%), linear-gradient(180deg, ${brand.nightRaised} 0%, ${brand.navyDeep} 62%, ${brand.navy} 100%)`,
        }}
      >
        <Box sx={{ maxWidth: 1440, mx: 'auto', boxSizing: 'border-box', px: { xs: 2.5, sm: 3, lg: 4 }, pt: { xs: 7, md: 11 }, pb: { xs: 4, md: 5 }, '@media (max-height:500px) and (orientation:landscape)': { pl: 'max(24px, env(safe-area-inset-left))', pr: 'max(24px, env(safe-area-inset-right))' } }}>
          <Box
            sx={{
              display: 'grid', columnGap: { sm: 4, md: 6 }, rowGap: { xs: 5, md: 6 },
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'minmax(0, 1.5fr) repeat(3, minmax(0, 1fr))' },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, gridColumn: { sm: '1 / -1', md: 'auto' } }}>
              <Box component={RouterLink} to="/" aria-label="Goldstar Shoes, home" sx={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', minHeight: 44, '&:focus-visible': { outline: `2px solid ${brand.goldText}`, outlineOffset: 6 } }}>
                <Logo tone="white" eager={false} sx={{ height: { xs: 30, md: 34 } }} />
              </Box>
              <Box>
                <Box component="p" sx={{ m: 0, fontSize: 15, fontWeight: 800, letterSpacing: '0.12em' }}>{CONTACT.company}</Box>
                <Box component="p" sx={{ m: 0, mt: 0.5, fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', color: brand.goldText }}>MADE WITH LOVE IN NEPAL</Box>
              </Box>
              <Box component="ul" aria-label="Contact" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <ContactLine icon={Phone} href={CONTACT.tel}>{CONTACT.phone}</ContactLine>
                <ContactLine icon={Mail} href={`mailto:${CONTACT.email}`}>{CONTACT.email}</ContactLine>
                <ContactLine icon={MapPin}>{CONTACT.address}</ContactLine>
              </Box>
              <Box>
                <Box component="h2" sx={headSx}>Follow us</Box>
                <Box component="ul" aria-label="Social media" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
                  {SOCIAL.map((s) => <li key={s.key}><SocialButton s={s} /></li>)}
                </Box>
              </Box>
            </Box>
            {COLUMNS.map((col) => (
              <Box component="nav" key={col.title} aria-label={col.title}>
                <Box component="h2" sx={headSx}>{col.title}</Box>
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {col.links.map((l) => <li key={l.label}><FooterLink link={l} /></li>)}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Box aria-hidden="true" sx={{ height: { xs: 120, sm: 150, md: 200 }, mt: { xs: 2, md: 0 } }}>
          <Skyline />
        </Box>
        <Box sx={{ backgroundColor: brand.night, color: brand.onNight2, px: 2.5, pt: 2.25, pb: 'calc(18px + var(--gs-bottom-ui, 0px))', textAlign: 'center',
          // Phones: the page ends with room for the floating WhatsApp button, so at the very bottom it sits over empty
          // ground, never over the credits or the last links.
          [`@media ${WA_AVOID_QUERY}`]: { pb: 'calc(88px + env(safe-area-inset-bottom) + var(--gs-bottom-ui, 0px))', pl: 'max(20px, env(safe-area-inset-left))', pr: 'max(20px, env(safe-area-inset-right))' } }}>
          <Box component="p" sx={{ m: 0, fontSize: { xs: 12, md: 13 }, fontWeight: 600, letterSpacing: '0.12em' }}>
            © 2025 GOLDSTAR SHOES | All Rights Reserved
          </Box>
          <Box component="p" id="credits" sx={{ m: 0, mt: 1, fontSize: 12, lineHeight: 1.6, color: brand.onNight2, opacity: 0.85, maxWidth: '90ch', mx: 'auto', scrollMarginTop: 160 }}>
            Concept store. The 3D G10-401 is modelled part by part from Goldstar product photography; product names, photos and prices from goldstarshoes.com. Fonts: Archivo and Mukta, SIL Open Font License. Brand icons: Simple Icons (CC0).
          </Box>
        </Box>
      </Box>
      <WhatsAppButton />
    </>
  );
}
