import { Link as RouterLink } from 'react-router';
import Button from '@mui/material/Button';
import { SearchX } from 'lucide-react';
import { EmptyState, Panel, useAdminPage } from './kit.jsx';

export function Component() {
  return <AdminNotFound />;
}

export default function AdminNotFound({ what = 'page' }) {
  useAdminPage('Not found');
  return (
    <Panel>
      <EmptyState icon={SearchX} title={`This ${what} does not exist`} body="It may have been removed, or the link is wrong." action={<Button component={RouterLink} to="/admin" variant="contained">Back to dashboard</Button>} />
    </Panel>
  );
}
