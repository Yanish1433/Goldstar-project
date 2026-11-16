import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { ArrowDown } from 'lucide-react';
import Quiet3D from '../components/Quiet3D.jsx';
import { detectTier } from '../three/tier.js';
import { DEFAULT_COLOUR } from '../story/model.config.js';
import { BOXES, POSTER_SCALE, landingPose, layoutOf, smooth } from '../landing/showcase.js';
import { tokensV2 as t, DISPLAY_LIGHT, EYEBROW, PHONE, REDUCED, EASE_CSS } from './tokensV2.js';
import { Cta } from './ui.jsx';
import { prefersReducedMotion } from './motion.js';

// 1. Cinematic hero. A dark studio with the Himalaya as a dim atmospheric layer, the G10-401 lit from behind with a
// gold rim. First paint is a real <img> poster (LCP, fetchpriority high, fixed size) of the boot in its hero pose;
// the WebGL boot (HeroStage, its own lazy chunk with three/R3F/drei) mounts on idle after load and crossfades in
// over the poster in exactly the same pose and framing. Scroll scrubs a pinned stage: the copy lifts away, the camera
// pushes in until the boot fills the room behind a hairline "G10", then the page hands off to the range.
// Static tier and reduced motion: the poster only, no pin, no canvas.
const HeroStage = lazy(() => import('./HeroStage.jsx'));

const RANGE = 190; // T at the end of the pin (landing/showcase.js time, vh)
const PIN_VH = 170; // extra scroll length of the pinned hero
const Z = { back: 0, pool: 1, giant: 2, poster: 3, canvas: 4, copy: 5 };

const posterBox = (layout) => {
  const b = BOXES[layout].hero;
  const k = POSTER_SCALE[layout] * b.fill * 100;
  const s = `min(${(k * b.w).toFixed(2)}cqw, ${(k * b.h).toFixed(2)}cqh)`;
  return { '--s': s, left: `calc(${b.cx * 100}cqw - var(--s) / 2)`, top: `calc(${b.cy * 100}cqh - var(--s) / 2)` };
};

function Poster({ hidden, posterRef }) {
  return (
    <Box
      ref={posterRef}
      component="picture"
      data-poster
      aria-hidden="true"
      sx={{
        position: 'absolute', zIndex: Z.poster, width: 'var(--s)', height: 'var(--s)', pointerEvents: 'none', transformOrigin: '50% 50%',
        ...posterBox('desktop'),
        [PHONE]: posterBox('phone'),
        opacity: hidden ? 0 : 1,
        transition: 'opacity 900ms ease',
        '& img': { display: 'block', width: '100%', height: '100%' },
      }}
    >
      <source media="(max-width: 899.95px)" srcSet="/img/hero/boot-phone.webp" width={720} height={720} />
      <img src="/img/hero/boot-desktop.webp" alt="" width={1100} height={1100} fetchPriority="high" decoding="async" />
    </Box>
  );
}

// The room: the Himalaya, dimmed and warmed, with a soft ivory light pool where the boot stands. No colour of its own.
function Room({ backRef, poolRef }) {
  return (
    <>
      <Box ref={backRef} aria-hidden="true" sx={{ position: 'absolute', inset: '-6%', zIndex: Z.back, willChange: 'transform' }}>
        <Box
          component="img"
          src="/v2/himalaya-atmos.webp"
          alt=""
          width={1600}
          height={900}
          decoding="async"
          fetchPriority="low"
          sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%', opacity: 0.9 }}
        />
      </Box>
      <Box
        ref={poolRef}
        aria-hidden="true"
        sx={{
          position: 'absolute', inset: 0, zIndex: Z.pool, '--px': '68%', '--py': '58%', [PHONE]: { '--px': '50%', '--py': '60%' },
          backgroundImage: `radial-gradient(ellipse 34% 40% at var(--px) var(--py), ${t.ivoryWash} 0%, transparent 70%), linear-gradient(180deg, ${t.veil} 0%, transparent 28%, transparent 62%, ${t.ground} 100%), linear-gradient(90deg, ${t.scrim} 0%, transparent 55%)`,
          [PHONE]: { '--px': '50%', '--py': '60%', backgroundImage: `radial-gradient(ellipse 60% 34% at var(--px) var(--py), ${t.ivoryWash} 0%, transparent 70%), linear-gradient(180deg, ${t.scrim} 0%, transparent 40%, transparent 64%, ${t.ground} 100%)` },
        }}
      />
    </>
  );
}

