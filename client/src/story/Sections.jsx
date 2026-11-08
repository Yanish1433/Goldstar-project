import { forwardRef, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import { Minus, Plus, RotateCcw, ArrowDown, MoveHorizontal } from 'lucide-react';
import { PALETTE, SECTIONS } from './storyline.js';
import { STORY_MODEL, LABEL_ORDER } from './model.config.js';
import { live, touch, useStoryUi } from './state.js';
import { scrollToSection } from './useStoryEngine.js';
import { formatNPR } from '../lib/format.js';
import { makeLine, addToCartNow } from '../lib/addToCart.js';

const pal = (id) => PALETTE[SECTIONS.find((s) => s.id === id).colour];
const WIDE = { fontVariationSettings: '"wdth" 112', fontStretch: '112%' };

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

// Pill buttons in the section's ink.
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
  '&[aria-disabled="true"]': { opacity: 0.6 },
});

export const PillLink = ({ to, children, ink, bg, filled = true, sx, ...p }) => (
  <Box component={RouterLink} to={to} sx={{ ...pill(ink, bg, filled), ...sx }} {...p}>{children}</Box>
);
export const PillButton = forwardRef(({ children, ink, bg, filled = true, sx, ...p }, ref) => (
  <Box component="button" type="button" ref={ref} sx={{ ...pill(ink, bg, filled), fontFamily: 'inherit', fontWeight: 700, ...sx }} {...p}>{children}</Box>
));
PillButton.displayName = 'PillButton';

// --- Panel -----------------------------------------------------------------------------------------
// One section = one screen (pinned by the engine). `side` is where the COPY sits on desktop (the shoe takes the
// other side). Phones: the stage is the top ~45%, the copy sits in the lower part.
const COPY_DESKTOP = {
  left: { left: '6vw', top: 0, bottom: 0, width: 'min(36vw, 560px)', justifyContent: 'center' },
  right: { right: '6vw', top: 0, bottom: 0, width: 'min(34vw, 540px)', justifyContent: 'center' },
  leftNarrow: { left: '5vw', top: 0, bottom: 0, width: 'min(27vw, 420px)', justifyContent: 'center' },
  centre: { left: '6vw', right: '6vw', top: 0, bottom: 0, justifyContent: 'space-between' },
};

export function Panel({ id, side = 'left', children, sx, phoneTop = '57%' }) {
  const p = pal(id);
  return (
    <Box
      component="section"
      id={`story-${id}`}
      aria-labelledby={`story-${id}-h`}
      sx={{ position: 'relative', height: 'var(--stage-h, 100svh)', minHeight: { xs: 560, md: 600 }, overflow: 'hidden', color: p.ink, '--ink': p.ink, '--bg': p.bg, '--accent': p.accent, zIndex: 1, ...sx }}
    >
      <Box
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

// --- Sections --------------------------------------------------------------------------------------
export function HeroSection({ product }) {
  const p = pal('hero');
  const from = product?.colourways?.length ? Math.min(...product.colourways.map((c) => c.price)) : null;
  return (
    <Panel id="hero" side="left" phoneTop="55%">
      <Eyebrow>Goldstar · G10-401 · Trek</Eyebrow>
      <Headline component="h1" id="story-hero-h" sx={{ fontSize: { xs: 'clamp(40px, 12vw, 54px)', md: 'clamp(64px, 7vw, 120px)' } }}>
        Built for every trail.
      </Headline>
      <Body>A trek shoe made in Nepal. Light on its feet, hard to wear out.{from ? ` From ${formatNPR(from)}.` : ''}</Body>
      <Box data-copy sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: { xs: 0.5, md: 1 } }}>
        <PillLink to="/product/g10-401" ink={p.ink} bg={p.bg}>Shop the G10-401</PillLink>
        <PillButton ink={p.ink} bg={p.bg} filled={false} onClick={() => scrollToSection('anatomy', 60)}>
          See inside
        </PillButton>
      </Box>
      <Box data-copy aria-hidden="true" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, position: 'absolute', bottom: 36, left: 0, fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        <ArrowDown size={16} strokeWidth={2.25} /> Scroll
      </Box>
    </Panel>
  );
}

export const RevealSection = forwardRef(function RevealSection(_, degRef) {
  return (
    <Panel id="reveal" side="right">
      <Eyebrow>01 · Form</Eyebrow>
      <Headline id="story-reveal-h">Every angle, considered.</Headline>
      <Body>Low, stable and trail-ready. A full turn shows a shape built around the foot, not the catalogue.</Body>
      <Box data-copy aria-hidden="true" sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: { xs: 0, md: 2 } }}>
        <Box ref={degRef} component="span" sx={{ fontSize: { xs: 40, md: 72 }, fontWeight: 800, ...WIDE, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>0°</Box>
        <Box component="span" sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>of 360°</Box>
      </Box>
    </Panel>
  );
});

