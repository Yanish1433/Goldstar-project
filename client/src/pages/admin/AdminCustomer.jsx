import { Panel, useAdminPage } from './kit.jsx';

export function Component() {
  return <AdminCustomer />;
}

export default function AdminCustomer() {
  useAdminPage('Customer');
  return <Panel>Coming next.</Panel>;
}
