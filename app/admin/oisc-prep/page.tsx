import { Metadata } from 'next';
import { OISCPrepClient } from './oisc-prep-client';

export const metadata: Metadata = {
  title: 'OISC Level 1 Exam Prep | Clarity & Co',
  description: 'Study and practice for the OISC Level 1 Immigration Adviser exam',
};

export default function OISCPrepPage() {
  return <OISCPrepClient />;
}
