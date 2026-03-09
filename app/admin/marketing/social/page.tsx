import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SocialClient from './social-client';

export const metadata = { title: 'Instagram — Marketing Hub' };

export default async function SocialPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <SocialClient />;
}
