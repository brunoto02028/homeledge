import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ResourcesClient from './resources-client';

export const metadata = { title: 'Resources — Marketing Hub' };

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <ResourcesClient />;
}
