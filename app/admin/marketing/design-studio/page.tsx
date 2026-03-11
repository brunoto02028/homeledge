import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DesignStudioClient from './design-studio-client';

export const metadata = { title: 'Design Studio — Clarity & Co' };

export default async function DesignStudioPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <DesignStudioClient />;
}
