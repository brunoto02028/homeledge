import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SocialSchedulerClient from './social-scheduler-client';

export const metadata = { title: 'Social Scheduler — Marketing Hub' };

export default async function SchedulerPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <SocialSchedulerClient />;
}
