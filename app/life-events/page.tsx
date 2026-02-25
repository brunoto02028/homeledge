import { Metadata } from 'next';
import LifeEventsClient from './life-events-client';

export const metadata: Metadata = {
  title: 'Life Events | HomeLedger',
  description: 'Manage your life events and get AI-powered checklists for UK compliance',
};

export default function LifeEventsPage() {
  return <LifeEventsClient />;
}
