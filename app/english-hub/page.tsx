import { Suspense } from 'react';
import EnglishHubClient from './english-hub-client';

export const metadata = {
  title: 'English Hub | HomeLedger',
  description: 'Learn English for life in the UK — AI tutor, voice practice, CEFR levels, exam guides',
};

export default function EnglishHubPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><span className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <EnglishHubClient />
    </Suspense>
  );
}
