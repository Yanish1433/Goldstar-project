import { forwardRef, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { Minus, Plus, RotateCcw, ArrowDown, ArrowUp, MoveHorizontal, Droplets, Layers } from 'lucide-react';
import { INTRO, INTRO_BEATS, PALETTE, SECTIONS, introBeat, samplePose } from './storyline.js';
import { STORY_MODEL, LABEL_ORDER, CALLOUTS, BADGES, COLOURWAYS, colourwayOf } from './model.config.js';
import { live, touch, useStoryUi } from './state.js';
import { scrollToSection } from './useStoryEngine.js';
import { formatNPR } from '../lib/format.js';
import { makeLine, addToCartAnimated } from '../lib/addToCart.js';

const pal = (id) => PALETTE[SECTIONS.find((s) => s.id === id).colour];
const WIDE = { fontVariationSettings: '"wdth" 112', fontStretch: '112%' };
const LABEL_TEXT = { fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' };

// --- Type ------------------------------------------------------------------------------------------
export const Eyebrow = ({ children, ...p }) => (
  <Box component="p" data-copy sx={{ m: 0, fontSize: { xs: 12, md: 13 }, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.9 }} {...p}>
    {children}
  </Box>
);

export const Headline = ({ children, component = 'h2', sx, ...p }) => (
  <Box
    component={component}
    data-copy
    sx={{ m: 0, fontWeight: 800, ...WIDE, lineHeight: 0.94, letterSpacing: '-0.03em', fontSize: { xs: 'clamp(34px, 10vw, 46px)', md: 'clamp(52px, 5.4vw, 92px)' }, textWrap: 'balance', ...sx }}
    {...p}
  >
    {children}
  </Box>
);

export const Body = ({ children, sx, ...p }) => (
  <Box component="p" data-copy sx={{ m: 0, fontSize: { xs: 16, md: 19 }, lineHeight: 1.5, maxWidth: '34ch', fontWeight: 450, ...sx }} {...p}>
    {children}
  </Box>
);

const pill = (ink, bg, filled) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  minHeight: { xs: 48, md: 54 },
  px: { xs: 2.5, md: 3.5 },
  borderRadius: '999px',
  fontSize: { xs: 15, md: 16 },
  fontWeight: 700,
  letterSpacing: '0.01em',
  textDecoration: 'none',
  cursor: 'pointer',
  border: `2px solid ${ink}`,
  backgroundColor: filled ? ink : 'transparent',
  color: filled ? bg : ink,
  transition: 'transform 180ms ease, background-color 180ms ease, color 180ms ease',
  '&:hover': { transform: 'translateY(-2px)' },
  '&:focus-visible': { outline: `3px solid ${ink}`, outlineOffset: 3 },
  '&[aria-disabled="true"]': { opacity: 0.55, cursor: 'not-allowed', transform: 'none' },
});

export const PillLink = ({ to, children, ink, bg, filled = true, sx, ...p }) => (
  <Box component={RouterLink} to={to} sx={{ ...pill(ink, bg, filled), ...sx }} {...p}>{children}</Box>
);
export const PillButton = forwardRef(({ children, ink, bg, filled = true, sx, ...p }, ref) => (
  <Box component="button" type="button" ref={ref} sx={{ ...pill(ink, bg, filled), fontFamily: 'inherit', fontWeight: 700, ...sx }} {...p}>{children}</Box>
));
PillButton.displayName = 'PillButton';

// --- Panel -----------------------------------------------------------------------------------------
// One section = one screen (pinned by the engine). `side` is where the COPY sits on desktop (the boot takes the
// other side). Phones: the stage is the top ~45%, the copy sits below. `extra` renders outside the copy box.
const COPY_DESKTOP = {
  left: { left: '6vw', top: 0, bottom: 0, width: 'min(36vw, 560px)', justifyContent: 'center' },
  right: { right: '6vw', top: 0, bottom: 0, width: 'min(34vw, 540px)', justifyContent: 'center' },
  rightWide: { right: '5vw', top: 0, bottom: 0, width: 'min(40vw, 600px)', justifyContent: 'center' },
  leftNarrow: { left: '5vw', top: 0, bottom: 0, width: 'min(27vw, 420px)', justifyContent: 'center' },
  centre: { left: '6vw', right: '6vw', top: 0, bottom: 0, justifyContent: 'space-between' },
};

