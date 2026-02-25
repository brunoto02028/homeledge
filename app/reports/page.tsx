import ReportsClient from './reports-client';

export const metadata = {
  title: 'Reports - HomeLedger',
  description: 'Export HMRC-ready financial reports',
};

export default function ReportsPage() {
  return <ReportsClient />;
}
