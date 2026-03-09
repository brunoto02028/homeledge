import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AnalyticsClient from './analytics-client';

export const metadata = { title: 'Analytics — Marketing Hub' };

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <AnalyticsClient />;
}
