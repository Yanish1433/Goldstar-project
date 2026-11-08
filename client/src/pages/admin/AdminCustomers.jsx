import { Panel, useAdminPage } from './kit.jsx';

export function Component() {
  return <AdminCustomers />;
}

export default function AdminCustomers() {
  useAdminPage('Customers');
  return <Panel>Coming next.</Panel>;
}
