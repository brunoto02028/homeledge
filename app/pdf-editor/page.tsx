import { Suspense } from 'react';
import PdfEditorClient from './pdf-editor-client';

export const metadata = { title: 'PDF Editor — Clarity & Co' };

export default function PdfEditorPage() {
  return (
    <Suspense>
      <PdfEditorClient />
    </Suspense>
  );
}
