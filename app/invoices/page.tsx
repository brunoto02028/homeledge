import { Suspense } from 'react';
import InvoicesClient from './invoices-client';
import { LoadingSpinner } from '@/components/loading-spinner';

export const metadata = {
  title: 'Invoices | HomeLedger',
  description: 'Upload and manage your household invoices',
};

export default function InvoicesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InvoicesClient />
    </Suspense>
  );
}
