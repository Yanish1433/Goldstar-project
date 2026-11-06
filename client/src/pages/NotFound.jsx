import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { PageBox, useTitle } from '../components/Page.jsx';

export default function NotFound() {
  useTitle('Page not found');
  return (
    <PageBox sx={{ py: { xs: 10, md: 20 }, minHeight: '50vh' }}>
      <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        <Typography variant="h3" component="h1">Page not found</Typography>
        <Typography color="text.secondary">That page does not exist, or you do not have access to it.</Typography>
        <Button component={RouterLink} to="/" variant="contained">Back to home</Button>
      </Box>
    </PageBox>
  );
}
