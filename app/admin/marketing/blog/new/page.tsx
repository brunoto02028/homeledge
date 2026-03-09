import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import BlogEditorClient from '../blog-editor-client';

export const metadata = { title: 'New Article — Marketing Hub' };

export default async function NewBlogPostPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');
  return <BlogEditorClient />;
}
