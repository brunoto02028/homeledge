import { Metadata } from 'next';
import { AnalyticsDashboard } from './analytics-client';

export const metadata: Metadata = {
  title: 'Site Analytics',
  description: 'Visitor analytics, heatmaps, and behavior tracking.',
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
