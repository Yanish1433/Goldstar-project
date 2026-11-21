import Box from '@mui/material/Box';

// The Goldstar Shoes wordmark from goldstarshoes.com (navy, transparent), plus a white knockout of the same artwork
// for the dark bands. Two crops of the same pixels:
//   'full'  960 x 115: "GoldStar®" and the smaller "Shoes" (footer, wide grounds)
//   'mark'  774 x 115: "GoldStar®" only (the AppBar, where the full lockup would crowd the menu and cart)
// Width follows the height through the intrinsic ratio, so nothing shifts when the image decodes.
// tone: 'navy' | 'white' | 'current' ('current' paints the same shape in the surrounding text colour with a CSS mask).
export const LOGO_SIZES = { full: [960, 115], mark: [774, 115] };
export const LOGO_RATIO = LOGO_SIZES.full[0] / LOGO_SIZES.full[1];
export const MARK_RATIO = LOGO_SIZES.mark[0] / LOGO_SIZES.mark[1];

const FILES = {
  full: { navy: '/brand/goldstar-logo.webp', white: '/brand/goldstar-logo-white.webp' },
  mark: { navy: '/brand/goldstar-mark.webp', white: '/brand/goldstar-mark-white.webp' },
};

export default function Logo({ tone = 'navy', variant = 'full', alt = 'Goldstar Shoes', className, sx, eager = true }) {
  const [w, h] = LOGO_SIZES[variant] || LOGO_SIZES.full;
  // maxWidth can squeeze the box narrower than height x ratio (a narrow footer column at 932px): the artwork is then
  // contained, left-aligned, never stretched.
  const base = { display: 'block', width: 'auto', height: 24, maxWidth: '100%', aspectRatio: `${w / h}` };
  if (tone === 'current') {
    return (
      <Box
        className={className}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        sx={{
          ...base,
          backgroundColor: 'currentColor',
          WebkitMaskImage: `url(${FILES[variant].navy})`,
          maskImage: `url(${FILES[variant].navy})`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskPosition: 'left center',
          maskPosition: 'left center',
          ...sx,
        }}
      />
    );
  }
  return (
    <Box
      component="img"
      className={className}
      src={FILES[variant][tone === 'white' ? 'white' : 'navy']}
      alt={alt}
      width={w}
      height={h}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      sx={{ ...base, objectFit: 'contain', objectPosition: 'left center', ...sx }}
    />
  );
}
