import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { ArrowDown } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { brand, WIDE } from '../theme/tokens.js';
import { formatNPR } from '../lib/format.js';
import { COLOURWAYS, DEFAULT_COLOUR, STORY_MODEL } from '../story/model.config.js';
import Quiet3D from '../components/Quiet3D.jsx';
import { DISPLAY, Eyebrow, Pill } from './ui.jsx';
import { BEATS, BOXES, HERO_OUT, INTER, POSTER_SCALE, RANGE, beatCopy, colourAt, landingPose, layoutOf, showAt, smooth } from './showcase.js';

gsap.registerPlugin(ScrollTrigger);

// The 3D chunk (three + R3F + drei) loads only here, after first paint, and never on the static tier or with
// reduced motion.
const LandingStage = lazy(() => import('./LandingStage.jsx'));

const PHONE = '@media (max-width:899.95px)';
const COPY_Z = 4;

// Real counts from the model (story/model.config.js) and the catalogue: no invented numbers.
const STATS = [
  { n: STORY_MODEL.order.length, label: 'parts' },
  { n: 8, label: 'layers' },
  { n: COLOURWAYS.length, label: 'colourways' },
];

const BEAT_COPY = {
  grip: {
    eyebrow: '01 · Grip',
    title: 'Grip that reads the ground.',
    body: 'A rubber outsole with deep diamond lugs, for durability and slip resistance on mud, scree and wet stone.',
    specs: ['Rubber outsole', 'Diamond lugs', 'Slip resistant'],
  },
  cushion: {
    eyebrow: '02 · Cushioning',
    title: 'Cushioned for the long way round.',
    body: 'An EVA midsole for bounce, an arch-supported cushioned footbed and high-density foam around the ankle.',
    specs: ['EVA midsole', 'Arch support', 'High-density foam'],
  },
  upper: {
    eyebrow: '03 · Upper',
    title: 'Tough outside. Breathable inside.',
    body: 'PU synthetic-leather overlays over canvas mesh, a rubber toe bumper and metal eyelets for ruggedness.',
    specs: ['PU synthetic leather', 'Canvas mesh', 'Metal eyelets'],
  },
  colour: {
    eyebrow: '04 · Colour',
    title: 'Four ways to wear the mountain.',
    body: 'Himalayan Earth and Kathmandu Black are in stock now. Annapurna Pink and Everest Grey are coming soon.',
  },
};

// --- Poster ------------------------------------------------------------------------------------------
// The LCP image: a transparent render of the hero pose (public/img/hero), sized with the same framing as the
// canvas (container units of the stage), so the live boot fades in exactly over it.
const posterBox = (layout) => {
  const b = BOXES[layout].hero;
  const k = POSTER_SCALE[layout] * b.fill * 100;
  const s = `min(${(k * b.w).toFixed(2)}cqw, ${(k * b.h).toFixed(2)}cqh)`;
  return { '--s': s, left: `calc(${b.cx * 100}cqw - var(--s) / 2)`, top: `calc(${b.cy * 100}cqh - var(--s) / 2)` };
};

function HeroPoster({ hidden, posterRef }) {
  return (
    <Box
      ref={posterRef}
      component="picture"
      data-poster
      aria-hidden="true"
      sx={{
        position: 'absolute', zIndex: 2, width: 'var(--s)', height: 'var(--s)', pointerEvents: 'none', transformOrigin: '50% 50%',
        ...posterBox('desktop'),
        [PHONE]: posterBox('phone'),
        opacity: hidden ? 0 : 1, transition: 'opacity 700ms ease',
        '& img': { display: 'block', width: '100%', height: '100%' },
      }}
    >
      <source media="(max-width: 899.95px)" srcSet="/img/hero/boot-phone.webp" width={720} height={720} />
      <img src="/img/hero/boot-desktop.webp" alt="" width={1100} height={1100} fetchPriority="high" decoding="async" />
    </Box>
  );
}

// Stage ground: night navy with a soft indigo spotlight that follows the boot (--sx/--sy set from the pose).
function Spotlight({ spotRef }) {
  return (
    <Box
      ref={spotRef}
      aria-hidden="true"
      sx={{
        position: 'absolute', inset: 0, zIndex: 0, '--sx': '68%', '--sy': '55%', [PHONE]: { '--sx': '50%', '--sy': '60%' },
        backgroundColor: brand.night,
        backgroundImage: `radial-gradient(ellipse 52% 58% at var(--sx) var(--sy), rgba(58,66,176,0.62) 0%, rgba(35,40,116,0.42) 38%, rgba(10,12,40,0) 78%), linear-gradient(180deg, ${brand.night} 0%, #0D1034 100%)`,
      }}
    />
  );
}