export function AnatomySection() {
  const parts = STORY_MODEL.parts;
  return (
    <Panel id="anatomy" side="leftNarrow" phoneTop="64%">
      <Eyebrow>02 · Anatomy</Eyebrow>
      <Headline id="story-anatomy-h" sx={{ fontSize: { md: 'clamp(48px, 4.6vw, 78px)' } }}>Six parts. One shoe.</Headline>
      <Body sx={{ display: { xs: 'none', md: 'block' } }}>Watch the G10-401 come apart layer by layer, then lock back together.</Body>
      {/* Phones: numbered legend (the dots on the stage carry the numbers). Desktop: labels sit by the shoe. */}
      <Box component="ol" data-copy sx={{ display: { xs: 'grid', md: 'none' }, gridTemplateColumns: '1fr 1fr', columnGap: 2, rowGap: 0.75, m: 0, p: 0, listStyle: 'none', fontSize: 15 }}>
        {LABEL_ORDER.map((k, i) => (
          <Box component="li" key={k} sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
            <Box component="span" sx={{ fontWeight: 800, color: 'var(--accent)', minWidth: '1.2em' }}>{i + 1}</Box>
            <span>{parts[k].label}</span>
          </Box>
        ))}
      </Box>
      {/* Screen readers: the part list as text (the labels on the stage are aria-hidden). */}
      <Box component="ul" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {LABEL_ORDER.map((k) => <li key={k}>{parts[k].label}: {parts[k].detail}</li>)}
      </Box>
    </Panel>
  );
}

export function SoleSection() {
  return (
    <Panel id="sole" side="right">
      <Eyebrow>03 · Grip</Eyebrow>
      <Headline id="story-sole-h">Grip that holds.</Headline>
      <Body>A rubber outsole for durability and slip resistance, over an EVA midsole for bounce on every step.</Body>
      <Box data-copy sx={{ display: 'flex', gap: { xs: 3, md: 5 }, mt: { xs: 0, md: 2 } }}>
        {[['Rubber', 'outsole'], ['EVA', 'midsole'], ['Arch', 'support']].map(([a, b]) => (
          <Box key={a}>
            <Box sx={{ fontSize: { xs: 26, md: 40 }, fontWeight: 800, ...WIDE, letterSpacing: '-0.02em', lineHeight: 1 }}>{a}</Box>
            <Box sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mt: 0.75 }}>{b}</Box>
          </Box>
        ))}
      </Box>
    </Panel>
  );
}

function SwatchRow({ colourways, value, onPick, ink, label = 'Colour' }) {
  return (
    <Box role="radiogroup" aria-label={label} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      {colourways.map((c) => {
        const on = c.key === value;
        return (
          <Box
            key={c.key}
            component="button"
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${c.name}, ${formatNPR(c.price)}`}
            onClick={() => onPick(c.key)}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, p: '5px 14px 5px 5px', minHeight: 44, borderRadius: '999px', border: `2px solid ${on ? ink : 'transparent'}`, background: on ? 'rgba(255,255,255,0.12)' : 'transparent', color: ink, fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', '&:focus-visible': { outline: `3px solid ${ink}`, outlineOffset: 2 } }}
          >
            <Box component="span" sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: c.hex, boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.35)` }} />
            {c.name}
          </Box>
        );
      })}
    </Box>
  );
}

const pickColour = (key) => {
  useStoryUi.getState().set({ colourKey: key, userColour: key });
  touch();
};

