import { Suspense } from 'react';
import EntitiesClient from './entities-client';
import { LoadingSpinner } from '@/components/loading-spinner';

export const metadata = {
  title: 'Entities | HomeLedger',
  description: 'Manage your companies and personal profiles',
};

export default function EntitiesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EntitiesClient />
    </Suspense>
  );
}
