import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { PageBox } from '../components/Page.jsx';
import ProductPhoto from '../components/ProductPhoto.jsx';
import Swatches from '../components/Swatches.jsx';
import SizePicker from '../components/SizePicker.jsx';
import Price from '../components/Price.jsx';
import { BadgeTile } from './badges.jsx';
import { makeLine, addToCartNow } from '../lib/addToCart.js';
import { formatNPR } from '../lib/format.js';

const h2Sx = { fontSize: { xs: 'clamp(30px, 8.4vw, 76px)', sm: 'clamp(34px, 4.6vw, 76px)' } };
const Row = ({ children, reverse, id, label }) => (
  <Box component="section" id={id} aria-labelledby={label} sx={{ py: { xs: 8, md: 15 } }}>
    <PageBox sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: reverse ? 'minmax(0,5fr) minmax(0,7fr)' : 'minmax(0,7fr) minmax(0,5fr)' }, gap: { xs: 4, md: 8 }, alignItems: 'center' }}>{children}</PageBox>
  </Box>
);

// Static tier / no WebGL: no canvas. Real photos per section, all callouts listed, colour swap via photos.
export default function StaticStory({ product }) {
  const [colourKey, setColourKey] = useState('black');
  const [size, setSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  if (!product) {
    return (
      <PageBox sx={{ py: 12 }}>
        <Typography variant="display" component="h1">G10-401</Typography>
      </PageBox>
    );
  }
  const colours = product.colourways;
  const colour = colours.find((c) => c.key === colourKey) || colours[0];
  const black = colours[0];
  const callouts = product.specCallouts.filter((c) => c.stage === 'callout').sort((a, b) => a.order - b.order);
  const layers = product.specCallouts.filter((c) => c.stage === 'layer').sort((a, b) => a.order - b.order);
  const img = (c, i) => c.images?.[i] || c.images?.[0];

  const add = () => {
    if (!size) return setSizeError(true);
    addToCartNow(makeLine(product, colour, size, 1));
  };

  return (
    <Box data-static-story>
      <Row id="story-hero" label="story-hero-h">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
          <Typography variant="display" component="h1" id="story-hero-h">
            <span style={{ display: 'block' }}>G10-401</span>
            <Typography component="span" variant="price" sx={{ display: 'block', color: 'text.primary', textTransform: 'none', mt: 1.5 }}>Built for the trail.</Typography>
          </Typography>
          <Typography>Goldstar&rsquo;s trek shoe from Kathmandu. From {formatNPR(product.priceFrom)}.</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Button component={RouterLink} to="/product/g10-401" variant="contained" size="large">Shop the G10-401</Button>
            <Link component={RouterLink} to="/#story-performance" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Explore further</Link>
          </Box>
        </Box>
        <ProductPhoto image={img(black, 0)} alt={`G10-401 in ${black.name}`} eager />
      </Row>
      <Row id="story-performance" label="story-performance-h" reverse>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h2" component="h2" id="story-performance-h" sx={h2Sx}>Performance, redefined.</Typography>
          <Typography>Seven parts, each one named on Goldstar&rsquo;s own spec sheet.</Typography>
        </Box>
        <ProductPhoto image={img(black, 2)} alt={`G10-401 in ${black.name}, detail`} />
      </Row>
      <Row id="story-callouts" label="story-callouts-h">
        <ProductPhoto image={img(black, 1)} alt={`G10-401 in ${black.name}, side view`} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h2" component="h2" id="story-callouts-h" sx={h2Sx}>What it&rsquo;s made of</Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {callouts.map((c) => (
              <li key={c.key}>
                <Typography variant="h5" component="h3">{c.title}</Typography>
                <Typography>{c.body}</Typography>
              </li>
            ))}
          </Box>
        </Box>
      </Row>
      <Row id="story-explode" label="story-explode-h" reverse>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h2" component="h2" id="story-explode-h" sx={h2Sx}>From the footbed down</Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {layers.map((c) => (
              <Box component="li" key={c.key} sx={{ display: 'flex', gap: 2 }}>
                <BadgeTile badge={c.badge} />
                <Box>
                  <Typography variant="h5" component="h3">{c.title}</Typography>
                  <Typography>{c.body}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <ProductPhoto image={img(black, 3)} alt={`G10-401 in ${black.name}, sole`} />
      </Row>
      <Row id="story-endure" label="story-endure-h">
        <ProductPhoto image={img(colours[1] || black, 1)} alt="G10-401, profile" />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h2" component="h2" id="story-endure-h" sx={h2Sx}>Designed to endure.</Typography>
          <Typography>Rubber underfoot, EVA in between, metal at the laces.</Typography>
        </Box>
      </Row>
      <Row id="story-colour" label="story-colour-h" reverse>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h2" component="h2" id="story-colour-h" sx={h2Sx}>Pick your colour</Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
            <Price variant="price" price={colour.price} regularPrice={colour.regularPrice} component="p" />
            <Typography aria-live="polite">{colour.name}{colour.nameNe ? <> &middot; <span lang="ne" style={{ fontFamily: 'Mukta' }}>{colour.nameNe}</span></> : null}</Typography>
          </Box>
          <Swatches colourways={colours} value={colour.key} onChange={(k) => { setColourKey(k); setSize(null); setSizeError(false); }} />
          <SizePicker sizes={colour.sizes} value={size} onChange={(v) => { setSize(v); if (v) setSizeError(false); }} error={sizeError} id="static-size" />
          <Box><Button variant="contained" size="large" onClick={add}>Add to cart</Button></Box>
          <Typography variant="caption" color="text.secondary">Photos: the real G10-401. 3D: a stand-in sneaker.</Typography>
        </Box>
        <ProductPhoto image={img(colour, 0)} alt={`G10-401 in ${colour.name}`} />
      </Row>
      <Box component="section" id="story-finale" aria-labelledby="story-finale-h" sx={{ py: { xs: 10, md: 20 } }}>
        <PageBox sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3 }}>
          <Typography variant="h2" component="h2" id="story-finale-h" sx={h2Sx}>Your adventure begins now.</Typography>
          <Typography>Order today and pay in cash when it arrives.</Typography>
          <Button component={RouterLink} to="/shop" variant="contained" size="large">Shop all</Button>
        </PageBox>
      </Box>
    </Box>
  );
}