function HeroCopy({ copyRef, still }) {
  return (
    <Box
      ref={copyRef}
      sx={{
        position: 'absolute', inset: 0, zIndex: Z.copy, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
        boxSizing: 'border-box', px: '6cqw', pt: 'calc(var(--appbar-h, 64px) + 24px)', pb: 8, maxWidth: 'calc(6cqw + 660px)',
        '@keyframes gsHeroRise': { from: { opacity: 0, transform: 'translateY(22px)' }, to: { opacity: 1, transform: 'none' } },
        '& [data-rise]': { animation: `gsHeroRise 1100ms ${EASE_CSS} both`, [REDUCED]: { animation: 'none' } },
        '& [data-rise="2"]': { animationDelay: '90ms' },
        '& [data-rise="3"]': { animationDelay: '180ms' },
        '& [data-rise="4"]': { animationDelay: '270ms' },
        [PHONE]: { maxWidth: 'none', px: 2, justifyContent: 'space-between', gap: 2, pt: 'calc(var(--appbar-h, 56px) + 20px)', pb: 'calc(28px + env(safe-area-inset-bottom))' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2.5 } }}>
        <Box component="p" data-rise="1" sx={{ ...EYEBROW, m: 0, color: t.ivoryDim }}>
          Goldstar · Kathmandu · <Box component="span" lang="ne" sx={{ fontFamily: '"Mukta", sans-serif', letterSpacing: 0, textTransform: 'none', fontSize: 14 }}>नेपालमा बनेको</Box>
        </Box>
        <Box component="h1" id="landing-h1" data-rise="2" sx={{ ...DISPLAY_LIGHT, color: t.ivory, fontSize: { xs: 'clamp(40px, 11.6vw, 56px)', md: 'clamp(60px, 6vw, 108px)' }, lineHeight: 0.96 }}>
          Made in Nepal.
          <Box component="span" sx={{ display: 'block', color: t.ivoryDim }}>Built for the Himalaya.</Box>
        </Box>
        <Box component="p" data-rise="3" sx={{ m: 0, fontSize: { xs: 16, md: 18 }, lineHeight: 1.6, color: t.ivoryDim, maxWidth: '40ch', [PHONE]: { display: 'none' } }}>
          Five decades of Goldstar: trek boots, trainers and everyday shoes from Kathmandu, delivered to all 77 districts with cash on delivery.
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box data-rise="4" sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', [PHONE]: { flexWrap: 'nowrap', '& > *': { flex: '1 1 0', px: 1.5, fontSize: 14 } } }}>
          <Cta to="/shop" variant="solid">Shop all footwear</Cta>
          <Cta to="/g10" aria-label="Explore G10 in 3D">
            <Box component="span" sx={{ [PHONE]: { display: 'none' } }}>Explore G10 in 3D</Box>
            <Box component="span" aria-hidden="true" sx={{ display: 'none', [PHONE]: { display: 'inline' } }}>G10 in 3D</Box>
          </Cta>
        </Box>
      </Box>
      {still ? null : (
        <Box aria-hidden="true" sx={{ position: 'absolute', left: '50%', bottom: 28, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, ...EYEBROW, fontSize: 11, [PHONE]: { display: 'none' } }}>
          Scroll
          <Box sx={{ '@keyframes gsCue': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(6px)' } }, animation: 'gsCue 2.4s ease-in-out infinite', [REDUCED]: { animation: 'none' }, display: 'flex' }}>
            <ArrowDown size={16} strokeWidth={1.5} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function Hero3D() {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const copyRef = useRef(null);
  const posterRef = useRef(null);
  const backRef = useRef(null);
  const poolRef = useRef(null);
  const giantRef = useRef(null);
  const handRef = useRef(null);
  const live = useRef({ T: 0, px: 0, py: 0, layout: layoutOf(typeof window === 'undefined' ? 1440 : window.innerWidth), active: true, invalidate: null }).current;
  const [mode, setMode] = useState(null); // null until measured; 'motion' | 'still'
  const [tier, setTier] = useState('static');
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  readyRef.current = ready;

  // Decide once on the client: static tier or reduced motion = still poster.
  useLayoutEffect(() => {
    const tr = detectTier();
    setTier(tr);
    setMode(tr === 'static' || prefersReducedMotion() ? 'still' : 'motion');
  }, []);

  // Canvas: on idle after the page has loaded (or at the first scroll), never on the still path.
  useEffect(() => {
    if (mode !== 'motion') return undefined;
    let done = false;
    let idleId = null;
    const go = () => {
      if (done) return;
      done = true;
      setMount(true);
    };
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const cic = window.cancelIdleCallback || clearTimeout;
    const arm = () => { idleId = ric(go, { timeout: 2500 }); };
    const onScroll = () => go();
    window.addEventListener('scroll', onScroll, { passive: true, once: true });
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
    return () => {
      done = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('load', arm);
      if (idleId != null) cic(idleId);
    };
  }, [mode]);

  // Scroll scrub + pointer parallax + visibility (no GSAP needed: one passive listener, one rAF).
  useEffect(() => {
    if (mode !== 'motion') return undefined;
    const pose = landingPose(0, live.layout);
    const hero = landingPose(0, live.layout);
    let raf = 0;
    const apply = () => {
      raf = 0;
      const root = rootRef.current;
      const st = stageRef.current;
      if (!root || !st) return;
      const r = root.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      const T = p * RANGE;
      live.T = T;
      live.invalidate?.();
      const h = 1 - smooth(6, 50, T);
      const c = copyRef.current;
      if (c) {
        c.style.opacity = h.toFixed(3);
        c.style.transform = `translate3d(0, ${(-(1 - h) * 60).toFixed(1)}px, 0)`;
        c.style.visibility = h < 0.02 ? 'hidden' : 'visible';
      }
      const g = smooth(60, 120, T) * (1 - smooth(176, 190, T) * 0.4);
      if (giantRef.current) {
        giantRef.current.style.opacity = g.toFixed(3);
        giantRef.current.style.transform = `translate(-50%, -50%) scale(${(0.92 + 0.1 * smooth(50, 190, T)).toFixed(4)})`;
      }
      if (handRef.current) {
        const v = smooth(110, 140, T);
        handRef.current.style.opacity = v.toFixed(3);
        handRef.current.style.transform = `translate3d(0, ${((1 - v) * 24).toFixed(1)}px, 0)`;
        handRef.current.style.pointerEvents = v > 0.5 ? 'auto' : 'none';
        handRef.current.style.visibility = v < 0.02 ? 'hidden' : 'visible';
      }
      if (backRef.current) {
        backRef.current.style.transform = `translate3d(${(-live.px * 10).toFixed(1)}px, ${(T * 0.5 - live.py * 8).toFixed(1)}px, 0) scale(${(1 + T / 1400).toFixed(4)})`;
      }
      landingPose(T, live.layout, pose);
      landingPose(0, live.layout, hero);
      if (poolRef.current) {
        poolRef.current.style.setProperty('--px', `${(pose.cx * 100).toFixed(2)}%`);
        poolRef.current.style.setProperty('--py', `${(pose.cy * 100).toFixed(2)}%`);
      }
      if (posterRef.current && !readyRef.current) {
        const W = st.clientWidth;
        const H = st.clientHeight;
        const s = (pose.fill * Math.min(pose.w * W, pose.h * H)) / (hero.fill * Math.min(hero.w * W, hero.h * H));
        posterRef.current.style.transform = `translate3d(${((pose.cx - hero.cx) * W).toFixed(1)}px, ${((pose.cy - hero.cy) * H).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      }
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    const onMove = (e) => {
      live.px = (e.clientX / window.innerWidth) * 2 - 1;
      live.py = (e.clientY / window.innerHeight) * 2 - 1;
      req();
    };
    const onResize = () => { live.layout = layoutOf(window.innerWidth); req(); };
    let onScreen = true;
    const vis = () => {
      live.active = onScreen && document.visibilityState === 'visible';
      if (live.active) live.invalidate?.();
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; vis(); });
    if (stageRef.current) io.observe(rootRef.current);
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', onResize);
    if (fine) window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', vis);
    apply();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', req);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [mode, live]);

  const still = mode === 'still';
  return (
    <Box
      ref={rootRef}
      component="section"
      aria-labelledby="landing-h1"
      data-hero={mode || 'pending'}
      sx={{ position: 'relative', height: still || !mode ? '100svh' : `calc(100svh + ${PIN_VH}vh)`, minHeight: 560, backgroundColor: t.ground }}
    >
      <Box ref={stageRef} sx={{ position: 'sticky', top: 0, height: '100svh', minHeight: 560, overflow: 'hidden', containerType: 'size', color: t.ivory }}>
        <Room backRef={backRef} poolRef={poolRef} />
        <Box
          ref={giantRef}
          aria-hidden="true"
          sx={{
            position: 'absolute', zIndex: Z.giant, left: '50%', top: '44%', transform: 'translate(-50%, -50%) scale(0.92)', opacity: 0,
            ...DISPLAY_LIGHT, fontWeight: 200, lineHeight: 0.8, letterSpacing: '-0.05em', whiteSpace: 'nowrap', fontSize: 'min(46cqw, 66cqh)',
            color: 'transparent', WebkitTextStroke: `1px ${t.goldLine}`, pointerEvents: 'none', userSelect: 'none',
          }}
        >
          G10
        </Box>
        <Poster hidden={ready} posterRef={posterRef} />
        {mount ? (
          <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: Z.canvas, pointerEvents: 'none', opacity: ready ? 1 : 0, transition: 'opacity 900ms ease' }}>
            <Quiet3D>
              <Suspense fallback={null}>
                <HeroStage tier={tier} live={live} colourKey={DEFAULT_COLOUR} onReady={() => setReady(true)} />
              </Suspense>
            </Quiet3D>
          </Box>
        ) : null}
        <HeroCopy copyRef={copyRef} still={still} />
        {still ? null : (
          <Box
            ref={handRef}
            sx={{
              position: 'absolute', zIndex: Z.copy, left: 16, right: 16, bottom: '7cqh', opacity: 0, visibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center',
              [PHONE]: { bottom: 'calc(32px + env(safe-area-inset-bottom))' },
            }}
          >
            <Box component="p" sx={{ ...EYEBROW, m: 0 }}>G10-401 · Mid-cut trek boot · 12 parts</Box>
            <Box component="p" sx={{ m: 0, fontSize: { xs: 18, md: 22 }, fontWeight: 300, color: t.ivory, maxWidth: '30ch', lineHeight: 1.4 }}>Every part modelled, every layer you can take apart.</Box>
            <Cta to="/g10">Take it apart in 3D</Cta>
          </Box>
        )}
      </Box>
    </Box>
  );
}
