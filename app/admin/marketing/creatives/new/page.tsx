import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreativeNewClient from './creative-new-client';

export const metadata = { title: 'Gerar Arte — Marketing Hub' };

interface Props {
  searchParams: { caption?: string; prompt?: string; hashtags?: string; topic?: string; captionEn?: string };
}

export default async function CreativeNewPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') redirect('/dashboard');

  return (
    <CreativeNewClient
      initialCaption={searchParams.caption || searchParams.captionEn || ''}
      initialPrompt={searchParams.prompt || ''}
      initialHashtags={searchParams.hashtags || ''}
      initialTopic={searchParams.topic || ''}
    />
  );
}