export function ColourSection({ product }) {
  const p = pal('colour');
  const colourways = product?.colourways || [];
  const key = useStoryUi((s) => s.colourKey) || colourways[0]?.key;
  const cw = colourways.find((c) => c.key === key) || colourways[0];
  return (
    <Panel id="colour" side="left">
      <Eyebrow>04 · Colour</Eyebrow>
      <Headline id="story-colour-h">Pick your colour.</Headline>
      <Box data-copy aria-live="polite" sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ fontSize: { xs: 28, md: 44 }, fontWeight: 800, ...WIDE, letterSpacing: '-0.02em' }}>
          {cw?.name || '—'}
          {cw?.nameNe ? <Box component="span" lang="ne" sx={{ fontFamily: 'Mukta', fontWeight: 600, ml: 1.5, fontSize: '0.7em' }}>{cw.nameNe}</Box> : null}
        </Box>
        {cw ? <Box sx={{ fontSize: { xs: 17, md: 20 }, fontWeight: 700 }}>{formatNPR(cw.price)}</Box> : null}
      </Box>
      {colourways.length ? (
        <Box data-copy>
          <SwatchRow colourways={colourways} value={cw?.key} onPick={pickColour} ink={p.ink} />
        </Box>
      ) : null}
      <Body sx={{ display: { xs: 'none', md: 'block' }, fontSize: 16 }}>Keep scrolling to see every colourway, or pick one. The 3D shoe changes live.</Body>
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
  return (
    <Box
      ref={ref}
      aria-hidden="true"
      sx={{ position: 'absolute', left: { xs: 0, md: '18%' }, right: { xs: 0, md: '18%' }, top: { xs: '10%', md: '16%' }, height: { xs: '46%', md: '62%' }, cursor: 'grab', touchAction: 'pan-y', zIndex: 0 }}
    />
  );
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
  const colourways = product?.colourways || [];
  const key = useStoryUi((s) => s.colourKey) || colourways[0]?.key;
  const cw = colourways.find((c) => c.key === key) || colourways[0];
  const [size, setSize] = useState(null);
  const [err, setErr] = useState(false);
  const addRef = useRef(null);
  const add = () => {
    if (!product || !cw) return;
    if (!size) {
      setErr(true);
      return;
    }
    const line = makeLine(product, cw, size, 1);
    // TODO(fm/cart-box): when the cart-box branch lands, play its animation first:
    //   playAddToCart({ colour: cw.hex, sourceRect: addRef.current.getBoundingClientRect() })
    // then add the line on landing. Until then: add at once (snackbar + announcement).
    addToCartNow(line);
  };
  const iconBtn = { width: 44, height: 44, borderRadius: '50%', border: `2px solid ${p.ink}`, background: 'transparent', color: p.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:focus-visible': { outline: `3px solid ${p.ink}`, outlineOffset: 2 } };
  return (
    <Panel id="studio" side="centre" phoneTop="55%" sx={{ '& [data-ui]': { position: 'relative', zIndex: 1 } }}>
      <DragSurface />
      <Box data-ui sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, pt: { md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, md: 1.5 } }}>
          <Eyebrow>05 · Studio</Eyebrow>
          <Headline id="story-studio-h" sx={{ fontSize: { xs: 'clamp(30px, 8.5vw, 38px)', md: 'clamp(44px, 4vw, 68px)' } }}>Make it yours.</Headline>
        </Box>
        <Box data-copy sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mt: 4 }}>
          <MoveHorizontal size={18} strokeWidth={2.25} aria-hidden="true" /> Drag the shoe to turn it
        </Box>
      </Box>
      <Box data-ui data-copy sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'flex-end' }, justifyContent: 'space-between', gap: { xs: 1.5, md: 3 }, pb: { md: 5 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1.5 } }}>
          {colourways.length ? <SwatchRow colourways={colourways} value={cw?.key} onPick={pickColour} ink={p.ink} /> : null}
          {cw?.sizes?.length ? (
            <Box role="radiogroup" aria-label="UK size" aria-describedby={err ? 'studio-size-err' : undefined} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box component="span" sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mr: 0.5 }}>UK</Box>
              {cw.sizes.map((s) => (
                <Box
                  key={s}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  aria-label={`UK size ${s}`}
                  onClick={() => { setSize(s); setErr(false); }}
                  sx={{ minWidth: 44, height: 44, borderRadius: '999px', border: `2px solid ${p.ink}`, background: size === s ? p.ink : 'transparent', color: size === s ? p.bg : p.ink, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', '&:focus-visible': { outline: `3px solid ${p.ink}`, outlineOffset: 2 } }}
                >
                  {s}
                </Box>
              ))}
              {err ? <Box id="studio-size-err" role="alert" component="span" sx={{ fontWeight: 700, color: p.accent, ml: 1 }}>Choose a size</Box> : null}
            </Box>
          ) : null}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box component="button" type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.18)} sx={iconBtn}><Minus size={18} aria-hidden="true" /></Box>
          <Box component="button" type="button" aria-label="Zoom in" onClick={() => zoomBy(1.18)} sx={iconBtn}><Plus size={18} aria-hidden="true" /></Box>
          <Box component="button" type="button" aria-label="Reset view" onClick={resetView} sx={iconBtn}><RotateCcw size={18} aria-hidden="true" /></Box>
          <PillButton ref={addRef} ink={p.ink} bg={p.bg} onClick={add} sx={{ ml: { md: 1 } }}>
            Add to cart{cw ? ` · ${formatNPR(cw.price)}` : ''}
          </PillButton>
          <PillLink to={`/product/g10-401${cw ? `?colour=${cw.key}` : ''}`} ink={p.ink} bg={p.bg} filled={false} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Details</PillLink>
        </Box>
      </Box>
    </Panel>
  );
}

