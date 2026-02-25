import { Suspense } from 'react';
import CategoriesClient from './categories-client';
import { LoadingSpinner } from '@/components/loading-spinner';

export const metadata = {
  title: 'Categories | HomeLedger',
  description: 'Manage expense categories',
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CategoriesClient />
    </Suspense>
  );
}
