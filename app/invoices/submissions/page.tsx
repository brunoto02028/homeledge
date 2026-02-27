import { Suspense } from 'react';
import SubmissionsClient from './submissions-client';

export const metadata = {
  title: 'Invoice Submissions | HomeLedger',
  description: 'Manage and track invoice submissions to clients',
};

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><span className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <SubmissionsClient />
    </Suspense>
  );
}
