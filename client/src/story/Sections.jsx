import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_PX } from '../components/Page.jsx';
import { formatNPR } from '../lib/format.js';
import { tokens } from '../theme/tokens.js';
import { SECTIONS } from '../three/timeline.js';
import { overlay, useStory } from './store.js';
import { BadgeTile } from './badges.jsx';
import LineReveal from '../components/LineReveal.jsx';
import ProductPhoto from '../components/ProductPhoto.jsx';
import { useSFade, useStepIndex, useStoryCtx } from './StoryContext.jsx';

const sec = (id) => SECTIONS.find((s) => s.id === id);
const GRID = { display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', columnGap: { xs: 2, md: 3 } };
const FRAME_BASE = { position: 'sticky', top: 0, height: '100svh', boxSizing: 'border-box', pt: 'var(--appbar-h, 96px)', overflow: 'hidden' };

export function Section({ id, children, sx }) {
  const s = sec(id);
  return (
    <Box component="section" id={id} aria-labelledby={`${id}-h`} sx={{ position: 'relative', height: `${s.heightVh}vh`, scrollMarginTop: 0, ...sx }}>
      {children}
    </Box>
  );
}

const MBox = motion.create(Box);
function Fade({ inS, outS, dy, children, sx }) {
  const { progress, reduced } = useStoryCtx();
  const f = useSFade(progress, inS, outS, dy);
  if (reduced) return <Box sx={sx}>{children}</Box>;
  return <MBox style={{ opacity: f.opacity, y: f.y }} sx={sx}>{children}</MBox>;
}

const frameWide = { px: PAGE_PX, mx: 'auto', maxWidth: 1440, width: '100%', boxSizing: 'border-box', height: '100%', position: 'relative' };

// ---------------------------------------------------------------- Hero
const LINE_PRICE = { typography: 'price', display: 'block', color: 'text.primary', textTransform: 'none', mt: 1.5, fontWeight: 600 };
const H2_SIZE = { fontSize: { xs: 'clamp(30px, 8.4vw, 76px)', sm: 'clamp(34px, 4.6vw, 76px)' } };

// Real G10-401 photos from the API by colourway + image index (thumb for lit tiles).
const photo = (product, key, i) => product?.colourways?.find((c) => c.key === key)?.images?.[i] || null;
const firstPhoto = (product, ci, i) => product?.colourways?.[ci]?.images?.[i] || null;

export function HeroSection({ product, posterVisible }) {
  const layout = useStory((s) => s.layout);
  const phone = layout === 'phone';
  const price = product ? formatNPR(product.priceFrom) : null;
  return (
    <Section id="story-hero">
      <Box
        component="img"
        src="/posters/hero.webp"
        alt=""
        width={1440}
        height={900}
        fetchPriority="high"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: posterVisible ? 1 : 0, transition: 'opacity 400ms cubic-bezier(0.22,1,0.36,1)', pointerEvents: 'none', display: phone ? 'none !important' : 'block' }}
      />
      <Box sx={{ ...frameWide, ...GRID, zIndex: 1, alignContent: 'end', pb: phone ? '8svh' : '38vh' }}>
        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 6' }, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
          {/* The h1 is never faded (it is the page title); only the supporting copy fades out as the hero scrolls away. */}
          <LineReveal component="h1" variant="display" id="story-hero-h" load lines={[{ text: 'G10-401' }, { text: 'Built for the trail.', sx: LINE_PRICE }]} />
          <Fade outS={[30, 90]} sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
          <>
            <Typography variant="body1" sx={{ maxWidth: '40ch', minHeight: '3.2em' }}>
              Goldstar&rsquo;s trek shoe from Kathmandu.{price ? ` From ${price}.` : ''}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Button component={RouterLink} to="/product/g10-401" variant="contained" size="large">Shop the G10-401</Button>
              <Link component={RouterLink} to="/#story-performance" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Explore further</Link>
            </Box>
          </>
          </Fade>
        </Box>
      </Box>
    </Section>
  );
}

