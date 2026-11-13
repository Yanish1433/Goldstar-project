import Box from '@mui/material/Box';
import { Truck, ShieldCheck, Mountain, RefreshCw, PhoneCall } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING } from './tokensV2.js';

const PERKS = [
  { icon: Truck, label: 'Cash on Delivery Across Nepal', sub: 'Pay upon doorstep arrival' },
  { icon: Mountain, label: 'Trail Tested in Himalayas', sub: 'Annapurna & Everest proven' },
  { icon: ShieldCheck, label: '100% Genuine Goldstar', sub: 'Handcrafted in Balaju factory' },
  { icon: RefreshCw, label: '7-Day Easy Size Exchange', sub: 'Hassle-free replacement' },
  { icon: PhoneCall, label: 'Order Hotline: +977-9801235097', sub: 'Direct customer support' },
];

const REDUCED = '@media (prefers-reduced-motion: reduce)';

export default function TrustTickerV2() {
  return (
    <Box
      component="aside"
      role="region"
      aria-label="Goldstar promises and guarantees"
      sx={{
        position: 'relative',
        backgroundColor: tokensV2.ink,
        color: '#FFFFFF',
        py: { xs: 1.75, md: 2 },
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: 'max-content',
          gap: { xs: 4, md: 7 },
          animation: 'gsMarquee 38s linear infinite',
          willChange: 'transform',
          '@keyframes gsMarquee': {
            from: { transform: 'translateX(0)' },
            to: { transform: 'translateX(calc(-50% - 14px))' },
          },
          '&:hover, &:focus-within': {
            animationPlayState: 'paused',
          },
          [REDUCED]: {
            animation: 'none',
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%',
            px: 2,
            gap: 2.5,
          },
        }}
      >
        {[0, 1].map((copyIndex) => (
          <Box
            key={copyIndex}
            component="ul"
            aria-hidden={copyIndex === 1 ? 'true' : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 4, md: 7 },
              m: 0,
              p: 0,
              listStyle: 'none',
              [REDUCED]: copyIndex === 1 ? { display: 'none' } : undefined,
            }}
          >
            {PERKS.map(({ icon: Icon, label, sub }) => (
              <Box
                key={label}
                component="li"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  whiteSpace: 'nowrap',
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 184, 0, 0.15)',
                    color: tokensV2.gold,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
                </Box>
                <Box>
                  <Box
                    component="span"
                    sx={{
                      display: 'block',
                      fontSize: { xs: 13, md: 14 },
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: '#FFFFFF',
                      ...DISPLAY_HEADING,
                    }}
                  >
                    {label}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {sub}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
