import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Sparkle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { store, DISPLAY } from '../theme/storeTokens.js';
import { SHORT } from '../landing-v2/tokensV2.js';

// Shared frame for Login / Register: a royal-blue brand panel (desktop: big headline + boot photo; phone: a compact
// header) beside a white form card. The photo is decorative (alt="") and not shown on phones.
export const authFormSx = {
  display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: `${store.radius.md}px`, backgroundColor: store.cream, color: store.navy,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: store.lineStrong, borderWidth: 1.5 },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: store.blue },
    '&.Mui-focused': { backgroundColor: '#FFFFFF', boxShadow: '0 0 0 3px rgba(42,39,233,0.16)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: store.blue, borderWidth: 2 },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: store.error, borderWidth: 2 },
  },
  '& input:-webkit-autofill': { WebkitBoxShadow: `0 0 0 100px ${store.cream} inset`, WebkitTextFillColor: store.navy, caretColor: store.navy, borderRadius: 'inherit' },
  '& .MuiInputLabel-root': { color: store.ink2, '&.Mui-focused': { color: store.blue }, '&.Mui-error': { color: store.error } },
  '& .MuiFormHelperText-root': { color: store.ink2, '&.Mui-error': { color: store.error, fontWeight: 600 }, '&.Mui-error::before': { content: '"\\26A0\\00a0"' } },
  '& .MuiAlert-root': { borderRadius: `${store.radius.md}px` },
  '& .MuiIconButton-root': { width: 44, height: 44 },
  '& .MuiButton-contained': {
    minHeight: 54, backgroundColor: store.blue, color: '#FFFFFF', fontWeight: 800, fontSize: 16,
    '&:hover': { backgroundColor: store.blueDeep }, '&:focus-visible': { outline: `2px solid ${store.blue}`, outlineOffset: 3 },
  },
  '& a': { color: store.blue, fontWeight: 700, textUnderlineOffset: '3px', '&:focus-visible': { outline: `2px solid ${store.blue}`, outlineOffset: 3, borderRadius: 4 } },
};

export default function AuthShell({ eyebrow, headline, title, intro, children }) {
  const reduced = useReducedMotion();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }, minHeight: { md: 'calc(100svh - var(--appbar-h, 64px))' }, backgroundColor: store.ground }}>
      <Box
        component="aside"
        sx={{
          position: 'relative', overflow: 'hidden', backgroundColor: store.blue, color: '#FFFFFF',
          m: { xs: 1, md: 1.5 }, mr: { md: 0 }, borderRadius: { xs: `${store.radius.lg}px`, md: `${store.radius.xl}px` },
          px: { xs: 2.5, md: 6 }, py: { xs: 2.5, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: { md: 'space-between' }, gap: 2,
          // Phones: a compact blue header (the form is the job). Landscape: a slim strip.
          '@media (max-width:599.95px)': { py: 2, px: 2.25 },
          [SHORT]: { m: 1, py: 1.25, px: 'max(20px, env(safe-area-inset-left))', borderRadius: `${store.radius.lg}px` },
          '&::after': { content: '""', position: 'absolute', right: -120, bottom: -140, width: 420, height: 420, borderRadius: '50%', backgroundColor: store.blueDeep, opacity: 0.5, pointerEvents: 'none', display: { xs: 'none', md: 'block' } },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography component="p" variant="overline" sx={{ m: 0, color: store.sand, display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Sparkle size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" /> {eyebrow}
          </Typography>
          <Typography component="p" aria-hidden="true" sx={{ m: 0, mt: { xs: 0.5, md: 2 }, ...DISPLAY, color: '#FFFFFF', fontSize: { xs: 'clamp(28px, 9vw, 36px)', md: 'clamp(48px, 5.4vw, 88px)' }, [SHORT]: { fontSize: 'clamp(22px, 7svh, 30px)', mt: 0.25 } }}>
            {headline}
          </Typography>
        </Box>
        <Box
          aria-hidden="true"
          sx={{ position: 'relative', zIndex: 1, display: { xs: 'none', md: 'block' }, [SHORT]: { display: 'none' }, alignSelf: 'center', width: 'min(100%, 380px)', aspectRatio: '1 / 1', borderRadius: '50%', backgroundColor: store.cream, overflow: 'hidden', boxShadow: '0 30px 60px rgba(11,26,72,0.35)' }}
        >
          <Box component="img" src="/img/hero/boot-desktop.webp" alt="" loading="lazy" decoding="async" width={380} height={380} sx={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
        </Box>
        <Box sx={{ position: 'absolute', zIndex: 0, top: 28, right: 32, display: { xs: 'none', md: 'block' }, [SHORT]: { display: 'none' }, color: store.sand }} aria-hidden="true">
          <Sparkle size={56} fill="currentColor" strokeWidth={0} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'center', px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
        <Box
          component={motion.div}
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          sx={{ width: '100%', maxWidth: 460, backgroundColor: '#FFFFFF', borderRadius: `${store.radius.lg}px`, p: { xs: 0, md: 4 }, boxShadow: { md: `0 0 0 1px ${store.line}, ${store.shadowCard}` } }}
        >
          <Typography component="h1" sx={{ m: 0, mb: 0.75, ...DISPLAY, fontSize: { xs: 28, md: 34 }, color: store.navy, textTransform: 'none', letterSpacing: '-0.015em', lineHeight: 1.05 }}>{title}</Typography>
          <Typography sx={{ color: store.ink2, mb: 3, fontSize: 16, lineHeight: 1.45 }}>{intro}</Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
