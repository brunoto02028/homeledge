import { Metadata } from 'next';
import { AccountantDashboard } from './accountant-client';

export const metadata: Metadata = {
  title: 'Accountant Dashboard | HomeLedger',
  description: 'Manage your clients and view their financial data',
};

export default function AccountantPage() {
  return <AccountantDashboard />;
}
