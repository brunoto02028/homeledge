import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CoWorkClient from './cowork-client';

export const metadata = { title: 'Claude Co-Work — Clarity & Co' };

export default async function CoWorkPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <CoWorkClient />;
}
