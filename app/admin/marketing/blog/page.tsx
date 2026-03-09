import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import BlogAdminClient from './blog-admin-client';

export const metadata = { title: 'Blog Management — Clarity & Co' };

export default async function BlogAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <BlogAdminClient />;
}
