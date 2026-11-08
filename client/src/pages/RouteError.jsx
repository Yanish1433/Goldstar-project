import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { SITE_TITLE } from '../components/Page.jsx';

// Last-resort page for an unexpected error anywhere under the root route (instead of the router's developer screen).
export default function RouteError() {
  if (typeof document !== 'undefined') document.title = SITE_TITLE;
  return (
    <Box component="main" sx={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 3, px: { xs: 2, sm: 4 }, maxWidth: 720, mx: 'auto' }}>
      <Typography component="p" sx={{ fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 13, color: 'primary.main' }}>Goldstar</Typography>
      <Typography variant="h3" component="h1">That page didn’t load.</Typography>
      <Typography color="text.secondary">Check your connection and try again.</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => window.location.reload()}>Try again</Button>
        <Button variant="outlined" href="/">Go to the home page</Button>
      </Box>
    </Box>
  );
}
