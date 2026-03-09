import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CreativesClient from './creatives-client';

export const metadata = { title: 'AI Creative Studio — Marketing Hub' };

export default async function CreativesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <CreativesClient />;
}
