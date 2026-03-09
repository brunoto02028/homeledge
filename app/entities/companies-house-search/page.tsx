import { Suspense } from 'react';
import CompaniesHouseSearchClient from './companies-house-search-client';
import { LoadingSpinner } from '@/components/loading-spinner';

export const metadata = {
  title: 'Companies House Search | Clarity & Co',
  description: 'Search and explore UK companies on Companies House',
};

export default function CompaniesHouseSearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CompaniesHouseSearchClient />
    </Suspense>
  );
}
