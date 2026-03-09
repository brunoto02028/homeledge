import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MarketingClient from './marketing-client';

export const metadata = { title: 'Marketing Hub — Clarity & Co' };

export default async function MarketingPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <MarketingClient />;
}
