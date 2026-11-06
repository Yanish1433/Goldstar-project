import Link from '@mui/material/Link';
import { ArrowUpRight } from 'lucide-react';
import { tokens } from '../theme/tokens.js';

// External links to goldstarshoes.com carry the Goldstar-blue 2px underline (SPEC 5.1).
export default function ExternalLink({ href, children, sx, ...rest }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      underline="always"
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5, minHeight: 44,
        textDecorationColor: tokens.blue, textDecorationThickness: '2px', textUnderlineOffset: '6px',
        '&:hover': { textDecorationColor: tokens.blueLight },
        ...sx,
      }}
      {...rest}
    >
      {children}
      <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