export function Panel({ id, side = 'left', children, extra, sx, phoneTop = '57%' }) {
  const p = pal(id);
  return (
    <Box
      component="section"
      id={`story-${id}`}
      aria-labelledby={`story-${id}-h`}
      sx={{ position: 'relative', height: 'var(--stage-h, 100svh)', minHeight: { xs: 560, md: 600 }, overflow: 'hidden', color: p.ink, '--ink': p.ink, '--bg': p.bg, '--accent': p.accent, zIndex: 1, ...sx }}
    >
      {extra}
      <Box
        data-copybox
        sx={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.5, md: 2.5 },
          boxSizing: 'border-box',
          left: { xs: 20 },
          right: { xs: 20 },
          top: { xs: phoneTop },
          bottom: { xs: 20 },
          // (one media block: a separate `pt: { md }` would share this key and be overwritten)
          '@media (min-width:900px)': { left: 'auto', right: 'auto', paddingTop: 'var(--appbar-h, 64px)', ...COPY_DESKTOP[side] },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// --- Shared bits -------------------------------------------------------------------------------------
const pickColour = (key) => {
  useStoryUi.getState().set({ colourKey: key, userColour: key });
  touch();
};
const productColour = (product, display) => product?.colourways?.find((c) => c.key === display.product) || null;

function useDisplayColour() {
  const key = useStoryUi((s) => s.colourKey);
  return colourwayOf(key);
}

function SwatchRow({ value, onPick, ink, label = 'Colour', compact }) {
  return (
    <Box role="radiogroup" aria-label={label} sx={{ display: 'flex', gap: { xs: 0.5, md: 1.5 }, flexWrap: 'wrap' }}>
      {COLOURWAYS.map((c) => {
        const on = c.key === value;
        return (
          <Box
            key={c.key}
            component="button"
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${c.name}${c.product ? '' : ', coming soon'}`}
            onClick={() => onPick(c.key)}
            sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, p: 0.5, minWidth: 44, border: 0, background: 'transparent', color: ink, fontFamily: 'inherit', cursor: 'pointer', '&:focus-visible': { outline: `3px solid ${ink}`, outlineOffset: 2 } }}
          >
            <Box component="span" sx={{ width: { xs: 40, md: 52 }, height: { xs: 40, md: 52 }, borderRadius: '12px', backgroundColor: c.hex, boxShadow: on ? `0 0 0 3px ${ink}` : 'inset 0 0 0 2px rgba(255,255,255,0.35)', transition: 'box-shadow 180ms ease' }} />
            {compact ? null : (
              <Box component="span" sx={{ fontSize: { xs: 10, md: 11 }, fontWeight: 800, letterSpacing: { xs: '0.04em', md: '0.08em' }, textTransform: 'uppercase', lineHeight: 1.15, maxWidth: { xs: 74, md: 84 }, textAlign: 'center', opacity: on ? 1 : 0.8 }}>
                {c.name}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// Add to cart from the story: the cart-box animation (fm/cart-box) starts from the boot's current stage box,
// so the box forms around the 3D boot and flies to the cart icon.
function stageRect() {
  const pose = samplePose(live.T, useStoryUi.getState().layout);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const s = Math.min(pose.w * W, pose.h * H) * pose.fill * 0.8;
  return { left: pose.cx * W - s / 2, top: pose.cy * H - s / 2, width: s, height: s, right: pose.cx * W + s / 2, bottom: pose.cy * H + s / 2, x: pose.cx * W - s / 2, y: pose.cy * H - s / 2 };
}
function addFromStory(product, display, size) {
  const real = productColour(product, display);
  if (!product || !real) return false;
  addToCartAnimated(makeLine(product, real, size, 1), { sourceRect: stageRect() });
  return true;
}

// --- Sections --------------------------------------------------------------------------------------
// Hero sparkles: a few small gold glints around the boot (CSS, no canvas). Reduced motion: still.
const SPARKS = [[0.52, 0.22, 7, 0], [0.6, 0.15, 4, 1.1], [0.86, 0.2, 6, 0.4], [0.93, 0.36, 4, 2.0], [0.49, 0.42, 3, 1.6], [0.9, 0.62, 5, 0.8], [0.56, 0.74, 4, 2.4], [0.78, 0.12, 3, 1.9], [0.97, 0.5, 3, 0.2], [0.68, 0.84, 5, 1.3]];
function Sparkles() {
  return (
    <Box
      data-copy
      aria-hidden="true"
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        '@keyframes gsTwinkle': { '0%, 100%': { opacity: 0.15, transform: 'scale(0.6) rotate(0deg)' }, '50%': { opacity: 1, transform: 'scale(1) rotate(45deg)' } },
        '& span': { position: 'absolute', animation: 'gsTwinkle 2.8s ease-in-out infinite', '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.7 } },
        '@media (max-width:899.95px)': { '& span': { display: 'none' }, '& span:nth-of-type(-n+5)': { display: 'block' } },
      }}
    >
      {SPARKS.map(([x, y, r, d], i) => (
        <span key={i} style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: r * 3.4, height: r * 3.4, animationDelay: `${d}s` }}>
          <svg viewBox="0 0 10 10" width="100%" height="100%"><path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="#FFE08A" /></svg>
        </span>
      ))}
    </Box>
  );
}

// LCP poster: a transparent render of the first frame, placed with the stage-box maths of storyline.js, so it sits
// under the live boot and crossfades into it when the canvas is ready (the crossfade starts only once the canvas
// has mounted its first frame, onReady in Stage.jsx).
//  - scrub mode: the whole boot at T=0 (key 0: box 'intro', fill 1.42, 3/4 front). The render is a square of k times
//    the fill square (fill * min(box w, box h)), centred on the box (k = 1.1 desktop, 1.25 phone), so the shadow fits:
//    desktop min(125vw, 96.8vh) at (50vw, 41vh); phone 113.6vw at (50vw, 33vh) (the phone box is width-bound).
//  - flow mode (reduced motion, no WebGL): the full hero pose (hero key: fill 0.9; the render is 1.3x / 1.15x that
//    square). Devices without WebGL keep it as the hero image.
function HeroPoster({ flow }) {
  const ready = useStoryUi((s) => s.canvasReady);
  const reduced = useStoryUi((s) => s.reduced);
  const size = flow
    ? { desktop: 'min(65.52vw, 86.58vh)', phone: 'min(97.29vw, 41.4vh)', phoneTop: '32vh' }
    : { desktop: 'min(125vw, 96.8vh)', phone: '113.6vw', phoneTop: '33vh' };
  const src = flow ? ['/img/hero/boot-desktop.webp', '/img/hero/boot-phone.webp'] : ['/img/hero/intro-desktop.webp', '/img/hero/intro-phone.webp'];
  return (
    <Box
      component="picture"
      data-hero-poster
      aria-hidden="true"
      sx={{
        '--s': size.desktop,
        position: 'absolute',
        left: flow ? 'calc(68vw - var(--s) / 2)' : 'calc(50vw - var(--s) / 2)',
        top: flow ? 'calc(55vh - var(--s) / 2)' : 'calc(41vh - var(--s) / 2)',
        width: 'var(--s)',
        height: 'var(--s)',
        pointerEvents: 'none',
        opacity: ready ? 0 : 1,
        transition: reduced ? 'none' : 'opacity 600ms ease',
        '@media (max-width:899.95px)': { '--s': size.phone, left: 'calc(50vw - var(--s) / 2)', top: `calc(${size.phoneTop} - var(--s) / 2)` },
        '& img': { display: 'block', width: '100%', height: '100%' },
      }}
    >
      <source media="(max-width: 899.95px)" srcSet={src[1]} width={720} height={720} />
      <img src={src[0]} alt="" width={1100} height={1100} fetchPriority="high" decoding="async" />
    </Box>
  );
}

// --- Hero intro ------------------------------------------------------------------------------------------
// The first screen shows the whole boot, centred and big, and turns it by scroll so tongue logo, metal hardware and
// outsole each face the camera in turn, then it glides to the hero pose (storyline.js INTRO). The captions (bottom band
// on desktop, under the boot on phones) and the scroll rail are driven by the same story time T
// as the 3D (applyIntro, called from the engine's onTime), so they scrub with it and play backward exactly.
// Caption text comes from the part data in model.config.js (STORY_MODEL.parts), nothing is invented here.
const introPart = (k) => STORY_MODEL.parts[k];
export const INTRO_CAPTIONS = [introPart('tongue'), introPart('eyelets'), introPart('outsole')].map((part, i) => ({ n: i + 1, label: part.label, text: part.detail }));

const intro = { caps: [], eyebrow: null, root: null, thumb: null, fill: null, btns: [], label: null };
export function applyIntro(T) {
  if (!intro.root) return;
  const b = introBeat(T);
  intro.caps.forEach((el, i) => {
    if (!el) return;
    const v = b.vis[i];
    const dir = b.index > i ? -1 : 1; // leaves upward, arrives from below
    el.style.opacity = String(v);
    el.style.transform = `translateY(${(dir * (1 - v) * 14).toFixed(2)}px)`;
  });
  if (intro.eyebrow) intro.eyebrow.style.opacity = String(0.9 * b.rail);
  const r = intro.root;
  r.style.opacity = String(b.rail);
  r.style.visibility = b.rail < 0.02 ? 'hidden' : 'visible'; // out of the tab order once it has left
  r.dataset.end = b.index === INTRO_BEATS - 1 ? 'true' : 'false';
  intro.thumb?.style.setProperty('--p', b.progress.toFixed(4));
  intro.btns.forEach((el, i) => el && (el.dataset.active = String(i === b.index)));
  intro.btns.forEach((el, i) => (i === b.index ? el?.setAttribute('aria-current', 'step') : el?.removeAttribute('aria-current')));
}

const RAIL_H = { xs: 150, md: 'clamp(190px, 34vh, 300px)' };

// The scroll rail: a vertical track with one real button per beat (>= 44px hit area, visible focus), a thumb that
// follows the intro's progress and a "Scroll" label that flips to "Scroll back" with the last beat.
function IntroRail({ ink }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    intro.root = root;
    intro.thumb = root.querySelector('[data-thumb]');
    intro.btns = [...root.querySelectorAll('button')];
    applyIntro(live.T);
    return () => {
      intro.root = null;
      intro.thumb = null;
      intro.btns = [];
    };
  }, []);
  return (
    <Box
      ref={ref}
      component="nav"
      aria-label="Close-up chapters"
      data-end="false"
      sx={{
        position: 'absolute', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pointerEvents: 'none',
        left: { xs: 4, md: 'calc(3vw - 2px)' }, top: { xs: '56%', md: '50%' }, transform: { xs: 'none', md: 'translateY(-50%)' },
        mt: { md: 'calc(var(--appbar-h, 64px) / 2)' }, width: 44,
        '& [data-label]': { ...LABEL_TEXT, fontSize: { xs: 9, md: 10 }, letterSpacing: { xs: '0.06em', md: '0.14em' }, textAlign: 'center', lineHeight: 1.2, width: 44, userSelect: 'none' },
        '& [data-label] svg': { animation: 'gsCue 1.8s ease-in-out infinite', '@media (prefers-reduced-motion: reduce)': { animation: 'none' } },
        '@keyframes gsCue': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(4px)' } },
        '& [data-when="end"]': { display: 'none' },
        '&[data-end="true"] [data-when="end"]': { display: 'inline-flex' },
        '&[data-end="true"] [data-when="start"]': { display: 'none' },
      }}
    >
      <Box aria-hidden="true" data-label sx={{ color: ink }}>
        <Box component="span" data-when="start" sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>Scroll<ArrowDown size={14} strokeWidth={2.5} /></Box>
        <Box component="span" data-when="end" sx={{ flexDirection: 'column', alignItems: 'center', gap: 0.5 }}><ArrowUp size={14} strokeWidth={2.5} />Scroll back</Box>
      </Box>
      <Box data-thumb sx={{ position: 'relative', width: 44, height: RAIL_H, '--p': 0 }}>
        <Box aria-hidden="true" sx={{ position: 'absolute', left: 'calc(50% - 1px)', top: 0, bottom: 0, width: 2, borderRadius: 1, backgroundColor: ink, opacity: 0.25 }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', left: 'calc(50% - 1px)', top: 0, width: 2, borderRadius: 1, backgroundColor: ink, height: 'calc(var(--p) * 100%)' }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', left: 'calc(50% - 6px)', top: 'calc(var(--p) * 100% - 6px)', width: 12, height: 12, borderRadius: '50%', backgroundColor: ink, boxShadow: `0 0 0 4px ${ink}33`, zIndex: 1 }} />
        {INTRO_CAPTIONS.map((c, i) => (
          <Box
            key={c.n}
            component="button"
            type="button"
            aria-label={`Go to: ${c.label}, ${c.text}`}
            onClick={() => scrollToSection('hero', INTRO.beatT[i])}
            sx={{
              position: 'absolute', left: 0, width: 44, height: 44, p: 0, border: 0, background: 'transparent', cursor: 'pointer', pointerEvents: 'auto', color: ink,
              top: `calc(${(INTRO.beatT[i] / INTRO.captionOut[0]) * 100}% - 22px)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              '&:focus-visible': { outline: `3px solid ${ink}`, outlineOffset: -3, borderRadius: '50%' },
              '& span': { width: 8, height: 8, borderRadius: '50%', border: `2px solid ${ink}`, boxSizing: 'border-box', transition: 'transform 180ms ease, background-color 180ms ease', '@media (prefers-reduced-motion: reduce)': { transition: 'none' } },
              '&[data-active="true"] span': { transform: 'scale(1.5)', backgroundColor: ink },
              '&:hover span': { transform: 'scale(1.5)' },
            }}
          >
            <span aria-hidden="true" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// The captions sit in one grid cell and cross-fade (opacity + <= 14px of travel). All three stay in the DOM in
// order for screen readers (no live region), only their opacity changes.
function IntroCaptions({ ink }) {
  const wrap = useRef(null);
  useEffect(() => {
    intro.caps = [...(wrap.current?.querySelectorAll('li') || [])];
    intro.eyebrow = wrap.current?.previousElementSibling || null;
    applyIntro(live.T);
    return () => {
      intro.caps = [];
      intro.eyebrow = null;
    };
  }, []);
  return (
    <Box
      data-intro
      sx={{
        position: 'absolute', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: { xs: 1.25, md: 2 }, boxSizing: 'border-box', color: ink, pointerEvents: 'none',
        left: 56, right: 20, top: '55%', bottom: 20,
        // Desktop: the boot is centred, so the captions sit in a band along the bottom-left, below its bounding box.
        // (one media block: a separate md key would share it and be overwritten)
        '@media (min-width:900px)': { left: 'calc(3vw + 60px)', right: 'auto', top: 'auto', bottom: 'max(20px, 3.2vh)', justifyContent: 'flex-end', width: 'min(46vw, 680px)' },
      }}
    >
      <Box aria-hidden="true" sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Goldstar Nepal · G10-401</Box>
      <Box ref={wrap} component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', '& > li': { gridArea: '1 / 1', willChange: 'opacity, transform' } }}>
        {INTRO_CAPTIONS.map((c, i) => (
          <li key={c.n} style={i === 0 ? undefined : { opacity: 0 }}>
            <Box sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: { xs: 0.75, md: 1.25 } }}>{String(c.n).padStart(2, '0')} · {c.label}</Box>
            <Box sx={{ fontWeight: 800, ...WIDE, lineHeight: 1, letterSpacing: '-0.02em', fontSize: { xs: 'clamp(26px, 7.4vw, 34px)', md: 'clamp(24px, 2.2vw, 40px)' }, textWrap: 'balance' }}>{c.text}</Box>
          </li>
        ))}
      </Box>
    </Box>
  );
}

// Reduced motion / no-scrub: the same captions, stacked and static under the buttons.
function IntroList() {
  return (
    <Box component="ul" data-copy sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: { xs: 13, md: 15 }, fontWeight: 600, lineHeight: 1.3, opacity: 0.95 }}>
      {INTRO_CAPTIONS.map((c) => (
        <li key={c.n}><Box component="span" sx={{ ...LABEL_TEXT, fontSize: 11, mr: 1 }}>{c.label}</Box>{c.text}</li>
      ))}
    </Box>
  );
}

export function HeroSection({ product, flow }) {
  const p = pal('hero');
  const from = product?.colourways?.length ? Math.min(...product.colourways.map((c) => c.price)) : null;
  return (
    <Panel id="hero" side="left" phoneTop={flow ? 'calc(var(--stage-h, 100svh) * 0.55)' : '55%'} sx={flow ? { '@media (max-width:899.95px)': { height: 'auto', minHeight: 'calc(var(--stage-h, 100svh) + 110px)' } } : undefined} extra={<><HeroPoster flow={flow} /><Sparkles />{flow ? null : <><IntroCaptions ink={p.ink} /><IntroRail ink={p.ink} /></>}</>}>
      <Eyebrow>Goldstar Nepal · G10-401</Eyebrow>
      <Headline component="h1" id="story-hero-h" sx={{ fontSize: { xs: 'clamp(40px, 12vw, 54px)', md: 'clamp(64px, 7vw, 120px)' } }}>
        Explore further.
        <Box component="span" sx={{ display: 'block', color: '#FFFFFF' }}>Goldstar Trek.</Box>
      </Headline>
      <Body>A mid-cut trek boot, made in Nepal for the trail ahead.{from ? ` From ${formatNPR(from)}.` : ''}</Body>
      <Box data-copy sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: { xs: 0.5, md: 1 } }}>
        <PillLink to="/product/g10-401" ink={p.ink} bg={p.bg}>Shop the G10-401</PillLink>
        <PillButton ink={p.ink} bg={p.bg} filled={false} onClick={() => scrollToSection('anatomy', 70)}>See inside</PillButton>
      </Box>
      {flow ? <IntroList /> : null}
    </Panel>
  );
}

