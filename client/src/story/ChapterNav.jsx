import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { useStory } from './store.js';

// Where am I (Addendum B S3): a plain list of the seven chapter names at the right margin, desktop only.
// Plain words, no bar, no ticks, no numbers. The active chapter is gold and aria-current. Hidden over the footer.
const CHAPTERS = [
  { id: 'story-hero', label: 'Trail' },
  { id: 'story-performance', label: 'Performance' },
  { id: 'story-callouts', label: 'Materials' },
  { id: 'story-explode', label: 'Layers' },
  { id: 'story-endure', label: 'Endure' },
  { id: 'story-colour', label: 'Colour' },
  { id: 'story-finale', label: 'Adventure' },
];

export default function ChapterNav() {
  const active = useStory((s) => s.activeSection);
  const layout = useStory((s) => s.layout);
  const [overFooter, setOverFooter] = useState(false);

  useEffect(() => {
    const f = document.querySelector('footer');
    if (!f) return undefined;
    const io = new IntersectionObserver(([e]) => setOverFooter(e.isIntersecting), { threshold: 0.05 });
    io.observe(f);
    return () => io.disconnect();
  }, []);

  if (layout !== 'desktop') return null;
  const go = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };
  return (
    <Box
      component="nav"
      aria-label="Chapters"
      sx={{
        position: 'fixed', right: { md: 24, lg: 32 }, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0,
        opacity: overFooter ? 0 : 1, visibility: overFooter ? 'hidden' : 'visible', transition: 'opacity 180ms ease',
      }}
    >
      {CHAPTERS.map((c) => (
        <Link
          key={c.id}
          href={`#${c.id}`}
          onClick={(e) => go(e, c.id)}
          aria-current={active === c.id ? 'true' : undefined}
          underline="none"
          sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', fontSize: 14, color: active === c.id ? 'primary.main' : 'text.secondary', fontWeight: active === c.id ? 600 : 400, '&:hover': { color: 'text.primary' }, textShadow: 'none' }}
        >
          {c.label}
        </Link>
      ))}
    </Box>
  );
}
