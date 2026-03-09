import { Suspense } from 'react';
import { CorrespondenceClient } from './correspondence-client';
import { LoadingSpinner } from '@/components/loading-spinner';

export const metadata = {
  title: 'Correspondence | Clarity & Co',
  description: 'Track and archive official correspondence — HMRC, Companies House, councils, banks, and legal notices',
};

export default function CorrespondencePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CorrespondenceClient />
    </Suspense>
  );
}
