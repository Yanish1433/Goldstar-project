import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Star, CheckCircle, Quote, ThumbsUp } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING } from './tokensV2.js';
import { WIDE } from '../theme/tokens.js';

const REVIEWS = [
  {
    name: 'Bikash Shrestha',
    location: 'Pokhara, Kaski',
    shoe: 'G10-401 Trek Edition',
    rating: 5,
    title: 'Flawless grip on Mardi Himal trek!',
    body: 'Took these straight up to Mardi High Camp through wet mud and freezing scree. Zero blisters, insane traction on the rubber lugs, and they dried super fast. Best value trek shoes in Nepal.',
    verified: 'Verified Trekker Purchase',
    date: 'February 2026',
  },
  {
    name: 'Pooja Thapa',
    location: 'Lalitpur, Patan',
    shoe: 'AX-1/A City Stride (Coffee)',
    rating: 5,
    title: 'Looks like high-end designer suede, lasts forever',
    body: 'The synthetic suede feels plush and premium. I wear them to university and coffee shops every day. Everyone asks where I got them — so proud to say they are authentic Goldstars!',
    verified: 'Verified Buyer',
    date: 'January 2026',
  },
  {
    name: 'Suman Gurung',
    location: 'Dharan, Sunsari',
    shoe: 'AX Classic Retro (Grey)',
    rating: 5,
    title: 'Delivered in 2 days, paid COD at doorstep',
    body: 'Seamless order experience! The courier called before delivery, I checked the shoes right in front of him, and paid cash. The size 9 fit true to size. Super lightweight and comfortable.',
    verified: 'Verified Buyer',
    date: 'March 2026',
  },
];

export default function ReviewsV2() {
  return (
    <Box
      component="section"
      aria-labelledby="reviews-heading"
      sx={{
        py: { xs: 8, md: 14 },
        backgroundColor: tokensV2.white,
        color: tokensV2.ink,
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, sm: 4, lg: 6 },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: '680px',
            mx: 'auto',
            mb: { xs: 5, md: 7 },
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 2,
              py: 0.5,
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 184, 0, 0.15)',
              color: tokensV2.ink,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              mb: 1.5,
            }}
          >
            <Star size={14} fill={tokensV2.gold} color={tokensV2.gold} />
            Rated 4.9/5 by 3,450+ Nepali Walkers
          </Box>

          <Typography
            component="h2"
            id="reviews-heading"
            sx={{
              ...DISPLAY_HEADING,
              fontSize: { xs: 'clamp(32px, 8vw, 44px)', md: 'clamp(42px, 4vw, 56px)' },
              m: 0,
            }}
          >
            Tested on the Trails. Loved in the City.
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              fontSize: { xs: 15, md: 17 },
              color: tokensV2.inkSecondary,
              lineHeight: 1.6,
            }}
          >
            Real feedback from customers across all 77 districts who trust Goldstar every single day.
          </Typography>
        </Box>

        {/* Review Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {REVIEWS.map((rev) => (
            <Box
              key={rev.name}
              component="article"
              sx={{
                p: { xs: 3, sm: 3.5 },
                borderRadius: '24px',
                backgroundColor: tokensV2.cream,
                border: '1px solid rgba(20,18,14,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: tokensV2.shadowCard,
                transition: 'transform 240ms ease, box-shadow 240ms ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: tokensV2.shadowElevated,
                },
              }}
            >
              <Box>
                {/* Rating Stars & Shoe Tag */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {Array.from({ length: rev.rating }, (_, i) => (
                      <Star key={i} size={16} fill={tokensV2.gold} color={tokensV2.gold} />
                    ))}
                  </Box>
                  <Box
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: tokensV2.inkMuted,
                      textTransform: 'uppercase',
                    }}
                  >
                    {rev.date}
                  </Box>
                </Box>

                <Typography
                  component="h3"
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    ...WIDE,
                    m: 0,
                    mb: 1,
                  }}
                >
                  "{rev.title}"
                </Typography>

                <Typography
                  sx={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: tokensV2.inkSecondary,
                    m: 0,
                  }}
                >
                  {rev.body}
                </Typography>
              </Box>

              {/* Author & Verification Footer */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(20,18,14,0.08)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Box sx={{ fontSize: 15, fontWeight: 800, color: tokensV2.ink }}>
                      {rev.name}
                    </Box>
                    <Box sx={{ fontSize: 12, color: tokensV2.inkMuted }}>
                      {rev.location} · <strong style={{ color: tokensV2.blue }}>{rev.shoe}</strong>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#0F7A4F',
                    }}
                  >
                    <CheckCircle size={14} />
                    Verified
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
