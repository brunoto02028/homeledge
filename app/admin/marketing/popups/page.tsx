import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PopupsClient from './popups-client';

export const metadata = { title: 'Pop-up Config — Marketing Hub' };

export default async function PopupsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <PopupsClient />;
}
