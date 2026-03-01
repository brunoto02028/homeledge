import type { Metadata } from 'next';
import IntelligenceClient from './intelligence-client';

export const metadata: Metadata = {
  title: 'Global Intelligence Dashboard — HomeLedger',
  description: 'Real-time global news intelligence with sentiment analysis, UK market impact tracking, and interactive geospatial visualization. Monitor crisis events, opportunities, and financial signals worldwide.',
  openGraph: {
    title: 'Global Intelligence Dashboard — HomeLedger',
    description: 'Real-time global news intelligence with sentiment analysis and UK market impact tracking.',
    url: 'https://homeledger.co.uk/intelligence',
    type: 'website',
  },
};

export default function IntelligencePage() {
  return <IntelligenceClient />;
}
