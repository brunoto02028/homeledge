import { Suspense } from 'react';
import { InsuranceClient } from './insurance-client';
import { LoadingSpinner } from '@/components/loading-spinner';

export const metadata = {
  title: 'Insurance | HomeLedger',
  description: 'Manage your insurance policies — life, car, motorcycle, home, health, and travel',
};

export default function InsurancePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InsuranceClient />
    </Suspense>
  );
}