export const PerformanceSection = forwardRef(function PerformanceSection(_, degRef) {
  return (
    <Panel id="performance" side="rightWide">
      <Eyebrow>01 · Performance</Eyebrow>
      <Headline id="story-performance-h" sx={{ fontSize: { xs: 'clamp(28px, 8.4vw, 40px)', md: 'clamp(48px, 4.1vw, 76px)' }, textTransform: 'uppercase', lineHeight: 0.92 }}>
        Performance, redefined.
      </Headline>
      <Body>A lugged rubber outsole and a cushioned midsole, shaped for long days on rough ground.</Body>
      <Box data-copy aria-hidden="true" sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
        <Box ref={degRef} component="span" sx={{ fontSize: { xs: 34, md: 56 }, fontWeight: 800, ...WIDE, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>0°</Box>
        <Box component="span" sx={LABEL_TEXT}>of 360°</Box>
      </Box>
    </Panel>
  );
});

function Legend({ items, accent }) {
  return (
    <Box component="ol" data-copy sx={{ display: { xs: 'grid', md: 'none' }, gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 0.75, m: 0, p: 0, listStyle: 'none', fontSize: 15 }}>
      {items.map((it, i) => (
        <Box component="li" key={it.key} sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
          <Box component="span" sx={{ fontWeight: 800, color: accent, minWidth: '1.2em' }}>{i + 1}</Box>
          <span>{it.title}</span>
        </Box>
      ))}
    </Box>
  );
}

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' };

export function CalloutsSection() {
  const p = pal('callouts');
  return (
    <Panel id="callouts" side="leftNarrow" phoneTop="62%">
      <Eyebrow>02 · Details</Eyebrow>
      <Headline id="story-callouts-h" sx={{ fontSize: { md: 'clamp(48px, 4.6vw, 78px)' } }}>Made for the trail.</Headline>
      <Body sx={{ display: { xs: 'none', md: 'block' } }}>Every part of the G10-401 has a job to do on the mountain.</Body>
      <Legend items={CALLOUTS} accent={p.accent} />
      <Box component="ul" sx={srOnly}>{CALLOUTS.map((c) => <li key={c.key}>{c.title}: {c.sub}</li>)}</Box>
    </Panel>
  );
}

export function AnatomySection() {
  const p = pal('anatomy');
  const parts = STORY_MODEL.parts;
  return (
    <Panel id="anatomy" side="leftNarrow" phoneTop="64%">
      <Eyebrow>03 · Layers</Eyebrow>
      <Headline id="story-anatomy-h" sx={{ fontSize: { md: 'clamp(46px, 4.4vw, 74px)' }, textTransform: 'uppercase', lineHeight: 0.9 }}>Designed to endure.</Headline>
      <Body sx={{ display: { xs: 'none', md: 'block' } }}>Eight layers, from the rubber outsole to the padded collar, built to take a beating and keep going.</Body>
      <Legend items={BADGES} accent={p.accent} />
      <Box component="ul" sx={srOnly}>
        {LABEL_ORDER.map((k) => <li key={k}>{parts[k].label}: {parts[k].detail}</li>)}
        {BADGES.map((b) => <li key={b.key}>{b.title}</li>)}
      </Box>
    </Panel>
  );
}

export function SoleSection() {
  return (
    <Panel id="sole" side="right">
      <Eyebrow>04 · Grip</Eyebrow>
      <Box data-slide sx={{ alignSelf: { xs: 'center', md: 'flex-start' }, mb: { xs: 0, md: 1 } }}>
        <Box
          component="img"
          src="/img/g10-sole.webp"
          alt="The real G10-401 outsole: diamond lugs and a grooved heel"
          width={620}
          height={262}
          loading="lazy"
          sx={{ display: 'block', width: { xs: 'min(62vw, 250px)', md: 'min(30vw, 440px)' }, height: 'auto', filter: 'drop-shadow(0 18px 30px rgba(60,40,0,0.35))', transform: 'rotate(-4deg)' }}
        />
      </Box>
      <Headline id="story-sole-h">Traction grip.</Headline>
      <Body>Engineered for Nepal’s terrain: diamond rubber lugs bite into mud, scree and wet stone.</Body>
    </Panel>
  );
}

function Rail({ product, display, ink }) {
  const real = productColour(product, display);
  const imgs = (real?.images || []).slice(0, 4);
  // Colours not in the catalogue yet are shown in 3D only (no photo rail).
  if (!imgs.length) return null;
  return (
    <Box
      data-copy
      role="group"
      aria-label={`Photos of the G10-401 in ${real.name}`}
      sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1, position: { md: 'absolute' }, left: { md: '-112px' }, top: { md: '50%' }, mt: { md: '-170px' } }}
    >
      {imgs.map((im) => (
        <Box key={im.thumb} component="img" src={im.thumb} alt="" loading="lazy" width={76} height={76} sx={{ width: { xs: 48, md: 76 }, height: { xs: 48, md: 76 }, objectFit: 'cover', borderRadius: '10px', backgroundColor: '#EDE7DC', boxShadow: `0 0 0 2px ${ink}33` }} />
      ))}
    </Box>
  );
}

