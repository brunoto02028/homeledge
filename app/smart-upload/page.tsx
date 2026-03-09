import { Metadata } from 'next';
import SmartUploadClient from './smart-upload-client';

export const metadata: Metadata = { title: 'Smart Upload | Clarity & Co' };

export default function SmartUploadPage() {
  return <SmartUploadClient />;
}
