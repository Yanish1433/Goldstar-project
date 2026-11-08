import Box from '@mui/material/Box';
import { tokens } from '../theme/tokens.js';

// A lit plinth: studio shots (white backgrounds) are multiplied onto the warm tile (SPEC 5.5).
export default function ProductPhoto({ image, alt, eager = false, sizes = '(min-width:1200px) 33vw, 50vw', hoverImage, sx, imgSx, onClick, fit = 'contain' }) {
  if (!image) return <Box sx={{ aspectRatio: '1 / 1', backgroundColor: tokens.tile, ...sx }} />;
  const src = image.src;
  const thumb = image.thumb || image.src;
  return (
    <Box
      className="photo"
      onClick={onClick}
      sx={{
        position: 'relative', aspectRatio: '1 / 1', backgroundColor: tokens.tile, overflow: 'hidden', width: '100%',
        '& img': { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, mixBlendMode: 'multiply',
          // Lifts the near-white studio backdrops of some catalogue shots to white, so they vanish into the tile.
          filter: 'brightness(1.045) contrast(1.04)', transition: 'opacity 240ms cubic-bezier(0.22,1,0.36,1), transform 400ms cubic-bezier(0.22,1,0.36,1)' },
        // Hidden until the card's hover rule reveals it (a stylesheet rule: an inline opacity could never be overridden).
        '& .photo-alt': { opacity: 0 },
        ...sx,
      }}
    >
      <img
        src={thumb}
        srcSet={image.thumb && image.src !== image.thumb ? `${thumb} 800w, ${src} 1600w` : undefined}
        sizes={sizes}
        alt={alt ?? image.alt ?? ''}
        width={800}
        height={800}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        style={imgSx}
      />
      {hoverImage ? (
        <img className="photo-alt" src={hoverImage.thumb || hoverImage.src} alt="" width={800} height={800} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : null}
    </Box>
  );
}
