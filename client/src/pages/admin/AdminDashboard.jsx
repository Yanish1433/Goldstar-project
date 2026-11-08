import { Panel, useAdminPage } from './kit.jsx';

export function Component() {
  return <AdminDashboard />;
}

export default function AdminDashboard() {
  useAdminPage('Dashboard');
  return <Panel>Coming next.</Panel>;
}
