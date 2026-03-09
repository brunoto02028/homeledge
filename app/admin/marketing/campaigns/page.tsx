import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CampaignsClient from './campaigns-client';

export const metadata = { title: 'Email Campaigns — Marketing Hub' };

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <CampaignsClient />;
}
