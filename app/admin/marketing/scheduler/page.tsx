import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SocialSchedulerClient from './social-scheduler-client';

export const metadata = { title: 'Social Scheduler — Clarity & Co' };

export default async function SchedulerPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <SocialSchedulerClient />;
}
