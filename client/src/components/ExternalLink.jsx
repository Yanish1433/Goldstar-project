import Link from '@mui/material/Link';
import { ArrowUpRight } from 'lucide-react';

// External links to goldstarshoes.com: a quiet underline in the link colour that firms up on hover.
export default function ExternalLink({ href, children, sx, ...rest }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      underline="always"
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5, minHeight: 44,
        textDecorationColor: 'color-mix(in srgb, currentColor 45%, transparent)', textDecorationThickness: '2px', textUnderlineOffset: '6px',
        '&:hover': { textDecorationColor: 'currentColor' },
        ...sx,
      }}
      {...rest}
    >
      {children}
      <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