// ---------------------------------------------------------------- Performance
export function PerformanceSection({ product }) {
  const { progress } = useStoryCtx();
  const phone = useStory((s) => s.layout) === 'phone';
  const black = product?.colourways?.find((c) => c.key === 'black') || product?.colourways?.[0];
  const imgs = (black?.images || []).slice(1, 5);
  return (
    <Section id="story-performance">
      <Box sx={{ ...frameWide, ...GRID, alignContent: phone ? 'start' : 'center', pt: phone ? '14svh' : 0, pb: 0 }}>
        <Fade inS={[70, 110]} outS={[160, 200]} dy={32} sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 8' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <>
            <LineReveal component="h2" variant="h2" id="story-performance-h" text="Performance, redefined." progress={progress} inS={[70, 100]} sx={H2_SIZE} />
            <Typography variant="body1" sx={{ maxWidth: '44ch' }}>Seven parts, each one named on Goldstar&rsquo;s own spec sheet.</Typography>
          </>
        </Fade>
      </Box>
      {imgs.length ? (
        <Fade inS={[60, 90]} outS={[165, 200]} dy={24} sx={{ position: 'absolute', left: 0, right: 0, bottom: phone ? '5svh' : '7vh', px: PAGE_PX, boxSizing: 'border-box', maxWidth: 1440, mx: 'auto' }}>
          <Box component="ul" aria-label="G10-401 photos" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', gap: { xs: 1, md: 1.5 } }}>
            {imgs.map((im, i) => (
              <Box component="li" key={im.src} sx={{ width: { xs: '21vw', md: '11vw' }, maxWidth: 190, flexShrink: 0 }}>
                <ProductPhoto image={im} alt={im.alt || `G10-401 in Black, photo ${i + 2}`} sizes="12vw" />
              </Box>
            ))}
          </Box>
        </Fade>
      ) : null}
    </Section>
  );
}

// Shared bits for the phone stepped panel -------------------------------------------------
function scrollToStep(sStart, sEnd, count, i) {
  const story = document.getElementById('story');
  if (!story) return;
  const vh = window.innerHeight / 100;
  const s = sStart + ((i + 0.5) * (sEnd - sStart)) / count;
  const top = story.getBoundingClientRect().top + window.scrollY + s * vh;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}