// --- Copy blocks -------------------------------------------------------------------------------------
function HeroCopy({ product, heroRef, flow }) {
  const from = product?.colourways?.length ? Math.min(...product.colourways.map((c) => c.price)) : null;
  return (
    <Box
      ref={heroRef}
      data-hero-copy
      sx={{
        position: 'absolute', inset: 0, zIndex: COPY_Z, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
        boxSizing: 'border-box', px: '6cqw', pt: 'calc(var(--appbar-h, 64px) + 24px)', pb: 6, maxWidth: 'calc(6cqw + 620px)', color: brand.onNight,
        '@keyframes gsHeroRise': { from: { transform: 'translateY(18px)' }, to: { transform: 'none' } },
        '& > *': { animation: 'gsHeroRise 900ms cubic-bezier(0.16,1,0.3,1) both', '@media (prefers-reduced-motion: reduce)': { animation: 'none' } },
        '& > *:nth-of-type(2)': { animationDelay: '90ms' },
        [PHONE]: { maxWidth: 'none', px: 2.5, justifyContent: 'space-between', gap: 2, pt: 'calc(var(--appbar-h, 56px) + 20px)', pb: 'calc(24px + env(safe-area-inset-bottom))' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.25, md: 2 } }}>
        <Eyebrow>Goldstar · G10-401 Trek</Eyebrow>
        <Box component="h1" id="landing-h1" sx={{ ...DISPLAY, display: 'flex', flexDirection: 'column', gap: { xs: 0.75, md: 1.25 } }}>
          <Box component="span" sx={{ fontSize: { xs: 'clamp(76px, 24vw, 112px)', md: 'clamp(120px, 12.5vw, 208px)' }, letterSpacing: '-0.05em', lineHeight: 0.82 }}>G10.</Box>
          <Box component="span" sx={{ fontSize: { xs: 'clamp(28px, 8.2vw, 38px)', md: 'clamp(40px, 3.6vw, 60px)' }, lineHeight: 1 }}>Built for every trail.</Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.75, md: 2.5 } }}>
        <Box component="p" sx={{ m: 0, fontSize: { xs: 16, md: 19 }, lineHeight: 1.5, color: brand.onNight2, maxWidth: '36ch', [PHONE]: { display: 'none' } }}>
          A mid-cut trek boot, made in Nepal: rubber lugs, an EVA midsole and a tough synthetic-leather upper.
        </Box>
        <Box component="p" data-price sx={{ m: 0, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 1.25, rowGap: 0.25, fontVariantNumeric: 'tabular-nums' }}>
          <Box component="span" sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 800, ...WIDE }}>{from ? `From ${formatNPR(from)}` : 'Made in Nepal'}</Box>
          <Box component="span" sx={{ fontSize: { xs: 14, md: 15 }, color: brand.onNight2 }}>Cash on delivery</Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', [PHONE]: { flexWrap: 'nowrap', '& > *': { flex: '1 1 0', px: 1.5 } } }}>
          <Pill to="/product/g10-401" variant="gold">Buy</Pill>
          <Pill to="/g10" variant="outline" aria-label="Explore the G10 in 3D">
            <Box component="span" sx={{ [PHONE]: { display: 'none' } }}>Explore the G10 in 3D</Box>
            <Box component="span" aria-hidden="true" sx={{ display: 'none', [PHONE]: { display: 'inline' } }}>Explore in 3D</Box>
          </Pill>
        </Box>
      </Box>
      {flow ? null : (
        <Box data-cue aria-hidden="true" sx={{ position: 'absolute', left: '6cqw', bottom: 32, display: 'flex', alignItems: 'center', gap: 1, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: brand.onNight2, [PHONE]: { display: 'none' } }}>
          <ArrowDown size={16} strokeWidth={2.25} /> Scroll
        </Box>
      )}
    </Box>
  );
}

