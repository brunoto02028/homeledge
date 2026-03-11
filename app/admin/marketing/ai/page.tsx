import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import MarketingAIClient from './marketing-ai-client';

export const metadata = { title: 'AI Composer — Clarity & Co' };

export default async function MarketingAIPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <MarketingAIClient />;
}
