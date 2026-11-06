import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { PageBox } from './Page.jsx';
import Reveal from './Reveal.jsx';
import ExternalLink from './ExternalLink.jsx';
import { CONCEPT_NOTE } from '../theme/tokens.js';
import { SHOE } from '../three/shoe.config.js';

export default function Footer() {
  const c = SHOE.credit;
  return (
    <Box component="footer" sx={{ position: 'relative', zIndex: 1, backgroundColor: 'background.default', pt: { xs: 6, md: 10 }, pb: 4, overflow: 'hidden' }}>
      <PageBox sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ order: 2, mt: { xs: 4, md: 5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: { xs: 6, md: 8 } }}>
          <Reveal component="nav" aria-label="Footer" delay={0.07} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
            <Link component={RouterLink} to="/shop" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Shop all</Link>
            <Link component={RouterLink} to="/#story-callouts" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Technology</Link>
            <ExternalLink href="https://goldstarshoes.com/about/">About Goldstar</ExternalLink>
            <ExternalLink href="https://goldstarshoes.com/stores/">Stores</ExternalLink>
          </Reveal>
          <Reveal id="credits" delay={0.14} sx={{ scrollMarginTop: 160, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '62ch' }}>
            <Typography variant="body1" color="text.primary">
              3D shoe: &lsquo;{c.title}&rsquo; &copy; {c.year} {c.author}, licensed{' '}
              <Link href={c.licenceUrl} target="_blank" rel="noopener noreferrer">{c.licence}</Link>, from the{' '}
              <Link href={c.source} target="_blank" rel="noopener noreferrer">Khronos glTF Sample Assets</Link>. Recoloured and compressed. Logos and trademarks excluded. The 3D model is a stand-in sneaker, not the Goldstar G10-401.
            </Typography>
            <Typography variant="body1" color="text.primary">Product names, photos and prices: goldstarshoes.com public store data, shown for a pitch.</Typography>
            <Typography variant="body1" color="text.primary">Fonts: Archivo and Mukta, SIL Open Font License.</Typography>
            <Typography variant="body1" color="text.secondary">{CONCEPT_NOTE} Demo build, November 2026.</Typography>
          </Reveal>
        </Box>
          <Reveal role="img" aria-label="Goldstar" sx={{ order: 1, position: 'relative', lineHeight: 0.9 }}>
          <Typography
            aria-hidden="true"
            lang="ne"
            component="div"
            sx={{ fontFamily: 'Mukta', fontWeight: 600, color: 'primary.main', fontSize: 'calc((100vw - 32px) / 3.5)', lineHeight: 0.95, whiteSpace: 'nowrap', letterSpacing: 0, maxWidth: '100%', overflow: 'hidden', '@media (min-width:600px)': { fontSize: 'calc((100vw - 48px) / 3.5)' }, '@media (min-width:1200px)': { fontSize: 'calc((100vw - 64px) / 3.5)' }, '@media (min-width:1440px)': { fontSize: 393 } }}
          >
            गोल्डस्टार
          </Typography>
        </Reveal>
      </PageBox>
    </Box>
  );
}