// Anatomy labels: aria-hidden overlay positioned by the canvas each frame (see Stage.jsx positionLabels).
export function AnatomyLabels() {
  const p = pal('anatomy');
  const refs = useRef({});
  useEffect(() => {
    const items = {};
    LABEL_ORDER.forEach((k) => {
      const r = refs.current[k];
      if (r?.root) items[k] = { ...r, shown: false };
    });
    live.labels = { items };
    return () => {
      live.labels = null;
    };
  }, []);
  const set = (k, part) => (el) => {
    refs.current[k] = { ...(refs.current[k] || {}), [part]: el };
  };
  return (
    <Box aria-hidden="true" sx={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', color: p.ink }}>
      {LABEL_ORDER.map((k, i) => {
        const part = STORY_MODEL.parts[k];
        return (
          <Box key={k} ref={set(k, 'root')} sx={{ position: 'absolute', inset: 0, opacity: 0, visibility: 'hidden' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <path ref={set(k, 'line')} d="M0 0" fill="none" stroke={p.accent} strokeWidth="1.5" />
            </svg>
            <Box
              ref={set(k, 'dot')}
              sx={{ position: 'absolute', left: { xs: -11, md: -6 }, top: { xs: -11, md: -6 }, width: { xs: 22, md: 12 }, height: { xs: 22, md: 12 }, borderRadius: '50%', backgroundColor: p.accent, color: p.bg, boxShadow: `0 0 0 4px rgba(255,194,26,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}
            >
              <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>{i + 1}</Box>
            </Box>
            <Box ref={set(k, 'card')} sx={{ position: 'absolute', left: 0, top: 0, width: 'min(19vw, 280px)' }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Box component="span" sx={{ fontSize: 12, fontWeight: 800, color: p.accent, letterSpacing: '0.1em' }}>{String(i + 1).padStart(2, '0')}</Box>
                <Box component="span" sx={{ fontSize: 19, fontWeight: 800, ...WIDE, letterSpacing: '-0.01em' }}>{part.label}</Box>
              </Box>
              <Box sx={{ fontSize: 14, lineHeight: 1.35, mt: 0.25, color: p.soft }}>{part.detail}</Box>
            </Box>
          </Box>
        );
      })}
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
      <Box data-glow aria-hidden="true" sx={{ position: 'absolute', left: '50%', top: '46%', width: '120vmax', height: '120vmax', transform: 'translate(-50%, -50%)', background: 'radial-gradient(closest-side, rgba(255,201,60,0.22), rgba(255,201,60,0.06) 45%, transparent 70%)', pointerEvents: 'none' }} />
      <Box data-star aria-hidden="true" sx={{ width: { xs: 64, md: 112 }, height: { xs: 64, md: 112 }, mb: { xs: 2, md: 3 }, position: 'relative' }}>
        <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <path data-star-path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill={p.accent} stroke={p.accent} strokeWidth="0.8" strokeLinejoin="round" />
        </svg>
      </Box>
      <Box
        component="h2"
        id="story-finale-h"
        aria-label="Goldstar"
        data-word
        sx={{ m: 0, fontWeight: 900, ...WIDE, lineHeight: 0.86, whiteSpace: 'nowrap', maxWidth: '100%', fontSize: 'min(calc((100vw - 32px) / 6.9), 260px)', '@media (min-width:600px)': { fontSize: 'min(calc((100vw - 120px) / 6.9), 260px)' }, color: p.ink, position: 'relative' }}
      >
        {WORD.split('').map((ch, i) => (
          <Box key={i} component="span" aria-hidden="true" sx={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', pb: '0.04em' }}>
            <Box component="span" data-letter sx={{ display: 'inline-block', transformOrigin: '0% 100%' }}>{ch}</Box>
          </Box>
        ))}
      </Box>
      <Box data-sub lang="ne" sx={{ fontFamily: 'Mukta', fontWeight: 600, fontSize: { xs: 34, md: 'clamp(40px, 4.4vw, 72px)' }, lineHeight: 1.1, mt: { xs: 1, md: 1.5 }, color: p.accent, position: 'relative' }}>
        गोल्डस्टार
      </Box>
      <Box data-sub sx={{ mt: { xs: 3, md: 4 }, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
        <Box component="span" sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 600, color: p.soft }}>Made in Nepal. Made for every trail.</Box>
        <PillLink to="/shop" ink={p.ink} bg={p.bg}>Shop all</PillLink>
      </Box>
    </Box>
  );
}
