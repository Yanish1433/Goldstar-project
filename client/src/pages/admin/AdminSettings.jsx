import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import { useAdmin } from '../../store/admin.js';
import { useMe } from '../../api/hooks.js';
import { DefList, Panel, useAdminPage } from './kit.jsx';

export function Component() {
  return <AdminSettings />;
}

// Settings is a light placeholder for the pitch: the store facts are read-only, appearance is live.
export default function AdminSettings() {
  useAdminPage('Settings');
  const mode = useAdmin((s) => s.mode);
  const toggleMode = useAdmin((s) => s.toggleMode);
  const collapsed = useAdmin((s) => s.collapsed);
  const toggleCollapsed = useAdmin((s) => s.toggleCollapsed);
  const me = useMe().data;
  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'repeat(2, minmax(0,1fr))' }, alignItems: 'start' }}>
      <Panel title="Store">
        <DefList rows={[
          ['Store name', 'Goldstar Shoes'],
          ['Currency', 'Nepalese rupee (NPR)'],
          ['Payment', 'Cash on delivery'],
          ['Delivery', 'Fee confirmed by phone'],
          ['Time zone', 'Asia/Kathmandu (UTC+05:45)'],
        ]} />
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2, mt: 2 })}>Store details are managed by Goldstar. Contact support to change them.</Typography>
      </Panel>
      <Panel title="Appearance">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel control={<Switch checked={mode === 'dark'} onChange={toggleMode} />} label="Dark theme" />
          <FormControlLabel control={<Switch checked={collapsed} onChange={toggleCollapsed} />} label="Compact sidebar (desktop)" />
        </Box>
      </Panel>
      <Panel title="Your account">
        <DefList rows={[['Name', me?.name], ['Email', me?.email], ['Role', <Chip key="r" size="small" label="Administrator" />]]} />
      </Panel>
      <Panel title="Notifications">
        <Typography variant="body2" sx={(th) => ({ color: th.admin.ink2 })}>Email alerts for new orders are coming soon.</Typography>
      </Panel>
    </Box>
  );
}
