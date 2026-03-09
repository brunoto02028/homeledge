import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LeadsClient from './leads-client';

export const metadata = { title: 'Leads — Marketing Hub' };

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <LeadsClient />;
}
