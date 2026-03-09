import { Metadata } from 'next';
import { MonitoringDashboard } from './monitoring-client';

export const metadata: Metadata = {
  title: 'User Monitoring',
  description: 'Session recordings, screenshot alerts, and test user monitoring.',
};

export default function MonitoringPage() {
  return <MonitoringDashboard />;
}