function Stat({ n, label, statRef, tone = brand.onNight }) {
  return (
    <Box component="li" aria-label={`${n} ${label}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <Box ref={statRef} component="span" aria-hidden="true" data-n={n} sx={{ fontSize: { xs: 40, md: 64 }, fontWeight: 800, ...WIDE, letterSpacing: '-0.04em', lineHeight: 1, color: tone, fontVariantNumeric: 'tabular-nums' }}>{n}</Box>
      <Box component="span" aria-hidden="true" sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: brand.goldText }}>{label}</Box>
    </Box>
  );
}

function StatsRow({ statRefs }) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: 2, md: 6 }, width: '100%', maxWidth: 720, mx: 'auto' }}>
      {STATS.map((s, i) => <Stat key={s.label} {...s} statRef={statRefs ? (el) => { statRefs.current[i] = el; } : undefined} />)}
    </Box>
  );
}

function ColourList({ activeKey, tone = brand.onNight }) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: { xs: 1, md: 1.5 } }}>
      {COLOURWAYS.map((c) => {
        const on = c.key === activeKey;
        return (
          <Box component="li" key={c.key} aria-current={on ? 'true' : undefined} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, fontSize: { xs: 14, md: 16 }, fontWeight: on ? 800 : 500, color: tone, opacity: on ? 1 : 0.72, transition: 'opacity 240ms ease' }}>
            <Box component="span" sx={{ width: 18, height: 18, flex: '0 0 auto', borderRadius: '50%', backgroundColor: c.hex, boxShadow: on ? `0 0 0 2px ${brand.night}, 0 0 0 4px ${brand.gold}` : 'inset 0 0 0 1.5px rgba(255,255,255,0.4)', transition: 'box-shadow 240ms ease' }} />
            <span>{c.name}{c.product ? '' : <Box component="span" sx={{ display: 'block', fontSize: 12, fontWeight: 500, color: brand.onNight2 }}>Coming soon</Box>}</span>
          </Box>
        );
      })}
    </Box>
  );
}

function BeatText({ id, activeKey }) {
  const c = BEAT_COPY[id];
  return (
    <>
      <Eyebrow>{c.eyebrow}</Eyebrow>
      <Box component="h2" sx={{ ...DISPLAY, fontSize: { xs: 'clamp(30px, 8.6vw, 40px)', md: 'clamp(44px, 4vw, 68px)' } }}>{c.title}</Box>
      <Box component="p" sx={{ m: 0, fontSize: { xs: 16, md: 19 }, lineHeight: 1.5, color: brand.onNight2, maxWidth: '38ch' }}>{c.body}</Box>
      {c.specs ? (
        <Box component="ul" aria-label="Specs" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {c.specs.map((s) => (
            <Box component="li" key={s} sx={{ px: 1.5, py: 0.75, borderRadius: '999px', border: `1px solid ${brand.line}`, backgroundColor: 'rgba(255,255,255,0.04)', fontSize: { xs: 13, md: 14 }, fontWeight: 600, color: brand.onNight }}>{s}</Box>
          ))}
        </Box>
      ) : null}
      {id === 'colour' ? <ColourList activeKey={activeKey} /> : null}
    </>
  );
}

// --- Motion showcase: a sticky full-screen stage scrubbed by the scroll -------------------------------------
function MotionShowcase({ product, tier, onT }) {
  const showRef = useRef(null);
  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const posterRef = useRef(null);
  const spotRef = useRef(null);
  const interRef = useRef(null);
  const giantRef = useRef(null);
  const statRefs = useRef([]);
  const beatRefs = useRef({});
  const live = useRef({ T: 0, layout: layoutOf(typeof window === 'undefined' ? 1440 : window.innerWidth), active: true, invalidate: null }).current;
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  readyRef.current = ready;
  const [colourKey, setColourKey] = useState(DEFAULT_COLOUR);
  const colourRef = useRef(DEFAULT_COLOUR);

  // Canvas after first paint (idle), so the poster and copy paint first.
  useEffect(() => {
    let id = null;
    const go = () => setMount(true);
    if ('requestIdleCallback' in window) id = window.requestIdleCallback(go, { timeout: 1200 });
    else id = setTimeout(go, 300);
    return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);

  // Render only while the showcase is on screen and the tab is visible.
  useEffect(() => {
    let onScreen = true;
    const upd = () => {
      live.active = onScreen && document.visibilityState === 'visible';
      if (live.active) live.invalidate?.();
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      upd();
    });
    if (showRef.current) io.observe(showRef.current);
    document.addEventListener('visibilitychange', upd);
    const onResize = () => {
      live.layout = layoutOf(window.innerWidth);
      live.invalidate?.();
    };
    window.addEventListener('resize', onResize);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', upd);
      window.removeEventListener('resize', onResize);
    };
  }, [live]);

  // One Lenis + one ScrollTrigger, created in a gsap.context and reverted on unmount (nothing leaks into /g10).
  useLayoutEffect(() => {
    const pose = landingPose(0, live.layout);
    const hero = landingPose(0, live.layout);
    const apply = (T) => {
      live.T = T;
      live.invalidate?.();
      onT?.(T);
      const h = 1 - smooth(HERO_OUT[0], HERO_OUT[1], T);
      const he = heroRef.current;
      if (he) {
        he.style.opacity = h.toFixed(3);
        he.style.transform = `translate3d(0, ${(-(1 - h) * 56).toFixed(1)}px, 0)`;
        he.style.visibility = h < 0.02 ? 'hidden' : 'visible';
      }
      const iv = showAt(INTER, T);
      if (interRef.current) {
        interRef.current.style.opacity = iv.toFixed(3);
        interRef.current.style.transform = `translate3d(0, ${((1 - smooth(INTER.in[0], INTER.in[1], T)) * 28 - smooth(INTER.out[0], INTER.out[1], T) * 28).toFixed(1)}px, 0)`;
      }
      if (giantRef.current) {
        giantRef.current.style.opacity = showAt({ in: [45, 105], out: [160, 200] }, T).toFixed(3);
        giantRef.current.style.transform = `translate(-50%, -50%) scale(${(0.9 + 0.12 * smooth(40, 200, T)).toFixed(4)})`;
      }
      const k = smooth(INTER.in[0] - 10, INTER.in[1] + 15, T);
      statRefs.current.forEach((el) => {
        if (!el) return;
        const txt = String(Math.round(Number(el.dataset.n) * k));
        if (el.textContent !== txt) el.textContent = txt;
      });
      BEATS.forEach((id) => {
        const el = beatRefs.current[id];
        if (!el) return;
        const w = beatCopy(id);
        el.style.opacity = showAt(w, T).toFixed(3);
        const up = (1 - smooth(w.in[0], w.in[1], T)) * 32 - (w.out ? smooth(w.out[0], w.out[1], T) * 32 : 0);
        el.style.transform = `translate3d(0, ${up.toFixed(1)}px, 0)`;
      });
      landingPose(T, live.layout, pose);
      landingPose(0, live.layout, hero);
      if (spotRef.current) {
        spotRef.current.style.setProperty('--sx', `${(pose.cx * 100).toFixed(2)}%`);
        spotRef.current.style.setProperty('--sy', `${(pose.cy * 100).toFixed(2)}%`);
      }
      // Until the canvas is ready (or if it never comes), the poster follows the boot's size and place.
      const st = stageRef.current;
      if (posterRef.current && st && !readyRef.current) {
        const W = st.clientWidth;
        const H = st.clientHeight;
        const s = (pose.fill * Math.min(pose.w * W, pose.h * H)) / (hero.fill * Math.min(hero.w * W, hero.h * H));
        posterRef.current.style.transform = `translate3d(${((pose.cx - hero.cx) * W).toFixed(1)}px, ${((pose.cy - hero.cy) * H).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      }
      const key = T >= 400 ? COLOURWAYS[colourAt(T, COLOURWAYS.length)].key : DEFAULT_COLOUR;
      if (key !== colourRef.current) {
        colourRef.current = key;
        setColourKey(key);
      }
    };

    const lenis = new Lenis({ autoRaf: false, lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: showRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => apply(self.progress * RANGE),
        onRefresh: (self) => apply(self.progress * RANGE),
      });
    }, showRef);
    apply(0);
    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [live, onT]);

  return (
    <Box ref={showRef} component="section" aria-labelledby="landing-h1" data-showcase="motion" sx={{ position: 'relative', height: `calc(100svh + ${RANGE}vh)`, backgroundColor: brand.night }}>
      <Box ref={stageRef} sx={{ position: 'sticky', top: 0, height: '100svh', minHeight: 520, overflow: 'hidden', containerType: 'size', color: brand.onNight }}>
        <Spotlight spotRef={spotRef} />
        <Box
          ref={giantRef}
          aria-hidden="true"
          sx={{ position: 'absolute', zIndex: 1, left: '50%', top: '47%', transform: 'translate(-50%, -50%) scale(0.9)', opacity: 0, fontWeight: 900, ...WIDE, letterSpacing: '-0.06em', lineHeight: 0.8, whiteSpace: 'nowrap', fontSize: 'min(44cqw, 64cqh)', color: brand.indigo, pointerEvents: 'none', userSelect: 'none' }}
        >
          G10
        </Box>
        <HeroPoster hidden={ready} posterRef={posterRef} />
        {mount ? (
          <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: ready ? 1 : 0, transition: 'opacity 700ms ease' }}>
            <Quiet3D>
              <Suspense fallback={null}>
                <LandingStage tier={tier} live={live} colourKey={colourKey} onReady={() => setReady(true)} />
              </Suspense>
            </Quiet3D>
          </Box>
        ) : null}
        <HeroCopy product={product} heroRef={heroRef} />
        <Box
          ref={interRef}
          sx={{ position: 'absolute', zIndex: COPY_Z, left: 20, right: 20, bottom: '7cqh', opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 2, md: 3 }, pointerEvents: 'none', [PHONE]: { bottom: 'calc(92px + env(safe-area-inset-bottom))' } }}
        >
          <Box component="p" sx={{ m: 0, fontSize: { xs: 16, md: 20 }, fontWeight: 600, textAlign: 'center', color: brand.onNight, maxWidth: '30ch' }}>One boot, built part by part.</Box>
          <StatsRow statRefs={statRefs} />
        </Box>
        {BEATS.map((id) => (
          <Box
            key={id}
            ref={(el) => { beatRefs.current[id] = el; }}
            data-beat={id}
            sx={{
              position: 'absolute', zIndex: COPY_Z, opacity: 0, pointerEvents: 'none', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2.25,
              left: '6cqw', width: 'min(36cqw, 520px)', top: 'var(--appbar-h, 64px)', bottom: 0,
              [PHONE]: { left: 20, right: 20, width: 'auto', top: 'auto', bottom: 'calc(92px + env(safe-area-inset-bottom))', gap: 1.5, '& [aria-label="Specs"]': { display: 'none' } },
            }}
          >
            <BeatText id={id} activeKey={colourKey} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// --- Flow showcase: reduced motion / static tier. No canvas, no pins: the poster, then each beat as a plain section.
const BEAT_IMAGE = {
  grip: { src: '/img/g10-sole.webp', w: 620, h: 262, alt: 'The G10-401 outsole: diamond rubber lugs and a grooved heel', bare: true },
};
function beatImage(id, product) {
  if (BEAT_IMAGE[id]) return BEAT_IMAGE[id];
  const black = product?.colourways?.find((c) => c.key === 'black') || product?.colourways?.[0];
  const olive = product?.colourways?.find((c) => c.key === 'olive') || product?.colourways?.[0];
  const img = id === 'cushion' ? black?.images?.[1] || black?.images?.[0] : olive?.images?.[0];
  return img ? { src: img.thumb || img.src, w: 800, h: 800, alt: img.alt || 'The G10-401' } : null;
}

function FlowShowcase({ product }) {
  return (
    <Box component="section" aria-labelledby="landing-h1" data-showcase="flow" sx={{ backgroundColor: brand.night, color: brand.onNight }}>
      <Box sx={{ position: 'relative', height: '100svh', minHeight: 560, overflow: 'hidden', containerType: 'size' }}>
        <Spotlight />
        <HeroPoster />
        <HeroCopy product={product} flow />
      </Box>
      <Box sx={{ py: { xs: 8, md: 12 }, px: 2.5, borderTop: `1px solid ${brand.line}` }}>
        <Box component="p" sx={{ m: '0 auto', mb: { xs: 3, md: 5 }, fontSize: { xs: 16, md: 20 }, fontWeight: 600, textAlign: 'center' }}>One boot, built part by part.</Box>
        <StatsRow />
      </Box>
      {BEATS.map((id, i) => {
        const img = id === 'colour' ? null : beatImage(id, product);
        return (
          <Box key={id} data-beat={id} sx={{ px: { xs: 2.5, md: '6vw' }, py: { xs: 7, md: 11 }, borderTop: `1px solid ${brand.line}`, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 8 }, alignItems: 'center', maxWidth: 1440, mx: 'auto', boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, order: { md: i % 2 ? 2 : 1 } }}>
              <BeatText id={id} activeKey={DEFAULT_COLOUR} />
            </Box>
            {img ? (
              <Box sx={{ order: { md: i % 2 ? 1 : 2 }, borderRadius: '24px', overflow: 'hidden', backgroundColor: img.bare ? 'transparent' : brand.paper2, display: 'grid', placeItems: 'center' }}>
                <Box component="img" src={img.src} alt={img.alt} width={img.w} height={img.h} loading="lazy" decoding="async" sx={{ display: 'block', width: '100%', height: 'auto', maxWidth: img.bare ? 520 : 'none', mixBlendMode: img.bare ? 'normal' : 'multiply' }} />
              </Box>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

export default function Showcase({ product, tier, flow, onT }) {
  return flow ? <FlowShowcase product={product} /> : <MotionShowcase product={product} tier={tier} onT={onT} />;
}