export function ColourSection({ product }) {
  const p = pal('colour');
  const display = useDisplayColour();
  const real = productColour(product, display);
  return (
    <Panel id="colour" side="left" sx={{ '@media (min-width:900px)': { '& [data-copybox]': { left: 'calc(6vw + 120px)' } } }}>
      <Eyebrow>05 · Colour customisation</Eyebrow>
      <Headline id="story-colour-h">Pick your colour.</Headline>
      <Box data-copy aria-live="polite" sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ fontSize: { xs: 24, md: 38 }, fontWeight: 800, ...WIDE, letterSpacing: '-0.02em' }}>{display.name}</Box>
        <Box sx={{ fontSize: { xs: 16, md: 19 }, fontWeight: 700 }}>{real ? formatNPR(real.price) : 'Coming soon'}</Box>
      </Box>
      <Box data-copy><SwatchRow value={display.key} onPick={pickColour} ink={p.ink} /></Box>
      <Rail product={product} display={display} ink={p.ink} />
    </Panel>
  );
}

// Studio: the user takes over. Drag to turn (touch: horizontal drags turn, vertical drags still scroll),
// buttons (and trackpad pinch) to zoom.
function DragSurface() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let last = null;
    const D = live.drag;
    const down = (e) => {
      last = { x: e.clientX, y: e.clientY, id: e.pointerId };
      D.active = true;
      el.setPointerCapture?.(e.pointerId);
      el.style.cursor = 'grabbing';
      touch();
    };
    const move = (e) => {
      if (!last || e.pointerId !== last.id) return;
      D.yaw += (e.clientX - last.x) * 0.012;
      D.pitch = Math.max(-0.35, Math.min(0.6, D.pitch + (e.clientY - last.y) * 0.006));
      last = { x: e.clientX, y: e.clientY, id: e.pointerId };
      touch();
    };
    const up = () => {
      last = null;
      D.active = false;
      el.style.cursor = 'grab';
      touch();
    };
    const wheel = (e) => {
      if (!e.ctrlKey) return; // plain wheel scrolls the page; pinch (ctrl+wheel) zooms
      e.preventDefault();
      D.zoom = Math.max(0.7, Math.min(1.7, D.zoom * (1 - e.deltaY * 0.01)));
      touch();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, []);
  return <Box ref={ref} aria-hidden="true" sx={{ position: 'absolute', left: { xs: 0, md: '18%' }, right: { xs: 0, md: '18%' }, top: { xs: '10%', md: '16%' }, height: { xs: '42%', md: '62%' }, cursor: 'grab', touchAction: 'pan-y', zIndex: 0 }} />;
}

