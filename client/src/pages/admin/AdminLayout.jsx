import { NavLink, Outlet } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { PageBox, useTitle } from '../../components/Page.jsx';

const links = [
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/products', label: 'Products' },
];

export function Component() {
  return <AdminLayout />;
}

export default function AdminLayout() {
  useTitle('Admin');
  return (
    <PageBox sx={{ py: { xs: 3, md: 6 }, display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '232px minmax(0,1fr)' }, gap: { xs: 3, md: 6 }, alignItems: 'start' }}>
      <Box component="nav" aria-label="Admin" sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: 'wrap', gap: 0.5, alignItems: { xs: 'center', md: 'stretch' }, position: { md: 'sticky' }, top: { md: 'calc(var(--appbar-h, 64px) + 24px)' } }}>
        {links.map((l) => (
          <Button key={l.to} component={NavLink} to={l.to} sx={{ color: 'text.primary', justifyContent: 'flex-start', '&.active': { color: 'primary.main', backgroundColor: 'background.paper' } }}>
            {l.label}
          </Button>
        ))}
        <Button component={NavLink} to="/" sx={{ color: 'text.secondary', justifyContent: 'flex-start' }}>View site</Button>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Outlet />
      </Box>
    </PageBox>
  );
}
