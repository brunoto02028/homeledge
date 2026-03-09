import ReportsClient from './reports-client';

export const metadata = {
  title: 'Reports - Clarity & Co',
  description: 'Export HMRC-ready financial reports',
};

export default function ReportsPage() {
  return <ReportsClient />;
}