const zoomBy = (k) => {
  live.drag.zoom = Math.max(0.7, Math.min(1.7, live.drag.zoom * k));
  touch();
};
const resetView = () => {
  Object.assign(live.drag, { yaw: 0, pitch: 0, zoom: 1 });
  touch();
};

export function StudioSection({ product }) {
  const p = pal('studio');
  const display = useDisplayColour();
  const real = productColour(product, display);
  const [size, setSize] = useState(null);
  const [err, setErr] = useState(false);
  const addRef = useRef(null);
  useEffect(() => setSize((s) => (real?.sizes?.includes(s) ? s : null)), [real]);
  const add = () => {
    if (!real) return;
    if (!size) {
      setErr(true);
      return;
    }
    addFromStory(product, display, size);
  };
  const iconBtn = { width: 44, height: 44, borderRadius: '50%', border: `2px solid ${p.ink}`, background: 'transparent', color: p.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:focus-visible': { outline: `3px solid ${p.ink}`, outlineOffset: 2 } };
  return (
    <Panel id="studio" side="centre" phoneTop="50%" extra={<DragSurface />} sx={{ '& [data-copybox]': { pointerEvents: 'none' }, '& [data-ui]': { position: 'relative', zIndex: 1, pointerEvents: 'auto' } }}>
      <Box data-ui sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, pt: { md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, md: 1.5 } }}>
          <Eyebrow>06 · {display.name}</Eyebrow>
          <Headline id="story-studio-h" sx={{ fontSize: { xs: 'clamp(30px, 8.5vw, 38px)', md: 'clamp(44px, 4vw, 68px)' }, textTransform: 'uppercase' }}>Add to cart.</Headline>
        </Box>
        <Box data-copy sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, ...LABEL_TEXT, mt: 4 }}>
          <MoveHorizontal size={18} strokeWidth={2.25} aria-hidden="true" /> Drag the boot to turn it
        </Box>
      </Box>
      <Box data-ui data-copy sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'flex-end' }, justifyContent: 'space-between', gap: { xs: 1.25, md: 3 }, pb: { md: 5 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1.5 } }}>
          <SwatchRow value={display.key} onPick={pickColour} ink={p.ink} compact />
          {real?.sizes?.length ? (
            <Box role="radiogroup" aria-label="UK size" aria-describedby={err ? 'studio-size-err' : undefined} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box component="span" sx={{ ...LABEL_TEXT, mr: 0.5 }}>UK</Box>
              {real.sizes.map((s) => (
                <Box
                  key={s}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  aria-label={`UK size ${s}`}
                  onClick={() => { setSize(s); setErr(false); }}
                  sx={{ minWidth: 44, height: 44, borderRadius: '999px', border: `2px solid ${p.ink}`, background: size === s ? p.ink : 'transparent', color: size === s ? p.bg : p.ink, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', '&:focus-visible': { outline: `3px solid ${p.ink}`, outlineOffset: 2 } }}
                >
                  {s}
                </Box>
              ))}
              {err ? <Box id="studio-size-err" role="alert" component="span" sx={{ fontWeight: 700, color: p.accent, ml: 1 }}>Choose a size</Box> : null}
            </Box>
          ) : (
            <Box sx={{ fontSize: 15, opacity: 0.9, maxWidth: '40ch' }}>{display.name} is coming soon. Kathmandu Black and Himalayan Earth are in stock.</Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box component="button" type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.18)} sx={iconBtn}><Minus size={18} aria-hidden="true" /></Box>
          <Box component="button" type="button" aria-label="Zoom in" onClick={() => zoomBy(1.18)} sx={iconBtn}><Plus size={18} aria-hidden="true" /></Box>
          <Box component="button" type="button" aria-label="Reset view" onClick={resetView} sx={iconBtn}><RotateCcw size={18} aria-hidden="true" /></Box>
          <PillButton ref={addRef} ink={p.ink} bg={p.bg} onClick={add} aria-disabled={!real} sx={{ ml: { md: 1 } }}>
            {real ? `Add to cart · ${formatNPR(real.price)}` : 'Coming soon'}
          </PillButton>
        </Box>
      </Box>
    </Panel>
  );
}