function StepPanel({ items, index, sStart, sEnd, badges }) {
  const go = (i) => scrollToStep(sStart, sEnd, items.length, Math.min(items.length - 1, Math.max(0, i)));
  return (
    <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2, backgroundColor: 'background.paper', minHeight: '34svh', maxHeight: '42svh', p: 2, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', columnGap: 2, flex: 1, minWidth: 0 }}>
          {items.map((it, i) => (
            <Typography component="li" key={it.key} variant="body2" aria-current={i === index ? 'step' : undefined} sx={{ color: i === index ? 'primary.main' : 'text.secondary', fontWeight: i === index ? 600 : 400, whiteSpace: 'nowrap' }}>
              {it.title}
            </Typography>
          ))}
        </Box>
        <IconButton aria-label="Previous part" onClick={() => go(index - 1)} disabled={index === 0}><ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" /></IconButton>
        <IconButton aria-label="Next part" onClick={() => go(index + 1)} disabled={index === items.length - 1}><ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" /></IconButton>
      </Box>
      <Box sx={{ position: 'relative', flex: 1, overflow: 'auto' }}>
        {items.map((it, i) => (
          <Box key={it.key} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', position: i === index ? 'relative' : 'absolute', inset: i === index ? 'auto' : 0, opacity: i === index ? 1 : 0, pointerEvents: i === index ? 'auto' : 'none', transition: 'opacity 180ms ease' }} aria-hidden={i === index ? undefined : true}>
            {badges ? <BadgeTile badge={it.badge} /> : null}
            <Box>
              <Typography variant="h5" component="h3">{it.title}</Typography>
              <Typography variant="body1">{it.body}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Reduced motion on phones: all parts stacked as a list instead of the stepped panel.
function StackedList({ items, badges }) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: 'background.paper', position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2, maxHeight: '46svh', overflow: 'auto', boxSizing: 'border-box' }}>
      {items.map((it) => (
        <Box component="li" key={it.key} sx={{ display: 'flex', gap: 2 }}>
          {badges ? <BadgeTile badge={it.badge} /> : null}
          <Box>
            <Typography variant="h5" component="h3">{it.title}</Typography>
            <Typography variant="body1">{it.body}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

const svgStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' };
const dotSx = { position: 'absolute', left: -6, top: -6, width: 12, height: 12, borderRadius: '50%', backgroundColor: tokens.gold, opacity: 0, transform: 'translate(-100px,-100px) scale(0.9)', willChange: 'transform' };

// ---------------------------------------------------------------- Callouts
export function CalloutsSection({ items }) {
  const { progress, reduced } = useStoryCtx();
  const phone = useStory((s) => s.layout) === 'phone';
  const frame = useRef(null);
  const dots = useRef([]);
  const lines = useRef([]);
  const texts = useRef([]);
  const slots = useRef([]);
  const index = useStepIndex(progress, 200, 300, Math.max(1, items.length));
  const preview = useStory((s) => s.anchorPreview);
  // FX2: desktop cards are ordered by the anchors' projected screen y at the hold pose (top anchor -> top card),
  // computed once when the model is ready, so the leader lines never cross and nothing reshuffles mid-hold.
  const shown = useMemo(() => {
    const tagged = items.map((it, i0) => ({ ...it, i0 }));
    if (phone || !preview || tagged.some((it) => it.position || preview[it.anchor] === undefined)) return tagged;
    return [...tagged].sort((x, y) => preview[x.anchor] - preview[y.anchor]);
  }, [items, preview, phone]);

  const measure = useCallback(() => {
    const f = frame.current;
    if (!f) return;
    const fr = f.getBoundingClientRect();
    overlay.callouts.forEach((c, i) => {
      const r = texts.current[i]?.getBoundingClientRect();
      const sl = slots.current[i]?.getBoundingClientRect();
      if (r && sl) {
        c.textPoint.x = r.left - fr.left - 10; // end at the card's left edge
        c.textPoint.y = sl.top - fr.top + 12; // centred on the title line
      }
    });
  }, []);

  useLayoutEffect(() => {
    overlay.callouts = shown.map((it, i) => ({
      index: it.i0, anchor: it.anchor, position: it.position, dot: dots.current[i], line: lines.current[i], text: texts.current[i], textPoint: { x: 0, y: 0 }, last: false,
    }));
    measure();
    const ro = new ResizeObserver(measure);
    if (frame.current) ro.observe(frame.current);
    return () => {
      ro.disconnect();
      overlay.callouts = [];
    };
  }, [shown, phone, measure]);

  const ready = items.length > 0;
  return (
    <Section id="story-callouts">
      <Box ref={frame} sx={FRAME_BASE}>
        {!phone && ready ? (
          <svg style={svgStyle} aria-hidden="true">
            {shown.map((it, i) => (
              <polyline key={it.key} ref={(el) => (lines.current[i] = el)} fill="none" stroke={tokens.gold} strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset="1" style={{ opacity: 0 }} />
            ))}
          </svg>
        ) : null}
        {!phone ? shown.map((it, i) => <Box key={it.key} aria-hidden="true" ref={(el) => (dots.current[i] = el)} sx={{ ...dotSx, zIndex: 1 }} />) : null}
        <Box sx={{ ...frameWide, ...GRID, alignContent: 'start', pt: { xs: 2, md: 6 } }}>
          <Box sx={{ gridColumn: { xs: '1 / -1', md: '8 / -1' }, pr: { md: '160px' }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 5 } }}>
            <LineReveal component="h2" variant="h2" id="story-callouts-h" text="What it’s made of" progress={progress} inS={[150, 185]} sx={H2_SIZE} />
            {!phone ? (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {shown.map((it, i) => (
                  <Box component="li" key={it.key} ref={(el) => (slots.current[i] = el)} sx={{ pl: 3 }}>
                    <Box ref={(el) => (texts.current[i] = el)} style={{ opacity: reduced ? 1 : 0 }}>
                      <Typography variant="h5" component="h3">{it.title}</Typography>
                      <Typography variant="body1" sx={{ maxWidth: '40ch' }}>{it.body}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>
        </Box>
        {phone ? (reduced ? <StackedList items={items} /> : <StepPanel items={items} index={index} sStart={200} sEnd={300} />) : null}
      </Box>
    </Section>
  );
}

// ---------------------------------------------------------------- Explode
export function ExplodeSection({ items }) {
  const { progress, reduced } = useStoryCtx();
  const phone = useStory((s) => s.layout) === 'phone';
  const frame = useRef(null);
  const dots = useRef([]);
  const lines = useRef([]);
  const badges = useRef([]);
  const index = useStepIndex(progress, 430, 500, Math.max(1, items.length));

  const measure = useCallback(() => {
    const f = frame.current;
    if (!f) return;
    const fr = f.getBoundingClientRect();
    overlay.layers.forEach((l, i) => {
      l.textPoint.x = fr.width * 0.64; // badge column ends 160 px + 32 px margin before the right edge (chapter index)
      l.textPoint.h = badges.current[i]?.offsetHeight || 80;
    });
  }, []);

  useLayoutEffect(() => {
    overlay.layers = items.map((it, i) => ({ index: i, anchor: it.anchor, position: it.position, dot: dots.current[i], line: lines.current[i], badge: badges.current[i], textPoint: { x: 0, h: 80 }, last: false }));
    measure();
    const ro = new ResizeObserver(measure);
    if (frame.current) ro.observe(frame.current);
    return () => {
      ro.disconnect();
      overlay.layers = [];
    };
  }, [items, phone, measure]);

  return (
    <Section id="story-explode">
      <Box ref={frame} sx={FRAME_BASE}>
        {!phone ? (
          <svg style={svgStyle} aria-hidden="true">
            {items.map((it, i) => (
              <polyline key={it.key} ref={(el) => (lines.current[i] = el)} fill="none" stroke={tokens.gold} strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset="1" style={{ opacity: 0 }} />
            ))}
          </svg>
        ) : null}
        {!phone ? items.map((it, i) => <Box key={it.key} aria-hidden="true" ref={(el) => (dots.current[i] = el)} sx={{ ...dotSx, zIndex: 1 }} />) : null}
        <Box sx={{ ...frameWide, ...GRID, alignContent: 'start', pt: { xs: 2, md: 6 }, height: 'auto' }}>
          <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 7' } }}><LineReveal component="h2" variant="h2" id="story-explode-h" text="From the footbed down" progress={progress} inS={[350, 385]} sx={H2_SIZE} /></Box>
        </Box>
        {!phone ? (
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {items.map((it, i) => (
              <Box component="li" key={it.key} ref={(el) => (badges.current[i] = el)} style={{ opacity: reduced ? 1 : 0 }} sx={{ position: 'absolute', left: 0, top: 0, width: { md: 'calc(36vw - 192px)' }, maxWidth: 400, display: 'flex', gap: 2, alignItems: 'flex-start', zIndex: 1 }}>
                <BadgeTile badge={it.badge} />
                <Box>
                  <Typography variant="h5" component="h3">{it.title}</Typography>
                  <Typography variant="body1">{it.body}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : reduced ? <StackedList items={items} badges /> : <StepPanel items={items} index={index} sStart={430} sEnd={500} badges />}
      </Box>
    </Section>
  );
}

// ---------------------------------------------------------------- Endure
const ENDURE_KEYS = ['rubber-outsole', 'eva-midsole', 'metal-eyelets'];

export function EndureSection({ product }) {
  const { progress } = useStoryCtx();
  const phone = useStory((s) => s.layout) === 'phone';
  const black = product?.colourways?.find((c) => c.key === 'black') || product?.colourways?.[0];
  const sole = black?.images?.[7] || black?.images?.[black.images.length - 2] || null;
  const parts = ENDURE_KEYS.map((k) => product?.specCallouts?.find((c) => c.key === k)).filter(Boolean);
  return (
    <Section id="story-endure">
      <Box sx={{ ...frameWide, ...GRID, alignContent: phone ? 'start' : 'center', pt: phone ? '12svh' : 0 }}>
        <Fade inS={[570, 600]} outS={[650, 690]} dy={32} sx={{ gridColumn: { xs: '1 / -1', md: '6 / -1' }, pr: { md: '120px' }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
          <>
            <LineReveal component="h2" variant="h2" id="story-endure-h" text="Designed to endure." progress={progress} inS={[570, 598]} sx={H2_SIZE} />
            <Typography variant="body1" sx={{ maxWidth: '44ch' }}>Rubber underfoot, EVA in between, metal at the laces.</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'row' }, gap: { xs: 2, md: 3 }, alignItems: 'flex-start' }}>
              {parts.length ? (
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2.5 }, flex: 1, minWidth: 0 }}>
                  {parts.map((c) => (
                    <li key={c.key}>
                      <Typography variant="h5" component="h3">{c.title}</Typography>
                      <Typography variant="body1">{c.body}</Typography>
                    </li>
                  ))}
                </Box>
              ) : null}
              {sole ? (
                <Box sx={{ width: { xs: '34vw', md: '26vw' }, maxWidth: 380, flexShrink: 0 }}>
                  <ProductPhoto image={sole} alt="G10-401 in Black, sole view" sizes="28vw" />
                </Box>
              ) : null}
            </Box>
          </>
        </Fade>
      </Box>
    </Section>
  );
}

// ---------------------------------------------------------------- Finale
export function FinaleSection({ product }) {
  const { progress } = useStoryCtx();
  const black = firstPhoto(product, 0, 0);
  const olive = photo(product, 'olive', 0) || firstPhoto(product, 1, 0);
  const tile = (im, label, colour) =>
    im ? (
      <Link component={RouterLink} to={`/product/g10-401?colour=${colour}`} aria-label={`${label}: G10-401 in ${colour}`} sx={{ display: 'block', width: '100%' }}>
        <ProductPhoto image={im} alt={`G10-401 in ${colour}`} sizes="24vw" />
      </Link>
    ) : <Box />;
  return (
    <Section id="story-finale">
      <Box sx={{ ...frameWide, px: { xs: 2, sm: 3, md: '128px' }, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'minmax(0,14vw) minmax(0,1fr) minmax(0,14vw)' }, columnGap: { xs: 2, md: 3 }, rowGap: 3, alignItems: 'center', alignContent: 'center' }}>
        <Box sx={{ order: { xs: 2, md: 1 } }}>{tile(black, 'Black', 'black')}</Box>
        <Box sx={{ order: { xs: 1, md: 2 }, gridColumn: { xs: '1 / -1', md: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3 }}>
          <LineReveal component="h2" variant="h2" id="story-finale-h" text="Your adventure begins now." progress={progress} inS={[850, 885]} sx={H2_SIZE} />
          <Typography variant="body1">Order today and pay in cash when it arrives.</Typography>
          <Button component={RouterLink} to="/shop" variant="contained" size="large">Shop all</Button>
        </Box>
        <Box sx={{ order: { xs: 3, md: 3 } }}>{tile(olive, 'Olive', 'olive')}</Box>
      </Box>
    </Section>
  );
}
