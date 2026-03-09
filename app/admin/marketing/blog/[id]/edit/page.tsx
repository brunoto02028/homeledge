import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import BlogEditorClient from '../../blog-editor-client';

export const metadata = { title: 'Edit Article — Marketing Hub' };

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');

  const post = await (prisma as any).blogPost.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!post) notFound();

  return <BlogEditorClient postId={params.id} initialData={post} />;
}