// Label cards for the callouts (assembled boot) and the badges (exploded stack): aria-hidden overlay,
// positioned by the canvas each frame (Stage.jsx positionLabels). Text alternatives live in the sections.
const ICONS = { droplets: Droplets, layers: Layers };
export function StageLabels() {
  const refs = useRef({});
  useEffect(() => {
    const out = {};
    [['callouts', CALLOUTS], ['badges', BADGES]].forEach(([set, list]) => {
      out[set] = {};
      list.forEach((it) => {
        const r = refs.current[`${set}:${it.key}`];
        if (r?.root) out[set][it.key] = { ...r, shown: false };
      });
    });
    live.labels = out;
    return () => {
      live.labels = null;
    };
  }, []);
  const set = (k, part) => (el) => {
    refs.current[k] = { ...(refs.current[k] || {}), [part]: el };
  };
  const render = (setKey, list, sectionId) => {
    const p = pal(sectionId);
    return list.map((it, i) => {
      const k = `${setKey}:${it.key}`;
      const Icon = it.icon ? ICONS[it.icon] : null;
      return (
        <Box key={k} ref={set(k, 'root')} sx={{ position: 'absolute', inset: 0, opacity: 0, visibility: 'hidden', color: p.ink }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <path ref={set(k, 'line')} d="M0 0" fill="none" stroke={p.accent} strokeWidth="1.5" />
          </svg>
          <Box ref={set(k, 'dot')} sx={{ position: 'absolute', left: { xs: -11, md: -6 }, top: { xs: -11, md: -6 }, width: { xs: 22, md: 12 }, height: { xs: 22, md: 12 }, borderRadius: '50%', backgroundColor: p.accent, color: p.bg, boxShadow: `0 0 0 4px ${p.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>{i + 1}</Box>
          </Box>
          <Box ref={set(k, 'card')} sx={{ position: 'absolute', left: 0, top: 0, width: 'min(19vw, 290px)' }}>
            {Icon ? (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, px: 1.75, py: 1.25, border: `2px solid ${p.ink}`, borderRadius: '14px', backgroundColor: `${p.bg}CC` }}>
                <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
                <Box component="span" sx={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.15 }}>{it.title}</Box>
              </Box>
            ) : (
              <>
                <Box sx={{ fontSize: 18, fontWeight: 800, ...WIDE, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{it.title}</Box>
                <Box sx={{ fontSize: 14, lineHeight: 1.35, mt: 0.25, color: p.soft }}>{it.sub}</Box>
              </>
            )}
          </Box>
        </Box>
      );
    });
  };
  return (
    <Box aria-hidden="true" sx={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
      {render('callouts', CALLOUTS, 'callouts')}
      {render('badges', BADGES, 'anatomy')}
    </Box>
  );
}

// --- Brand finale ------------------------------------------------------------------------------------
const WORD = 'GOLDSTAR';
export function FinaleSection() {
  const p = pal('finale');
  return (
    <Box
      component="section"
      id="story-finale"
      aria-labelledby="story-finale-h"
      sx={{ position: 'relative', height: 'var(--stage-h, 100svh)', minHeight: 520, overflow: 'hidden', color: p.ink, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: { xs: 2, md: 4 }, boxSizing: 'border-box' }}
    >
      <Box data-glow aria-hidden="true" sx={{ position: 'absolute', left: '50%', top: '50%', width: '120vmax', height: '120vmax', transform: 'translate(-50%, -50%)', background: 'radial-gradient(closest-side, rgba(255,201,60,0.22), rgba(255,201,60,0.06) 45%, transparent 70%)', pointerEvents: 'none' }} />
      <Box data-line component="p" sx={{ m: 0, mb: { xs: 3, md: 4 }, fontWeight: 800, ...WIDE, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 0.95, textAlign: 'center', fontSize: { xs: 'clamp(26px, 8vw, 34px)', md: 'clamp(34px, 3.4vw, 54px)' }, color: p.accent, position: 'relative' }}>
        Your adventure begins now.
      </Box>
      <Box data-star aria-hidden="true" sx={{ width: { xs: 56, md: 96 }, height: { xs: 56, md: 96 }, mb: { xs: 1.5, md: 2.5 }, position: 'relative' }}>
        <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <path data-star-path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill={p.accent} stroke={p.accent} strokeWidth="0.8" strokeLinejoin="round" />
        </svg>
      </Box>
      <Box
        component="h2"
        id="story-finale-h"
        aria-label="Goldstar"
        data-word
        sx={{ m: 0, fontWeight: 900, ...WIDE, lineHeight: 0.86, whiteSpace: 'nowrap', maxWidth: '100%', fontSize: 'min(calc((100vw - 32px) / 6.9), 240px)', '@media (min-width:600px)': { fontSize: 'min(calc((100vw - 120px) / 6.9), 240px)' }, color: p.ink, position: 'relative' }}
      >
        {WORD.split('').map((ch, i) => (
          <Box key={i} component="span" aria-hidden="true" sx={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', pb: '0.04em' }}>
            <Box component="span" data-letter sx={{ display: 'inline-block', transformOrigin: '0% 100%' }}>{ch}</Box>
          </Box>
        ))}
      </Box>
      <Box data-sub lang="ne" sx={{ fontFamily: 'Mukta', fontWeight: 600, fontSize: { xs: 30, md: 'clamp(36px, 4vw, 64px)' }, lineHeight: 1.1, mt: { xs: 1, md: 1.5 }, color: p.accent, position: 'relative' }}>
        गोल्डस्टार
      </Box>
      <Box data-sub sx={{ mt: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
        <PillLink to="/shop" ink={p.ink} bg={p.bg}>Shop all</PillLink>
      </Box>
    </Box>
  );
}
