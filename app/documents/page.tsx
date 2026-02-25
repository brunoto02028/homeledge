import { Metadata } from 'next';
import { DocumentsClient } from './documents-client';

export const metadata: Metadata = {
  title: 'Capture & Classify | HomeLedger',
  description: 'Scan, upload and auto-classify your letters, bills, receipts and documents',
};

export default function DocumentsPage() {
  return <DocumentsClient />;
}
