import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Shield, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { tokensV2, DISPLAY_HEADING, FOCUS_RING } from './tokensV2.js';
import { useCart } from '../store/cart.js';
import { useUi } from '../store/ui.js';
import { WIDE } from '../theme/tokens.js';

const GEAR_ITEMS = [
  {
    id: 'himal-jacket',
    name: 'Himal Insulated Jacket',
    tagline: 'Durable · Warm · Windproof',
    desc: 'Engineered for freezing high-altitude mountain winds with ripstop weather barrier, thermal loft padding, and authentic Nepal Flag sleeve insignia.',
    image: '/v2/gear-jacket.jpg',
    price: 4500,
    regularPrice: 5200,
    specs: ['Windproof ripstop outer shell', 'Thermal synthetic loft fill', 'Storm-sealed zippers', 'Interior map pocket'],
  },
  {
    id: 'summit-rucksack',
    name: 'Summit Rucksack (65L)',
    tagline: 'All-Terrain · Hydration-Compatible',
    desc: 'Heavy-duty 65L alpine expedition backpack equipped with ergonomic load-bearing lumbar support, trekking pole attachments, and waterproof rain hood.',
    image: '/v2/gear-rucksack.jpg',
    price: 5200,
    regularPrice: 5900,
    specs: ['65-Liter expedition volume', 'Hydration bladder sleeve', 'Padded contoured harness', 'Abrasion-resistant bottom'],
  },
  {
    id: 'adventure-pants',
    name: 'Adventure Cargo Pants',
    tagline: 'Rugged · Water-Resistant · Articulated',
    desc: 'High-durability trail climbing pants with water-repellent DWR coating, 4-way stretch gusset, reinforced knee patches, and tactical gear pockets.',
    image: '/v2/gear-pants.jpg',
    price: 2800,
    regularPrice: 3200,
    specs: ['DWR water-repellent finish', 'Articulated knee mobility', '6 zippered tactical pockets', 'Reinforced inner cuffs'],
  },
  {
    id: 'everest-boot',
    name: 'Everest Hiking Boot (G10)',
    tagline: 'All-Condition · Waterproof · Supportive',
    desc: 'Flagship mid-cut mountaineering boot built with Goldstar’s signature diamond lug vulcanized rubber outsole, metal eyelets, and EVA shock damping.',
    image: '/v2/gear-boot.jpg',
    price: 3400,
    regularPrice: 3800,
    specs: ['Deep lug vulcanized rubber sole', 'High-density EVA impact midsole', 'Rust-resistant alloy eyelets', 'Waterproof membrane lining'],
  },
];

export default function GearCollectionV2() {
  const addToCart = useCart((s) => s.add);
  const showSnackbar = useUi((s) => s.showSnackbar);
  const openCart = useUi((s) => s.openCart);

  const handleAddGear = (gear) => {
    addToCart({
      productId: gear.id,
      name: gear.name,
      colourwayKey: 'trek-green',
      colourName: 'Himalayan Edition',
      size: 'Standard',
      unitPrice: gear.price,
      image: { src: gear.image },
      qty: 1,
    });
    showSnackbar({
      message: `Added ${gear.name} to bag!`,
      actionLabel: 'View Bag',
      onAction: () => openCart(),
    });
  };

  return (
    <Box
      id="trek-gear"
      component="section"
      aria-labelledby="gear-heading"
      sx={{
        py: { xs: 8, md: 14 },
        backgroundColor: '#0B0F14',
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 2,
            mb: { xs: 4, md: 6 },
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: tokensV2.gold,
                mb: 1,
              }}
            >
              <Shield size={15} />
              Goldstar Trek Collection · Complete Expedition Kit
            </Box>
            <Typography
              component="h2"
              id="gear-heading"
              sx={{
                ...DISPLAY_HEADING,
                fontSize: { xs: 'clamp(32px, 8vw, 44px)', md: 'clamp(42px, 4vw, 56px)' },
                m: 0,
                color: '#FFFFFF',
              }}
            >
              Equipped For the Himalayas.
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontSize: { xs: 15, md: 17 },
                color: 'rgba(255, 255, 255, 0.75)',
                maxWidth: '54ch',
              }}
            >
              Pair your Goldstar trek boots with authentic alpine insulated jackets, expedition rucksacks, and adventure pants. Built rugged for extreme weather.
            </Typography>
          </Box>
        </Box>

        {/* 4 Gear Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3,
          }}
        >
          {GEAR_ITEMS.map((gear) => (
            <Box
              key={gear.id}
              sx={{
                backgroundColor: 'rgba(20, 24, 30, 0.88)',
                backdropFilter: 'blur(16px)',
                borderRadius: '24px',
                p: 2.5,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 260ms ease, border-color 200ms ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  borderColor: tokensV2.gold,
                  '& img': {
                    transform: 'scale(1.06)',
                  },
                },
              }}
            >
              <Box>
                {/* Photo Stage */}
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: '18px',
                    backgroundColor: '#FFFFFF',
                    p: 2,
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={gear.image}
                    alt={gear.name}
                    loading="lazy"
                    decoding="async"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transition: 'transform 360ms ease',
                    }}
                  />
                </Box>

                {/* Details */}
                <Box sx={{ mt: 2 }}>
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: 18,
                      fontWeight: 800,
                      ...WIDE,
                      color: '#FFFFFF',
                      m: 0,
                    }}
                  >
                    {gear.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: tokensV2.gold, fontWeight: 700, mt: 0.25 }}>
                    {gear.tagline}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', mt: 1, lineHeight: 1.5 }}>
                    {gear.desc}
                  </Typography>

                  {/* Specs List */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1.5 }}>
                    {gear.specs.slice(0, 3).map((s) => (
                      <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                        <Check size={12} color={tokensV2.gold} />
                        <span>{s}</span>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* Price & Action */}
              <Box sx={{ mt: 2.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ fontSize: 18, fontWeight: 900, ...WIDE, color: tokensV2.gold }}>
                    NPR {gear.price.toLocaleString()}
                  </Box>
                  <Box component="s" sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    NPR {gear.regularPrice.toLocaleString()}
                  </Box>
                </Box>

                <Box
                  component="button"
                  type="button"
                  onClick={() => handleAddGear(gear)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    minHeight: 40,
                    px: 2,
                    borderRadius: '999px',
                    backgroundColor: tokensV2.blue,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                    '&:hover': {
                      backgroundColor: tokensV2.blueHover,
                      transform: 'scale(1.04)',
                    },
                    ...FOCUS_RING,
                  }}
                >
                  <ShoppingBag size={14} />
                  Add
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
