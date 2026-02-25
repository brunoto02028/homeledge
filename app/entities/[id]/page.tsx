import { Suspense } from 'react';
import EntityDetailClient from './entity-detail-client';

export default function EntityDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><span className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <EntityDetailClient />
    </Suspense>
  );
}
