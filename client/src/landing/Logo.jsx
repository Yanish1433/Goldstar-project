import Box from '@mui/material/Box';

// The Goldstar Shoes wordmark from goldstarshoes.com (navy, transparent), plus a white knockout of the same artwork
// for the dark bands. 960 x 115 webp (~24 KB / ~12 KB). Width follows the height through the intrinsic ratio.
export const LOGO_RATIO = 960 / 115;

export default function Logo({ tone = 'navy', alt = 'Goldstar Shoes', sx, eager = true }) {
  return (
    <Box
      component="img"
      src={tone === 'white' ? '/brand/goldstar-logo-white.webp' : '/brand/goldstar-logo.webp'}
      alt={alt}
      width={960}
      height={115}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      sx={{ display: 'block', width: 'auto', height: 24, maxWidth: '100%', aspectRatio: `${LOGO_RATIO}`, ...sx }}
    />
  );
}
